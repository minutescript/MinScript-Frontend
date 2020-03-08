
import {interval as observableInterval} from 'rxjs';

import { takeWhile } from 'rxjs/operators';
import {Component, ViewChild} from '@angular/core';


import {DomSanitizer} from '@angular/platform-browser';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {UploadService} from '../services/upload.service';
import {UserSessionService} from '../services/user-session.service';
import {TokenUploadResponse} from '../interfaces/token-upload-response';

import {RECORD_LANGUAGES} from '../settings/record-languages';
import {BACKEND_URL} from '../settings/backend-config'; // edit this file to add your backend URL

// declaring WebAudioRecorder imported in index.html
declare var WebAudioRecorder;

/**
 * Component defining contents of the record dialog.
 *
 * @author Matt Grabara
 * @version 29/06/2019
 */
@Component({
  selector: 'app-record',
  templateUrl: './record.component.html',
  styleUrls: ['./record.component.css']
})

export class RecordComponent {
  @ViewChild('fileSelector', {static: true}) fileSelector;

  private ms: any;
  public isRecording = false;
  public audioCtx: AudioContext;
  public currentRecordingTime: string;
  public recordTitle: string; // stores recording title given by user
  public showSaveDialog = false;
  private finalBlob: any;
  public blobURL: string;
  public trustedURL: any;
  private processStatus: any;
  public showRecordBtn = true;
  public showProcessing = false;
  public showUploadProgress = false;
  public showComplete = false;
  public disableRecBtn = false;
  private preventTabClosing = false;
  public uploadSelected = false;
  private audioRecorder: any;
  private diarize = false; // true if user wants to diarize the recording
  private autoDetect = false; // true if user wants to automatically detect number of speakers
  private noSpeakers = 2; // default number of speakers
  private mainLang = 'en-US'; // default recognition language
  private notEnglish = false; // enabled recognition in other languages
  private lastLang: string; // for the convenience of the undecided end user
  readonly RECORD_LANGUAGES = RECORD_LANGUAGES; // make constant visible to the template
  private recordedMinutes: number; // recording time for billing purposes
  private reachedLimit = false; // when true, info displayed user reached number of available minutes

  /**
   * Constructor adds event listener to prevent accidental tab closure during recording.
   *
   * @author  Matt Grabara
   * @version 29/06/2019
   *
   * @param session reference to the UserSessionService
   * @param upload  reference to the UploadService
   * @param sanitizer reference to DomSanitizer
   * @param snackBar  reference to Material snack bar
   * @param recordDialog  reference to self to allow the component so close the dialog it is loaded into
   */
  constructor(private session: UserSessionService, private upload: UploadService, private sanitizer: DomSanitizer,
              private snackBar: MatSnackBar, public recordDialog: MatDialogRef<RecordComponent>) {

    // compliant with current specification
    window.onbeforeunload = (e) => {
      if (this.preventTabClosing) {
        e.preventDefault();

        return '\o/';
      }
    };

    // compliant with Chromium-based browsers
    window.addEventListener("beforeunload", (event) => {
      if (this.preventTabClosing) {
        // Most browsers.
        event.preventDefault();

        // Chrome/Chromium based browsers still need this one.
        event.returnValue = '\o/';
      }
    });
  }

  /**
   * Shows file picker to upload a recording.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  uploadDialogBtn() {
    this.uploadSelected = true;
  }

  /**
   * Handles upload of the user-provided recording file.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  uploadRecordingBtn() {
    const fileSelected = this.fileSelector.nativeElement.files[0];
    this.onRecordingReadyToUpload(fileSelected);
  }

  /**
   * Retrieves length of the recording in seconds.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @param blob  blob with the recording to check
   * @returns promise returning duration of the recording
   */
  getAudioDuration = (blob: Blob): Promise<number>  => {
    return new Promise<number>(resolve => {
      const audioFile = new FileReader();
      audioFile.readAsArrayBuffer(blob);
      audioFile.onloadend = () => {
        const audioReadCtx = new AudioContext();
        const readBlob = audioFile.result;
        audioReadCtx.decodeAudioData(<ArrayBuffer>readBlob, (buffer) => {
          const duration = Math.ceil(buffer.duration);
          audioReadCtx.close();
          resolve(duration);
        });
      };
    });
  }

  /**
   * Starts recording.
   *
   * @author Matt Grabara
   * @version 22/02/2020
   *
   * @param stream  stream object passed by mediaDevices.getUserMedia
   */
  startRecording = (stream) => {
    this.showRecordBtn = false;
    this.recordDialog.disableClose = true;
    this.preventTabClosing = true;
    this.isRecording = true;
    this.uploadSelected = false;
    this.audioCtx = new AudioContext();
    const audioSource = this.audioCtx.createMediaStreamSource(stream);
    this.ms = stream;

    // initialise recording timer
    observableInterval(100).pipe(takeWhile(() => this.isRecording)).subscribe(i => {
      // for billing
      this.recordedMinutes = Math.floor(this.audioCtx.currentTime / 60);
      if (this.recordedMinutes == this.session.getAssignedMinutes() - this.session.getUsedMinutes()) {
        this.reachedLimit = true;
        this.clickStopBtn();
      }
      // for display
      this.currentRecordingTime = this.getCurrentRecordingTime();
    });
    // initialise audio recorder
    this.audioRecorder = new WebAudioRecorder(audioSource, {workerDir: 'assets/recorder/', numChannels: 1, encoding: 'wav', options: {timeLimit: 6000}});
    // start recording
    this.audioRecorder.startRecording();
    // bind event handler what to the onComplete event
    this.audioRecorder.onComplete = (stream, blob) => {
      this.onRecordingReadyToUpload(blob);
    };

  }

