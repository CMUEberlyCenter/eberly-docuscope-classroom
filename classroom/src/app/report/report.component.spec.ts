import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { asyncData } from '../../testing/async-observable-helpers';

import { ReportComponent } from './report.component';
import { CorpusService } from '../corpus.service';
import { ReportService } from '../report.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

describe('ReportComponent', () => {
  let component: ReportComponent;
  let fixture: ComponentFixture<ReportComponent>;

  beforeEach(async(() => {
    const corpus_service_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
    corpus_service_spy.getCorpus.and.returnValue(asyncData([]));
    const report_service_spy = jasmine.createSpyObj('ReportService', ['getReports']);
    report_service_spy.getReports.and.returnValue(asyncData([]));
    const ngx_spinner_service_spy = jasmine.createSpyObj('NgxSpinnerService', ['show', 'hide']);

    TestBed.configureTestingModule({
      declarations: [ ReportComponent,
                      NavStubComponent ],
      imports: [ FormsModule ],
      providers: [
        { provide: CorpusService, useValue: corpus_service_spy },
        { provide: NgxSpinnerService, useValue: ngx_spinner_service_spy },
        { provide: ReportService, useValue: report_service_spy }
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
    expect(component).toBeTruthy();
  });
});
