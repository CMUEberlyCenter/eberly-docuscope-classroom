import { Component, Input } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { TagCloudModule } from 'angular-tag-cloud-module';
import { asyncData } from '../../testing';

import { BoxplotComponent } from './boxplot.component';
import { BoxplotData, RankData } from '../boxplot-data';
import { CorpusService } from '../corpus.service';
import { BoxplotDataService} from '../boxplot-data.service';
import { NgxUiLoaderService, NgxUiLoaderModule } from 'ngx-ui-loader';

@Component({selector: 'app-boxplot-graph', template: ''})
class BoxplotGraphStubComponent {
  @Input() boxplot: BoxplotData;
  @Input() max_value: number;
}

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

@Component({selector: 'app-rank-graph', template: ''})
class RankGraphStubComponent {
  @Input() rank_data: RankData;
  @Input() max_value: number;
}

describe('BoxplotComponent', () => {
  let component: BoxplotComponent;
  let fixture: ComponentFixture<BoxplotComponent>;

  beforeEach(async(() => {
    const ngx_spinner_service_spy = jasmine.createSpyObj('NgxSpinnerService', ['start', 'stop']);
    const corpusService_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
    corpusService_spy.getCorpus.and.returnValue(asyncData({
      course: 'stub',
      assignment: 'stub',
      documents: ['1', '2', '3'],
      intro: 'stub',
      stv_intro: 'stub'
    }));
    const dataService_spy = jasmine.createSpyObj('BoxplotDataService', ['getBoxPlotData', 'getRankedList']);
    dataService_spy.getBoxPlotData.and.returnValue(asyncData({
      bpdata: [],
      outliers: []
    }));
    dataService_spy.getRankedList.and.returnValue(asyncData({ result: [] }));

    TestBed.configureTestingModule({
      declarations: [ BoxplotComponent,
                      BoxplotGraphStubComponent,
                      NavStubComponent,
                      RankGraphStubComponent ],
      imports: [ MatCardModule, TagCloudModule],
      providers: [
        { provide: BoxplotDataService, useValue: dataService_spy },
        { provide: CorpusService, useValue: corpusService_spy },
        { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoxplotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
