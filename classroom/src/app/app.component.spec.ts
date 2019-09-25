import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';

import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { MatDialogModule, MatIconModule, MatToolbarModule } from '@angular/material';

@Component({selector: 'app-about', template: ''})
class AboutStubComponent {}

@Component({selector: 'app-messages', template: ''})
class MessagesStubComponent {}

// tslint:disable-next-line
@Component({selector: 'router-outlet', template: ''})
class RouterOutletStubComponent {}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AboutStubComponent,
        AppComponent,
        MessagesStubComponent,
        RouterOutletStubComponent
      ],
      imports: [ MatDialogModule, MatIconModule, MatToolbarModule, NgxUiLoaderModule ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    app = fixture.debugElement.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it(`should have as title 'DocuScope Classroom @ CMU'`, () => {
    expect(app.title).toEqual('DocuScope Classroom @ CMU');
  });

  it('should render title in the toolbar', () => {
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('mat-toolbar > span').textContent).toContain('DocuScope Classroom @ CMU');
  });
});
