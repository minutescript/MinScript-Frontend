/**
 * Interface representing backend response to token upload.
 *
 * @author Matt Grabara
 * @version 29/06/2019
 */
export interface TokenUploadResponse {
  status: string;
  idToken: string;
}