  /**
   * Shares with the UI whether credit limit was reached
   *
   * @author Matt Grabara
   * @version 18/02/2020
   * 
   */
  isLimitReached() {
    return this.reachedLimit;
  }

  /**
   * Event handler for completed recording
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @param blob  audio blob with the recording
   */
  onRecordingReadyToUpload(blob: Blob) {
    this.showSaveDialog = true;
    this.finalBlob = blob;
    this.blobURL = URL.createObjectURL(blob);
    this.trustedURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.blobURL);
  }

  resetDefaultLang() {
    if (!this.notEnglish) {
      this.lastLang = this.mainLang;
      this.mainLang = 'en-US';
    } else if (this.lastLang) {
      this.mainLang = this.lastLang;
    }
  }

  /**
   * Event handler for submit button in the save recording form
   * 
   * @author Matt Grabara
   * @version 14/09/2019
   */
  onSubmit() {
    this.showSaveDialog = false;
    this.uploadRecordingFunc(this.finalBlob);
    this.audioCtx.close();
  }

  /**
   * Event handler for clicking the button to cancel recording
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  cancelRecord() {
    this.showSaveDialog = false;
    this.showRecordBtn = true;
    this.finalBlob = null;
    this.blobURL = null;
    this.trustedURL = null;
    this.recordDialog.disableClose = false;
    this.preventTabClosing = false;
    this.diarize = false;
    this.autoDetect = false;
    this.noSpeakers = 2;
    this.recordTitle = '';
    this.reachedLimit = false;
  }

  /**
   * Starts upload process to the cloud storage bucket.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   *
   * @param blob  blob with audio recording
   */
  uploadRecordingFunc(blob: Blob) {
    this.uploadSelected = false;
    this.showUploadProgress = true;

    this.upload.uploadRecording(blob).then(uploadRecRes => {
      this.showUploadProgress = false;
      this.showProcessing = true;
      this.getAudioDuration(blob).then((duration) => {
        if (this.recordTitle === '') {this.recordTitle = uploadRecRes.name; }
        let metadata = {
          timestamp: new Date(uploadRecRes.timeCreated),
          length: duration,
          format: 'audio/wave',
          size: Math.ceil(uploadRecRes.size / (1024 * 1024)),
          uri: 'gs://minutescript/' + uploadRecRes.fullPath,
          file_name: uploadRecRes.name,
          title: this.recordTitle,
          main_lang: this.mainLang,
          extra_lang: [], // TO DO: allow user to select languages
          diarize: this.diarize
        };

        if (this.diarize && !this.autoDetect) {
          metadata['no_speakers'] = this.noSpeakers;
        }

        const sendMeta = this.session.setRecordingMetadata(metadata).then(() => {
          this.upload.uploadToken(BACKEND_URL + '/transcription', uploadRecRes.name, this.mainLang, [], 
                                  this.diarize, this.autoDetect, this.noSpeakers).then((res: TokenUploadResponse) => {
            this.processStatus = res;
            if (res.status === 'PROCESS_STARTED') {
              this.showProcessing = false;
              this.showRecordBtn = true;
              this.disableRecBtn = false;
              this.showComplete = true;
              this.recordDialog.disableClose = true;
              this.preventTabClosing = false;
              this.reachedLimit = false;
              this.recordDialog.close();
            } else if (this.processStatus.status === 'FILE_NOT_FOUND') {
              this.snackBar.open('File not found!', '', {
                duration: 500,
              });
            }

          });
        });
      });
    });
  }

  /**
   * Retrieve ongoing recording length in a human readable form.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @returns string with recording time in format hh:mm:ss
   */
  getCurrentRecordingTime() {
    if (this.audioCtx != null) {
      const number = Math.floor(this.audioCtx.currentTime);

      const seconds = number % 60;
      const secondsStr = (seconds < 10) ? '0' + seconds.toString() : seconds.toString();

      const minutes = Math.floor(number / 60);
      const minutesStr = (minutes < 10) ? '0' + minutes.toString() : minutes.toString();

      const hours = Math.floor(minutes / 60);
      const hoursStr = (hours < 10) ? '0' + hours.toString() : hours.toString();

      return (hoursStr + ':' + minutesStr + ':' + secondsStr);
    } else {return ''; }
  }

  /**
   * Event handler for clicking "Start recording" button
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  clickRecordBtn = () => {
    const constraints = {audio: true, video: false};
    navigator.mediaDevices.getUserMedia(constraints).then(this.startRecording);
   }

  /**
   * Event handler for clicking "Stop recording" button
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  clickStopBtn = () => {
    this.ms.getTracks()[0].stop();
    this.isRecording = false;
    this.audioRecorder.finishRecording();
  }

}
