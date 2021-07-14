import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { asyncData, Spied, FAKE_COMMON_DICTIONARY } from 'src/testing';
import { FAKE_DS_DATA } from 'src/testing/fake-ds-data';
import { AssignmentService } from '../assignment.service';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import { DsDataService } from '../ds-data.service';
import { SettingsService } from '../settings.service';

import { BubbleChartComponent } from './bubble-chart.component';

@Component({ selector: 'app-nav', template: '' })
class NavStubComponent {}

describe('BubbleChartComponent', () => {
  let component: BubbleChartComponent;
  let fixture: ComponentFixture<BubbleChartComponent>;

  beforeEach(async () => {
    const ngx_spinner_service_spy = jasmine.createSpyObj('NgxSpinnerService', [
      'start',
      'stop',
    ]) as Spied<NgxUiLoaderService>;
    const corpusService_spy = jasmine.createSpyObj('CorpusService', [
      'getCorpus',
    ]) as Spied<CorpusService>;
    corpusService_spy.getCorpus.and.returnValue(
      asyncData({
        course: 'stub',
        assignment: 'stub',
        documents: ['1', '2', '3'],
        intro: 'stub',
        stv_intro: 'stub',
      })
    );
    const dataService_spy = jasmine.createSpyObj('DsDataService', [
      'getData',
    ]) as Spied<DsDataService>;
    dataService_spy.getData.and.returnValue(asyncData(FAKE_DS_DATA));
    const settings_spy: Spied<SettingsService> = jasmine.createSpyObj(
      'SettingsService',
      ['getSettings']
    ) as Spied<SettingsService>;
    settings_spy.getSettings.and.returnValue(
      asyncData({
        title: 'DocuScope Classroom',
        institution: 'CMU',
        unit: 100,
        homepage:
          'https://www.cmu.edu/dietrich/english/research/docuscope.html',
        scatter: { width: 400, height: 400 },
        boxplot: { cloud: true },
        stv: { max_clusters: 4 },
      })
    );
    const commonDictionaryService_spy = jasmine.createSpyObj(
      'CommonDictionaryService',
      ['getJSON']
    ) as Spied<CommonDictionaryService>;
    commonDictionaryService_spy.getJSON.and.returnValue(
      asyncData(FAKE_COMMON_DICTIONARY)
    );
    const assignment_spy = jasmine.createSpyObj('AssignemntService', [
      'setAssignmentData',
    ]) as Spied<AssignmentService>;

    await TestBed.configureTestingModule({
      declarations: [BubbleChartComponent, NavStubComponent],
      imports: [MatCardModule],
      providers: [
        { provide: AssignmentService, useValue: assignment_spy },
        {
          provide: CommonDictionaryService,
          useValue: commonDictionaryService_spy,
        },
        { provide: CorpusService, useValue: corpusService_spy },
        { provide: DsDataService, useValue: dataService_spy },
        { provide: SettingsService, useValue: settings_spy },
        { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BubbleChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    void expect(component).toBeTruthy();
  });

  it('columns', async () => {
    await fixture.whenStable();
    void expect(component.columns).toEqual([
      'name',
      'Political',
      'Tense',
      'Helpers',
      'FakeCategory',
      'Unnamed',
    ]);
  });
  it('getCell', async () => {
    await fixture.whenStable();
    void expect(
      component.getCell(
        {
          id: 'id0',
          title: 'An example',
          ownedby: 'student',
          total_words: 2,
          Insurection: 0.5,
          bogus: 0.5,
        },
        {
          name: 'bogus',
          label: 'Bogus Data',
          help: 'A completely bogus category.',
        }
      )
    ).toEqual({
      title: 'An example',
      value: 50,
      proportion: 20,
      category: 'Bogus Data',
    });
    void expect(
      component.getCell(
        {
          id: 'id0',
          title: 'An example',
          ownedby: 'student',
          total_words: 2,
          Insurection: 0.5,
          bogus: 0.5,
        },
        {
          label: 'Insurection',
          help: 'A completely bogus category.',
        }
      )
    ).toEqual({
      title: 'An example',
      value: 50,
      proportion: 20,
      category: 'Insurection',
    });
  });
  it('legend_offset', async () => {
    await fixture.whenStable();
    void expect(component.legend_offset(0)).toBe(0);
    void expect(component.legend_offset(1)).toBeCloseTo(18, 0);
  });
  it('open', () => {
    window.open = jasmine.createSpy('open');
    component.open('123');
    expect(window.open).toHaveBeenCalledWith('stv/123');
    component.open('');
    void expect(window.open).toHaveBeenCalledTimes(1);
  });
});
