import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterTestingModule } from '@angular/router/testing';
import { } from 'jasmine';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';

@Component({selector: 'app-messages', template: ''})
class MessagesStubComponent {}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        HeaderComponent,
        MessagesStubComponent,
      ],
      imports: [
        HttpClientTestingModule,
        MatDialogModule,
        MatIconModule,
        MatToolbarModule,
        MatTooltipModule,
        NgxUiLoaderModule,
        RouterTestingModule
      ],
      providers: [
      ],
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

  it('should render title in the toolbar', () => {
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('mat-toolbar > span').textContent).toContain('DocuScope Classroom @ CMU');
  });
});
