import { Component, OnInit } from '@angular/core';
import { UserSessionService } from '../services/user-session.service';
import { ActivatedRoute } from '@angular/router';
import { Item } from '../interfaces/item';

@Component({
  selector: 'app-print-transcript',
  templateUrl: './print-transcript.component.html',
  styleUrls: ['./print-transcript.component.css'],
  preserveWhitespaces: true // required for correct transcript display
})
export class PrintTranscriptComponent implements OnInit {
  private initialised = false;
  private playlistEmpty = true;
  private currentItem: Item;

  constructor(private session: UserSessionService, private route: ActivatedRoute) { }

  ngOnInit(): void {
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
              this.currentItem = item;
              linkRecFound = true;
            }
          }
        }
      }
    });
  }

  getCurrentItem(): Item {
    return this.currentItem
  }

}
