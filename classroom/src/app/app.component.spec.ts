import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-messages',
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
class MessagesStubComponent {}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        MessagesStubComponent,
        HeaderComponent,
        MatDialogModule,
        MatIconModule,
        MatToolbarModule,
        MatTooltipModule,
        RouterModule.forRoot([]),
      ],
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    app = fixture.debugElement.componentInstance as AppComponent;
    fixture.detectChanges();
  });

  it('should create the app', async () => {
    expect(app).toBeTruthy();
  });

  it('should render title in the toolbar', async () => {
    const compiled = fixture.debugElement.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-toolbar > span')?.textContent).toContain(
      'DocuScope Classroom @ CMU'
    );
  });
});
