import {firestore} from 'firebase';

/**
 * Interface used to store the transcript entry loaded from the database.
 * <br />Should be changed only when the data model is modified.
 *
 * @author  Matt Grabara
 * @version 29/06/2019
 */
export interface Item {
  file_name: string;
  format: string;
  length: number;
  size: number;
  timestamp: firestore.Timestamp;
  transcript: string;
  transcript_status: string;
  uri: string;
  word_ts: any;
  title: string;
}
