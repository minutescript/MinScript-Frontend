import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import {auth} from 'firebase/app';
import {MatDialog, MatSnackBar} from '@angular/material';
import {UserMetadata} from '../interfaces/user-metadata';
import {Observable, Subscription} from 'rxjs';
import {User} from 'firebase';
import {Item} from '../interfaces/item';
import {TermsDialogComponent} from '../terms-dialog/terms-dialog.component';
import {Router} from '@angular/router';
import {SearchService} from './search.service';
import {RecordingMetadata} from '../interfaces/recording-metadata';

/**
 * Service handling sign in and user-specific requests
 *
 * @author Matt Grabara
 * @version 29/06/2019
 */
@Injectable({
  providedIn: 'root'
})
export class UserSessionService {

  private userMetadataSub: Subscription;
  private userMetaCollection: any;
  private itemArray: Item[];
  private itemArraySub: Subscription;
  private userMetadata: UserMetadata;
  private idToken: string;
  private uid: string;
  private initialised: boolean;

  /**
   * Constructor injecting services and modules.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @param afAuth  reference to AngularFireAuth
   * @param afStorage reference to AngularFireStorage
   * @param db  reference to AngularFirestore
   * @param termsDialog reference to Material Dialog module used to load T&Cs dialog
   * @param snackBar  reference to Material Snack Bar to display user information on a snackbar
   * @param router  reference to Angular Router module to allow navigation without page refresh
   * @param search  reference to SearchService to allow for initilisation and refresh of the transcript search index
   */
  constructor(private afAuth: AngularFireAuth, private afStorage: AngularFireStorage, private db: AngularFirestore,
              private termsDialog: MatDialog, private snackBar: MatSnackBar, private router: Router, private search: SearchService) {
  }

  /**
   * Retrieves user data in orderly manner through websockets.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  prepareObservables(): Promise<void> {
    return new Promise<void>(resolve => {
      // detect whether user logged in
      this.afAuth.auth.onAuthStateChanged((user) => {
        if (user) {
          // if user data available, get UID and idToken
          this.uid = user.uid;

          user.getIdToken().then(idToken => {
            if (idToken) {
              // use for debugging
              // console.log(idToken);
              this.idToken = idToken;
            }
          });

          // subscribe for user metadata
          this.userMetaCollection = this.db.collection('user_metadata').doc(user.uid);
          this.userMetadataSub = this.userMetaCollection.valueChanges().subscribe((userMetadata: UserMetadata) => {
            // process user metadata, display snackbars if appropriate
            this.processMetadata(userMetadata);
            if (userMetadata) {
              this.userMetadata = userMetadata;

              // once everything ready, get item array
              const itemArrayObservable = this.db.collection('users').doc(user.uid)
                .collection<Item>('recordings', ref => ref.orderBy('timestamp', 'desc'))
                .valueChanges();
              this.itemArraySub = itemArrayObservable.subscribe((itemArray) => {
                this.itemArray = itemArray;

                // start building search index
                this.search.buildIndex(this.itemArray);

                // done, resolve
                this.initialised = true;
                resolve();
              });
            }
          });
        }
      });
      });
  }

  /**
   * Passes information from user metadata to the user interface.
   * Checks whether account is active and T&Cs accepted.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @param userMetadata  user metadata
   */
  processMetadata(userMetadata: UserMetadata) {
    if (!!userMetadata) {
      if (!userMetadata.enabled) {
        this.snackBar.open('Your account has been disabled. Contact support.');
      } else if (!userMetadata.accepted_tcs) {
        // console.log('Dialog should pop up now.');
        const termsDialogRef = this.termsDialog.open(TermsDialogComponent, {
          height: '210px',
          width: '500px',
          disableClose: true,
          data: {idToken: this.idToken}
        });
      }

      if (userMetadata.num_recordings === userMetadata.max_num_recordings) {
        this.snackBar.open('You have reached maximum number of recordings for your account!', '', {
          duration: 5000,
        });
      }
    } else {
      this.snackBar.open('Your account needs to be activated. We will email you when this happens.');
    }
  }

  /**
   * Event handler for clicking the log in button.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  login() {
    this.afAuth.auth.signInWithPopup( new auth.GoogleAuthProvider()).then(async() => {
      await this.prepareObservables();
    });
  }

  /**
   * Event handler for clicking the log out button.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  logout() {
    this.afAuth.auth.signOut().then(() => {
      this.itemArraySub.unsubscribe();
      this.userMetadataSub.unsubscribe();
      this.router.navigate(['/']);
    });
  }

  /**
   * Checks whether user account is enabled.
   *
   * @returns true if user account is enabled, false otherwise or when no information available
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  isUserEnabled(): boolean {
    return (!!this.userMetadata) ? this.userMetadata.enabled : false;
  }

  /**
   * Getter for the authorisation state object.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  getAuthState(): Observable<User> {
    return this.afAuth.authState;
  }

  /**
   * Getter for the ID token.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  getToken(): string {
    return this.idToken;
  }

  /**
   * Getter for the number of recordings user has already recorded.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  getNumRecordings() {
    return this.userMetadata.num_recordings;
  }

  /**
   * Getter for the maximum number of recordings available to the user.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  getMaxNumRecordings(): number {
    return this.userMetadata.max_num_recordings;
  }

  /**
   * Retrieves file's URL from the cloud storage URI.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @param uri file's cloud storage URI
   */
  getRecordingURL(uri: string) {
    return this.afStorage.storage.refFromURL(uri).getDownloadURL();
  }

  /**
   * Getter for the array of recordings uploaded by the user.
   *
   * @author  Matt Grabara
   * @version 29/06/2019
   *
   * @return array of items belonging to the user
   */
  getItemArray(): Item[] {
    return this.itemArray;
  }

  /**
   * Inserts recording metadata to the database
   * @param metadata  recording metadata
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  setRecordingMetadata(metadata: RecordingMetadata): Promise<void> {
    return this.db.collection('users').doc(this.uid).collection('recordings').doc(metadata.file_name).set(metadata);
  }
}
