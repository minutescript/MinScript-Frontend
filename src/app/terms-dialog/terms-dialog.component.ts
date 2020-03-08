import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BACKEND_URL} from '../settings/backend-config'; // edit this file to add your backend URL

// simple interface for handling ID tokens received from the dialog caller
export interface IDToken {
  idToken: string;
}

/**
 * Component containing view and logic for T&Cs dialog.
 *
 * @author Matt Grabara
 * @version 29/06/2019
 */
@Component({
  selector: 'app-terms-dialog',
  templateUrl: './terms-dialog.component.html',
  styleUrls: ['./terms-dialog.component.css']
})
export class TermsDialogComponent implements OnInit {

  /**
   * Constructor injecting services and modules.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @param data  data passed from the calling component
   * @param httpClient  reference to the HttpClient
   * @param termsDialog reference to itself, so the modal can control when to close itself
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: IDToken,
              private httpClient: HttpClient, public termsDialog: MatDialogRef<TermsDialogComponent>) { }

  ngOnInit() {
  }

  /**
   * Event handler for accepting T&Cs.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   */
  acceptTerms() {
    // prepare Authorization header
    const authHeaders = new HttpHeaders().append('Authorization', this.data.idToken);
    // upload header to the backend endpoint
    this.httpClient
      .post(BACKEND_URL + '/tcs', {}, {headers: authHeaders}).subscribe((res: Response) => {
        if (res.status.toString() === 'TCS_SUCCESSFULLY_ACCEPTED') {
          this.termsDialog.close();
        }
        }, err => { });
  }

}
