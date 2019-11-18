import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { asyncData } from '../../testing/async-observable-helpers';
import { GoogleChartsModule } from 'angular-google-charts';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';

import { RankComponent } from './rank.component';
import { RankData } from '../boxplot-data';
import { CorpusService } from '../corpus.service';
import { BoxplotDataService } from '../boxplot-data.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({selector: 'app-rank-graph', template: ''})
class RankGraphStubComponent {
  @Input() rank_data: RankData;
  @Input() max_value: number;
}

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

describe('RankComponent', () => {
  let component: RankComponent;
  let fixture: ComponentFixture<RankComponent>;
  let boxplot_data_service_spy;
  let corpus_service_spy;

  beforeEach(async(() => {
    corpus_service_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
    corpus_service_spy.getCorpus.and.returnValue(asyncData([]));
    boxplot_data_service_spy = jasmine.createSpyObj('BoxplotDataService', ['getBoxPlotData', 'getRankedList']);
    boxplot_data_service_spy.getBoxPlotData.and.returnValue(asyncData({
      bpdata: [
        {'q1': .1, 'q2': .2, 'q3': .3, 'min': 0, 'max': .4,
         'uifence': .6, 'lifence': 0,
         'category': 'STUB_X', 'category_label': 'Stub X'},
        {'q1': .2, 'q2': .3, 'q3': .4, 'min': 0, 'max': .5,
         'uifence': .6, 'lifence': 0.1,
         'category': 'STUB_Y', 'category_label': 'Stub Y'}],
      outliers: []
    }));
    boxplot_data_service_spy.getRankedList.and.returnValue(asyncData({
      result: [
        {'index': 'stub_index', 'text': 'stub_text', 'value': 1, 'ownedby': 'stub_owner'}
      ]}));
    const ngx_spinner_service_spy = jasmine.createSpyObj('NgxUiLoaderService', ['start', 'stop']);

    TestBed.configureTestingModule({
      declarations: [ RankComponent,
                      NavStubComponent,
                      RankGraphStubComponent ],
      imports: [ FormsModule,
                 GoogleChartsModule,
                 MatCardModule,
                 MatFormFieldModule ],
      providers: [
        { provide: CorpusService, useValue: corpus_service_spy },
        { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy },
        { provide: BoxplotDataService, useValue: boxplot_data_service_spy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('gets data', async () => {
    component.ngOnInit();
    return fixture.whenStable().then(() => {
      expect(corpus_service_spy.getCorpus).toHaveBeenCalled();
      expect(boxplot_data_service_spy.getBoxPlotData).toHaveBeenCalled();
      expect(boxplot_data_service_spy.getRankedList).toHaveBeenCalled();
    });
  });

  it('on_select', () => {
    component.on_select({});
    expect(boxplot_data_service_spy.getRankedList).toHaveBeenCalled();
  });

  it('get_label', () => {
    return fixture.whenStable().then(() => {
      expect(component.get_label('STUB_X')).toBe('Stub X');
      expect(component.get_label('STUB_Y')).toBe('Stub Y');
    });
  });
});
