import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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
        bubble: { initial_level: 'Category' },
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
      imports: [
        MatCardModule,
        MatButtonToggleModule,
        MatDialogModule,
        MatFormFieldModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: AssignmentService, useValue: assignment_spy },
        {
          provide: CommonDictionaryService,
          useValue: commonDictionaryService_spy,
        },
        { provide: CorpusService, useValue: corpusService_spy },
        { provide: DsDataService, useValue: dataService_spy },
        { provide: SettingsService, useValue: settings_spy },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BubbleChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', async () => {
    void expect(component).toBeTruthy();
    await fixture.whenStable();
    component.ngAfterViewChecked();
  });

  it('columns', async () => {
    await fixture.whenStable();
    void expect(component.columns).toEqual([
      'title',
      'Political',
      'Tense',
      'Helpers',
      'FakeCategory',
      'Unnamed',
    ]);
    component.depth = 'Subcategory';
    void expect(component.columns).toEqual([
      'title',
      'Impeachable',
      'FutureTense',
      'PastTense',
      'Somewhat',
      'FalseSubcategory',
      'Subunnamed',
    ]);
    component.depth = 'Cluster';
    void expect(component.columns).toEqual([
      'title',
      'Insurection',
      'Lying',
      'future',
      'Past',
      'pastperfect',
      'facilitate',
      'bogus',
      'unamedcluster',
    ]);
    component.depth = 'Bad';
    void expect(component.columns).toEqual(['title']);
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
          path: 'Bogus',
        }
      )
    ).toEqual({
      title: 'An example',
      value: 50,
      proportion: 20,
      category: 'Bogus Data',
      path: 'Bogus',
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
      path: 'Insurection',
    });
  });
  it('genTooltip', () => {
    void expect(
      component.genTooltip({
        title: 'foo',
        path: 'bar',
        value: 1.234,
        proportion: 20,
        category: 'fb',
      })
    ).toBe(`Name: foo
    Category: bar
    Value: 1.23`);
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
