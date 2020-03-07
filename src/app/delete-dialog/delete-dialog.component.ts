import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Item } from '../interfaces/item';
import { UserSessionService } from '../services/user-session.service';

@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.css']
})
export class DeleteDialogComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public item: Item, public deleteDialog: MatDialogRef<DeleteDialogComponent>, private session: UserSessionService) { }

  ngOnInit(): void {
  }

  deleteItem(item: Item) {
    this.session.deleteRecording(item).then(() => {
      this.deleteDialog.close('SUCCESS')
    });
  }

}
