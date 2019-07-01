import {Component} from '@angular/core';
import {UserSessionService} from '../services/user-session.service';

/**
 * Component defining the log in button and user menu when logged in.
 *
 * @author  Matt Grabara
 * @version 29/06/2019
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  /**
   * Constructor injecting UserSessionService.
   *
   * @author  Matt Grabara
   * @version 29/06/2019
   *
   * @param session reference to the UserSessionService
   */
  constructor(private session: UserSessionService) { }

  /**
   * Retrieves numbers of recordings assigned to the user.
   */
  getMaxNumRecordings() {
    return this.session.getMaxNumRecordings();
  }

  /**
   * Retrieves number of recordings made by the user.
   */
  getNumAvailableRecordings() {
    return this.session.getMaxNumRecordings() - this.session.getNumRecordings();
  }

  /**
   * Event handler for logout button.
   */
  login() {
    this.session.login();
  }

  /**
   * Event handler for login button.
   */
  logout() {
    this.session.logout();
  }

  /**
   * Retrieves AuthState object from UserSessionService.
   */
  getAuthState() {
    return this.session.getAuthState();
  }

  /**
   * Checks whether user is enabled.
   */
  isUserEnabled() {
    return this.session.isUserEnabled();
  }
}
