/**
 * Interface defining recording metadata
 *
 * @author Matt Grabara
 * @version 29/06/2019
 */
export interface RecordingMetadata {
  timestamp: Date;
  length: number;
  format: string;
  size: number;
  uri: string;
  file_name: string;
  title: string;
}
