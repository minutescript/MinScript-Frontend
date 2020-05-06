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

  constructor() { }

  ngOnInit(): void {
  }

  getItem(): Item {
    return this.item;
  }

}
