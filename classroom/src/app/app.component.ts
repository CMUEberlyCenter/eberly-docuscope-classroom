import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoadingService } from './loading.service';
import { HeaderComponent } from './header/header.component';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [HeaderComponent, RouterOutlet, AsyncPipe, MatProgressSpinnerModule],
})
export class AppComponent {
  loading$ = this.loader.loading$;
  constructor(public loader: LoadingService) {}
}
