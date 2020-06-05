import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoogleChartsModule } from 'angular-google-charts';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { asyncData } from '../../testing';

import { ScatterplotComponent } from './scatterplot.component';
import { CorpusService } from '../corpus.service';
import { DocuScopeData, DsDataService } from '../ds-data.service';
import { NgxUiLoaderService, NgxUiLoaderModule } from 'ngx-ui-loader';

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

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
    const dataService_spy = jasmine.createSpyObj('DsDataService', ['getData']);
    dataService_spy.getData.and.returnValue(asyncData({
      categories: [
        {'q1': .1, 'q2': .2, 'q3': .3, 'min': 0, 'max': .4,
        'uifence': .6, 'lifence': 0,
        'id': 'STUB_X', 'name': 'Stub X'},
        {'q1': .2, 'q2': .3, 'q3': .4, 'min': 0, 'max': .5,
        'uifence': .6, 'lifence': 0.1,
        'id': 'STUB_Y', 'name': 'Stub Y'}],
      data: [{
        id: 'bogus_index', text: 'bogus text', ownedby: 'student',
        bogus: 0.5, STUB_X: 0.1, STUB_Y: 0.2, total_words: 2
      }]
    }));

    TestBed.configureTestingModule({
      declarations: [ ScatterplotComponent,
        NavStubComponent ],
      imports: [ FormsModule,
        GoogleChartsModule,
        MatCardModule,
        MatFormFieldModule ],
      providers: [
        { provide: CorpusService, useValue: corpusService_spy },
        { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy },
        { provide: DsDataService, useValue: dataService_spy }
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
