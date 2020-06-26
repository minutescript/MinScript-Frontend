import { Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {RecordComponent} from '../record/record.component';
import {Item} from '../interfaces/item';
import {UserSessionService} from '../services/user-session.service';
import {SearchService} from '../services/search.service';
import {ResultEntry} from '../interfaces/result-entry';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';

/**
 * Component defining playback area of the app, including transcript list, transcripts and audio player.
 *
 * @author Matt Grabara
 * @version 29/06/2019
 */
@Component({
  selector: 'app-playback',
  templateUrl: './playback.component.html',
  styleUrls: ['./playback.component.css'],
  preserveWhitespaces: true // required for correct transcript display
})
export class PlaybackComponent implements OnDestroy, OnInit {
  // defining references to native elements
  @ViewChild('player') player;
  @ViewChild('sidenav', {static: true}) sidenav;

  public currentItem: Item; // currently selected item
  private audioSrc: string; // URL of the recording of the currently selected item
  private lastSpeaker: number; // if diarization enabled, store ID of the last speaker
  private initialised = false; // true if metadata available
  private playlistEmpty = false; // true if anything on the playlist
  private displayPrompt = false; // true if new prompt needs to be displayed
  private emptyItem: Item = {
    file_name: '',
    format: '',
    length: 0,
    size: 0,
    timestamp: null,
    transcript: '',
    transcript_status: '',
    uri: '',
    word_ts: null,
    title: ''
  };

  /**
   * Constructor injecting services and modules.
   *
   * @author  Matt Grabara
   * @version 29/06/2019
   *
   * @param session reference to the UserSessionService
   * @param cdRef reference to the Angular Change Detector
   * @param search  reference to the SearchService
   * @param recordDialog  reference to the Material Dialog module used for loading RecordComponent as a modal
   * @param route reference to the ActivatedRoute interface to fetch parameters provided in the URL
   * @param router  reference to the Angular Router module providing possibility for navigation without refresh
   */
  constructor(private session: UserSessionService, private cdRef: ChangeDetectorRef, private search: SearchService,
              private recordDialog: MatDialog, private deleteDialog: MatDialog, private route: ActivatedRoute, private router: Router) {
  }

  /**
   * Event handler for the FAB. Opens RecordComponent in a modal.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  openRecordDialog() {
    const recordDialogRef = this.recordDialog.open(RecordComponent, {
      height: '320px',
      width: '550px'
    }).afterClosed().subscribe(result => {
      if (result == 'PROCESS_STARTED' && !this.getAudioSrc()) {
        this.displayPrompt = false;
        this.recordingOnClick(this.session.getItemArray()[0]);
      }
    });
  }

  /**
   * Event handler for selecting any of the search results.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @param result  search result selected
   */
  selectSearchResult(result: ResultEntry) {
    this.setCurrent(result.item).then(() => {
      this.setTime(result.item.word_ts[result.startPlayIndex].s);
      this.sidenav.toggle();
    });
  }

  /**
   * Event handler for selecting any of the recordings on the playlist.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @param item  recording selected
   */
  recordingOnClick(item: Item) {
    this.router.navigate(['/', item.file_name.split('.')[0]]).then(() => {
      this.setCurrent(item);
    });
  }

  /**
   * Checks whether user is allowed to record.
   *
   * @author Matt Grabara
   * @version 22/02/2020
   */
  canRecord(): boolean {
    return  (this.session.getAssignedMinutes() > this.session.getUsedMinutes())
      && this.session.isUserEnabled();
  }

  /**
   * Load selected recording and its transcript.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @param item  item to load
   */
  setCurrent(item: Item): Promise<void> {
    return new Promise<any>(resolve => {
      // check if item not already selected to avoid unnecessary reload
      if (this.currentItem !== item) {
        // replace current item with the selected item
        this.currentItem = item;
        // notify change detector to update layout and avoid errors
        this.cdRef.detectChanges();
        // retrieve item URL
        this.session.getRecordingURL(item.uri).then((url) => {
          // update audio URL
          this.audioSrc = url;
          // notify change detector to update layout
          this.cdRef.detectChanges();
        }).then(() => {
          // resolve promise when change is made
          resolve();
        });
      } else { resolve(); } // resolve promise when no change needed
    });
  }

  /**
   * Set audio player to a desired position.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   * @param time  position in milliseconds
   */
  setTime(time: number) {
    // convert time to seconds
    const timeInSec = time/1000;
    // change audio player's currentTime property
    this.player.nativeElement.currentTime = timeInSec.toString();
  }

  /**
   * Display recording length as a human-readable string.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   * @param audioLength length of the recording in seconds
   * @returns recording length as hh:mm:ss
   */
  getPlayTime(audioLength: number): string {
    // get number of seconds to display
    const seconds = audioLength % 60;
    const secondsStr = (seconds < 10) ? '0' + seconds.toString() : seconds.toString();
    // get number of minutes to display
    const minutes = Math.floor(audioLength / 60);
    const minutesStr = (minutes < 10) ? '0' + minutes.toString() : minutes.toString();
    // get number of hours to display
    const hours = Math.floor(minutes / 60);
    const hoursStr = (hours < 10) ? '0' + hours.toString() : hours.toString();
    // return the output string
    return hoursStr + ':' + minutesStr + ':' + secondsStr;
  }

  /**
   * Retrieves URL for the currently selected recording.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @returns URL of the selected recording that can be used natively by the web browser
   */
  getAudioSrc() {
    return this.audioSrc;
  }

  /**
   * Checks whether speaker has changed in the transcript. 
   * Does not work for the first word of the transcript due to Angular digest cycle.
   * 
   * @author Matt Grabara
   * @version 14/09/2019
   * @param speaker ID of the speaker of the new word
   */
  isNewSpeaker(speaker: number): boolean {
    if (this.lastSpeaker === speaker)
      return false;
    else this.lastSpeaker = speaker;
    return true;
  }

  /**
   * Handles action after delete recording button pressed.
   * 
   * @author Matt Grabara
   * @version 16/04/2020
   * 
   * @param item item to be deleted
   */
  deleteRecording(item: Item) {
    //event.preventDefault();
    //event.stopImmediatePropagation();
    const deleteDialogRef = this.deleteDialog.open(DeleteDialogComponent, {
      height: '320px',
      width: '320px',
      data: item
    });

    deleteDialogRef.afterClosed().subscribe(result => {
      if ((result === 'SUCCESS') && (item == this.currentItem)) {
        if (this.session.getItemArray().length > 0) {
          let navigateIndex = 0;
          if (item == this.session.getItemArray()[0])
            navigateIndex = 1;
          this.recordingOnClick(this.session.getItemArray()[navigateIndex]);
          // this.setCurrent(this.session.getItemArray()[navigateIndex])
          // this.router.navigate(['/', this.session.getItemArray()[navigateIndex].file_name.split('.')[0]]);
        } else {
          this.router.navigate(['/']).then(() => {
            this.currentItem = this.emptyItem;
            this.audioSrc = '';
            this.displayPrompt = true;
            this.cdRef.detectChanges();
          });
        }
      }
    });
  }

  /**
   * Checks if playlist is empty.
   * 
   * @author Matt Grabara
   * @version 16/04/2020
   * 
   * @returns true if playlist is empty, false otherwise
   */
  isPlaylistEmpty(): boolean {
    return this.playlistEmpty;
  }

  /**
   * Checks if connected to observables.
   * 
   * @author Matt Grabara
   * @version 16/04/2020
   * 
   * @returns true if initialised, false otherwise
   */
  isInitialised(): boolean {
    return this.initialised;
  }

  /**
   * Checks if prompt for the first recording should be displayed.
   * 
   * @author Matt Grabara
   * @version 16/04/2020
   * 
   * @returns true if prompt should appear, false otherwise
   */
  isPromptDisplayed(): boolean {
    return this.displayPrompt;
  }

  /**
   * Prepares component view, checks for a recording parameter passed in the URL
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  ngOnInit() {
    // wait for subscription to services
    this.session.prepareObservables().then(() => {
      this.initialised = true;
      // check if any recording available
      if (this.session.getItemArray().length > 0) {
        this.playlistEmpty = false;
        let linkRecFound = false;

        // check if link contains recording name (e.g. https://.../<recording name>)
        if (this.route.snapshot.params.rec) {
          // if yes, load recording
          let recName: String = this.route.snapshot.params.rec;
          recName = recName.split('.')[0];

          // navigate to the top recording 
          for (let item of this.session.getItemArray()) {
            if (item.file_name.split('.')[0] === recName) {
              this.setCurrent(item);
              linkRecFound = true;
            }
          }
        }

        // if recording not found or link doesn't contain recording name, set first one in the array
        if (!linkRecFound && this.session.getItemArray()) {
          // 
          this.router.navigate(['/', this.session.getItemArray()[0].file_name.split('.')[0]]);
        }
      } else {
        this.displayPrompt = true;
      }
    });
  }

  /**
   * Detaches the view from change detector on view destroy
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  ngOnDestroy() {
    // when view is changed, disconnect from change detector
    this.cdRef.detach();
  }
}
