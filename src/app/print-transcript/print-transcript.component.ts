import { Component, OnInit, Input } from '@angular/core';
import { Item } from '../interfaces/item';

@Component({
  selector: 'app-print-transcript',
  templateUrl: './print-transcript.component.html',
  styleUrls: ['./print-transcript.component.css'],
  preserveWhitespaces: true // required for correct transcript display
})
export class PrintTranscriptComponent implements OnInit {
  @Input() item: Item;

  private lastSpeaker: number; // if diarization enabled, store ID of the last speaker

  constructor() { }

  ngOnInit(): void {
  }

  getItem(): Item {
    return this.item;
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

}
