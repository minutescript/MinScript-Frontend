import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {AngularFireStorage} from '@angular/fire/storage';
import {auth, storage} from 'firebase/app';
import * as shortid from 'shortid';
import {UserSessionService} from './user-session.service';
import {TokenUploadResponse} from '../interfaces/token-upload-response';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private progress = 0;
  private isUploading = false;

  /**
   * Constructor injecting services and modules.
   *
   * @author  Matt Grabara
   * @version 29/06/2019
   *
   * @param http  refernce to the HttpClient
   * @param afStorage reference to AngularFireStorage
   * @param session reference to UserSessionService
   */
  constructor(private http: HttpClient, private afStorage: AngularFireStorage, private session: UserSessionService) {
  }

  /**
   * Uploads the recording to the cloud storage bucket.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @param inputBlob blob with the recording to upload
   */
  uploadRecording(inputBlob: Blob): Promise<any> {
    return new Promise((resolve) => {

      const storageRef = this.afStorage.storage.ref();
      const fileName = shortid.generate() + '.wav';

      const audioChild = storageRef.child('recordings/' + auth().currentUser.uid + '/' + fileName);
      const metadata = { contentType: 'audio/wave' };
      const uploadTask = audioChild.put(inputBlob, metadata);

      // handle upload task event

      uploadTask.on(storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
        (snapshot) => {
          this.isUploading = true;
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          this.progress = (uploadTask.snapshot.bytesTransferred / uploadTask.snapshot.totalBytes) * 100;
          // console.log('Upload is ' + progress + '% done');
          /* switch (uploadTask.snapshot.state) {
            case storage.TaskState.PAUSED: // or 'paused'
              console.log('Upload is paused');
              break;
            case storage.TaskState.RUNNING: // or 'running'
              console.log('Upload is running');
              break;
          } */
        }, (error) => {

          // A full list of error codes is available at
          switch (error.message) {
            case 'storage/unauthorized':
              // User doesn't have permission to access the object
              break;

            case 'storage/canceled':
              // User canceled the upload
              break;

            case 'storage/unknown':
              // Unknown error occurred, inspect error.serverResponse
              break;
          }
        }, () => {
          audioChild.getMetadata().then((metadata) => {
            this.progress = 0;
            resolve(metadata);
          });
        });
    });
  }

  /**
   * Retrieves upload progress.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @returns upload progress percentage
   */
  getProgress(): number {
    return this.progress;
  }

  /**
   * Uploads user ID token and file name to the backend to initiate transcription process.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @param backend endpoint URL
   * @param fileName  name of the file to be transcribed
   */
  uploadToken(destination: string, fileName: string): Promise<TokenUploadResponse> {
    return new Promise<any>(resolve => {
      // add ID token to the Authorization header of the request
      const authHeaders = new HttpHeaders().append('Authorization', this.session.getToken());
      // post information to the backend
      this.http.post(destination, {fileName}, {headers: authHeaders}).subscribe((res: Response) => {
        // return upload status
        resolve({status: res.status, idToken: this.session.getToken()});
        }, err => {
        // return error information
        resolve({status: err.status, idToken: this.session.getToken()});
      });
    });
  }
}
