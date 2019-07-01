import {Item} from './item';

/**
 * Interface defining a result entry displayed to the user.
 *
 * @author  Matt Grabara
 * @version 29/06/2019
 */
export interface ResultEntry {
  item: Item; // transcript object
  index: number; // first word matching the search
  startPlayIndex: number; // position from which result will be played
  excerpt: string;  // short excerpt of the transcript
}
