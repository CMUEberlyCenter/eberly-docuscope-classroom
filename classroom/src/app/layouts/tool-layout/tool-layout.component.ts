import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import {
  ActivatedRoute,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

@Component({
  selector: 'app-tool-layout',
  templateUrl: './tool-layout.component.html',
  styleUrls: ['./tool-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule],
})
export class ToolLayoutComponent {
  constructor(private route: ActivatedRoute) {}
  is_instructor(): boolean {
    const qmap = this.route.snapshot.queryParamMap;
    return /Instructor/i.test(qmap.get('roles') ?? '');
  }
}
