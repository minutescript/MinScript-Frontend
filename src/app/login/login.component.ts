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
   * @deprecated
   */
  getMaxNumRecordings() {
    return this.session.getMaxNumRecordings();
  }

  /**
   * Retrieves number of recordings made by the user.
   * @deprecated
   */
  getNumAvailableRecordings() {
    return this.session.getMaxNumRecordings() - this.session.getNumRecordings();
  }
  
  /**
   * Retrieves numbers of minutes assigned in the current billing cycle.
   */
  getAssignedMinutes() {
    return this.session.getAssignedMinutes();
  }

  /**
   * Retrieves number of minutes available to the user.
   */
  getAvailableMinutes() {
    return this.session.getAssignedMinutes() - this.session.getUsedMinutes();
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
