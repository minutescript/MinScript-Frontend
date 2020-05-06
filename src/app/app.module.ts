import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { MaterialModule } from './material';
import { FirebaseConfig } from './settings/firebase-config';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { RecordComponent } from './record/record.component';
import { PlaybackComponent } from './playback/playback.component';
import { TermsDialogComponent } from './terms-dialog/terms-dialog.component';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { PrintTranscriptComponent } from './print-transcript/print-transcript.component';

const appRoutes: Routes = [
  { path: '', component: PlaybackComponent, pathMatch: 'full' },
  { path: ':rec', component: PlaybackComponent },
  { path: 'print/:rec', component: PrintTranscriptComponent }];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RecordComponent,
    PlaybackComponent,
    TermsDialogComponent,
    DeleteDialogComponent,
    PrintTranscriptComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    AngularFireModule.initializeApp(FirebaseConfig), // replace default settings in firebase-config.ts with your own
    AngularFireDatabaseModule,
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireStorageModule,
    RouterModule.forRoot(
      appRoutes
)
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [RecordComponent, TermsDialogComponent, DeleteDialogComponent]
})
export class AppModule { }
