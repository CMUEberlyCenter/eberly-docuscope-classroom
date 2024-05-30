import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tool-layout',
  templateUrl: './tool-layout.component.html',
  styleUrls: ['./tool-layout.component.scss'],
})
export class ToolLayoutComponent {
  constructor(private route: ActivatedRoute) {}
  is_instructor(): boolean {
    const qmap = this.route.snapshot.queryParamMap;
    return /Instructor/i.test(qmap.get('roles') ?? '');
  }
}
