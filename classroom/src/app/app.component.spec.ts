import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';

import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { MatDialogModule, MatIconModule, MatToolbarModule } from '@angular/material';

@Component({selector: 'app-messages', template: ''})
class MessagesStubComponent {}

// tslint:disable-next-line
@Component({selector: 'router-outlet', template: ''})
class RouterOutletStubComponent {}

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        MessagesStubComponent,
        RouterOutletStubComponent
      ],
      imports: [ MatDialogModule, MatIconModule, MatToolbarModule, NgxUiLoaderModule ]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'DocuScope Classroom @ CMU'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('DocuScope Classroom @ CMU');
  });

  it('should render title in the toolbar', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('mat-toolbar > span').textContent).toContain('DocuScope Classroom @ CMU');
  });
});
