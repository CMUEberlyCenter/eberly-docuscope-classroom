/* Component for navigating between tools

  The available tools differ depending on if the user is an Instructor.
*/
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
})
export class NavComponent {
  constructor(private _route: ActivatedRoute) {}

  /**
   * Is the given tab the current tab.
   * @param id of the tab.
   */
  is_current(id: string): boolean {
    return id === `/${this._route.snapshot.url.join('/')}`;
  }
  /** Test if the user is an instructor. */
  is_instructor(): boolean {
    const qmap = this._route.snapshot.queryParamMap;
    return (
      qmap && qmap.has('roles') && qmap.get('roles').search(/Instructor/i) >= 0
    );
  }
}
