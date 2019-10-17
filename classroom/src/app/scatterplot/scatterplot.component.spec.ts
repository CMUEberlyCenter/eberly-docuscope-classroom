import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoogleChartsModule } from 'angular-google-charts';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { asyncData } from '../../testing';

import { ScatterplotComponent } from './scatterplot.component';
import { ScatterplotData } from '../boxplot-data';
import { CorpusService } from '../corpus.service';
import { BoxplotDataService} from '../boxplot-data.service';
import { NgxUiLoaderService, NgxUiLoaderModule } from 'ngx-ui-loader';

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
    const ngx_spinner_service_spy = jasmine.createSpyObj('NgxUiLoaderService', ['start', 'stop']);
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
      bpdata: [{'q1': .1, 'q2': .2, 'q3': .3, 'min': 0, 'max': .4, 'uifence': .6, 'lifence': 0, 'category': 'STUB_X'},
               {'q1': .2, 'q2': .3, 'q3': .4, 'min': 0, 'max': .5, 'uifence': .6, 'lifence': 0.1, 'category': 'STUB_Y'}],
      outliers: []
    }));
    dataService_spy.getScatterPlotData.and.returnValue(asyncData({
      spdata: [{
        catX: 1, catY: 2, title: 'Name', text_id: '123', ownedby: 'student'
      }, {
        catX: 2, catY: 1, title: 'model', text_id: '456', ownedby: 'instructor'
      }]
    }));

    TestBed.configureTestingModule({
      declarations: [ ScatterplotComponent,
                      NavStubComponent,
                      ScatterplotGraphStubComponent ],
      imports: [ FormsModule,
                 GoogleChartsModule,
                 MatCardModule,
                 MatFormFieldModule ],
      providers: [
        { provide: CorpusService, useValue: corpusService_spy },
        { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy },
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

  it('getData', async () => {
    component.getData();
    await fixture.whenStable().then(() => expect(component.data).toBeDefined());
    component.x_axis = '';
    await fixture.whenStable().then(() => expect(component.data).toBeDefined());
  });

  it('on_select', () => fixture.whenStable().then(() => {
    expect(() => component.on_select({})).not.toThrow();
  }));

  it('select_point', () => {
    window.open = jasmine.createSpy('open');
    component.select_point({
      dataTable: {
        getValue: () => '123'
      }
    }, [{row: 'row'}]);
    expect(window.open).toHaveBeenCalledWith('stv/123');
  });
});
