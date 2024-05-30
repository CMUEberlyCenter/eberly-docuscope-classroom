import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterTestingModule } from '@angular/router/testing';
import {} from 'jasmine';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

@Component({ selector: 'app-messages', template: '' })
class MessagesStubComponent {}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent, HeaderComponent, MessagesStubComponent],
      imports: [
        MatDialogModule,
        MatIconModule,
        MatToolbarModule,
        MatTooltipModule,
        RouterTestingModule,
      ],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    app = fixture.debugElement.componentInstance as AppComponent;
    fixture.detectChanges();
  });

  it('should create the app', async () => {
    await expect(app).toBeTruthy();
  });

  it('should render title in the toolbar', async () => {
    const compiled = fixture.debugElement.nativeElement as HTMLElement;
    await expect(
      compiled.querySelector('mat-toolbar > span')?.textContent
    ).toContain('DocuScope Classroom @ CMU');
  });
});
