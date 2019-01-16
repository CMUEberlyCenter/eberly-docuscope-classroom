import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { asyncData } from '../../testing';

import { ScatterplotComponent } from './scatterplot.component';
import { ScatterplotData } from '../boxplot-data';
import { CorpusService } from '../corpus.service';
import { BoxplotDataService} from '../boxplot-data.service';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

@Component({selector: 'app-scatterplot-graph', template: ''})
class ScatterplotGraphStubComponent {
  @Input() points: ScatterplotData;
}

describe('ScatterplotComponent', () => {
  let component: ScatterplotComponent;
  let fixture: ComponentFixture<ScatterplotComponent>;

  beforeEach(async(() => {
    const ngx_spinner_service_spy = jasmine.createSpyObj('NgxSpinnerService', ['show', 'hide']);
    const corpusService_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
    corpusService_spy.getCorpus.and.returnValue(asyncData({
      course: 'stub',
      assignment: 'stub',
      documents: ['1', '2', '3'],
      intro: 'stub',
      stv_intro: 'stub'
    }));
    const dataService_spy = jasmine.createSpyObj('BoxplotDataService', ['getBoxPlotData', 'getScatterPlotData']);
    dataService_spy.getBoxPlotData.and.returnValue(asyncData({
      bpdata: [],
      outliers: []
    }));
    dataService_spy.getBoxPlotData.and.returnValue(asyncData({ spdata: [] }));

    TestBed.configureTestingModule({
      declarations: [ ScatterplotComponent,
                      NavStubComponent,
                      ScatterplotGraphStubComponent ],
      imports: [ FormsModule, NgxSpinnerModule ],
      providers: [
        { provide: CorpusService, useValue: corpusService_spy },
        { provide: NgxSpinnerService, useValue: ngx_spinner_service_spy },
        { provide: BoxplotDataService, useValue: dataService_spy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScatterplotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
