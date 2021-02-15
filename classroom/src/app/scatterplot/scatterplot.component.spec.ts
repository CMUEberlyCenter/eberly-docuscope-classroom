import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoogleChartsModule } from 'angular-google-charts';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { asyncData } from '../../testing';

import { ScatterplotComponent } from './scatterplot.component';
import { CorpusService } from '../corpus.service';
import { DsDataService } from '../ds-data.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SettingsService } from '../settings.service';

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

describe('ScatterplotComponent', () => {
  let component: ScatterplotComponent;
  let fixture: ComponentFixture<ScatterplotComponent>;

  beforeEach(waitForAsync(() => {
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
        {q1: .1, q2: .2, q3: .3, min: 0, max: .4,
          uifence: .6, lifence: 0,
          id: 'STUB_X', name: 'Stub X'},
        {q1: .2, q2: .3, q3: .4, min: 0, max: .5,
          uifence: .6, lifence: 0.1,
          id: 'STUB_Y', name: 'Stub Y'}],
      data: [{
        id: 'bogus_index', text: 'bogus text', ownedby: 'student',
        bogus: 0.5, STUB_X: 0.1, STUB_Y: 0.2, total_words: 2
      }, {
        id: 'bogus_index1', text: 'instructor text', ownedby: 'instructor',
        bogus: 0.4, STUB_X: 0.2, STUB_Y: 0.1, total_words: 2
      }]
    }));
    const settings_spy = jasmine.createSpyObj('SettingsService', ['getSettings']);
    settings_spy.getSettings.and.returnValue(asyncData({
      title: 'DocuScope Classroom',
      institution: 'CMU',
      unit: 100,
      homepage: 'https://www.cmu.edu/dietrich/english/research/docuscope.html',
      scatter: {width: 400, height: 400},
      boxplot: {cloud: true},
      stv: {max_clusters: 4}
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
        { provide: SettingsService, useValue: settings_spy },
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

  it('getData', waitForAsync(async () => {
    component.getData();
    await fixture.whenStable().then(() => expect(component.data).toBeDefined());
  }));

  it('genPoints null', () => {
    component.getData();
    return fixture.whenStable().then(() => {
      component.x_axis = null;
      expect(() => component.genPoints()).not.toThrow();
    });
  });

  it('on_select', () => fixture.whenStable().then(() => {
    expect(() => component.on_select()).not.toThrow();
  }));

  it('select_point', () => {
    window.open = jasmine.createSpy('open');
    component.select_point({
      dataTable: {
        getValue: () => '123'
      }
    }, {selection: [{row: 1}]});
    expect(window.open).toHaveBeenCalledWith('stv/123');
  });
});
