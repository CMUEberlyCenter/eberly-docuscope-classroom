import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { RouterTestingModule } from '@angular/router/testing';
import {} from 'jasmine';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';

@Component({ selector: 'app-messages', template: '' })
class MessagesStubComponent {}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;

  beforeEach(waitForAsync(() => {
    void TestBed.configureTestingModule({
      declarations: [AppComponent, HeaderComponent, MessagesStubComponent],
      imports: [
        HttpClientTestingModule,
        MatDialogModule,
        MatIconModule,
        MatToolbarModule,
        MatTooltipModule,
        RouterTestingModule,
      ],
      providers: [],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    app = fixture.debugElement.componentInstance as AppComponent;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    void expect(app).toBeTruthy();
  });

  it('should render title in the toolbar', () => {
    const compiled = fixture.debugElement.nativeElement as HTMLElement;
    void expect(
      compiled.querySelector('mat-toolbar > span')?.textContent
    ).toContain('DocuScope Classroom @ CMU');
  });
});
