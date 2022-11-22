import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
/*import {
  NavigationEnd,
  NavigationStart,
  Router,
  RouterEvent,
} from '@angular/router';*/

@Component({
  selector: 'app-tool-layout',
  templateUrl: './tool-layout.component.html',
  styleUrls: ['./tool-layout.component.scss'],
})
export class ToolLayoutComponent {
  constructor(private route: ActivatedRoute) {}
  /*loading: boolean;
  constructor(router: Router) {
    this.loading = false;
    router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationStart) {
        this.loading = true;
      } else if (event instanceof NavigationEnd) {
        this.loading = false;
      }
    });
  }*/
  is_instructor(): boolean {
    const qmap = this.route.snapshot.queryParamMap;
    return (
      Boolean(qmap?.has('roles')) &&
      qmap.get('roles').search(/Instructor/i) >= 0
    );
  }
}
