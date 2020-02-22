/**
 * Interface used to store user metadata loaded from the database.
 * <br />Should be changed only when the data model is modified.
 *
 * @author  Matt Grabara
 * @version 22/02/2020
 */
export interface UserMetadata {
  accepted_tcs: Date;
  enabled: boolean;
//  DEPRECATED:
//  max_num_recordings: number;
//  num_recordings: number;
  assigned_minutes: number;
  used_minutes: number;
}
