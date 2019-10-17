import { Component, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { asyncData } from '../../testing/async-observable-helpers';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ReportComponent } from './report.component';
import { CorpusService } from '../corpus.service';
import { ReportService } from '../report.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

describe('ReportComponent', () => {
  let component: ReportComponent;
  let fixture: ComponentFixture<ReportComponent>;
  let corpus_service_spy;
  let report_service_spy;
  let ngx_spinner_service_spy;
  let child_spy;

  beforeEach(async(() => {
    corpus_service_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
    corpus_service_spy.getCorpus.and.returnValue(asyncData([]));
    report_service_spy = jasmine.createSpyObj('ReportService', ['getReports']);
    report_service_spy.getReports.and.returnValue(asyncData(''));
    ngx_spinner_service_spy = jasmine.createSpyObj('NgxUiLoaderService',
                                                   ['start', 'stop']);

    TestBed.configureTestingModule({
      declarations: [ ReportComponent,
                      NavStubComponent ],
      imports: [
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: CorpusService, useValue: corpus_service_spy },
        { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy },
        { provide: ReportService, useValue: report_service_spy },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('generate_report', () => fixture.whenStable().then(() => {
    fixture.detectChanges();
    spyOn(window.URL, 'createObjectURL').and.returnValue('bogus.pdf');
    spyOn(window.URL, 'revokeObjectURL');
    component.download_link.nativeElement.click = jasmine.createSpy('click');
    component.generate_report({});
    fixture.detectChanges();

    expect(ngx_spinner_service_spy.start).toHaveBeenCalled();
    expect(report_service_spy.getReports).toHaveBeenCalled();
    expect(ngx_spinner_service_spy.stop).toHaveBeenCalled();
  }));

});
