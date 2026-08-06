import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FAKE_COMMON_DICTIONARY } from '../../testing';
import { FAKE_DS_DATA } from '../../testing/fake-ds-data';
import { AssignmentService } from '../assignment.service';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import { DsDataService } from '../ds-data.service';
import { SettingsService } from '../settings.service';
import { BubbleChartComponent } from './bubble-chart.component';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

@Component({
  selector: 'app-nav',
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
class NavStubComponent {}

describe('BubbleChartComponent', () => {
  let component: BubbleChartComponent;
  let fixture: ComponentFixture<BubbleChartComponent>;

  beforeEach(async () => {
    const corpusService_spy: Mocked<CorpusService> = {
      getCorpus: vi
        .fn()
        .mockName('CorpusService.getCorpus')
        .mockReturnValue(
          of({
            course: 'stub',
            assignment: 'stub',
            documents: ['1', '2', '3'],
            intro: 'stub',
            stv_intro: 'stub',
          })
        ),
    } as unknown as Mocked<CorpusService>;
    const dataService_spy: Mocked<DsDataService> = {
      getData: vi
        .fn()
        .mockName('DsDataService.getData')
        .mockReturnValue(of(FAKE_DS_DATA)),
    } as unknown as Mocked<DsDataService>;
    const settings_spy: Mocked<SettingsService> = {
      getSettings: vi
        .fn()
        .mockName('SettingsService.getSettings')
        .mockReturnValue(
          of({
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
        ),
    } as unknown as Mocked<SettingsService>;
    const commonDictionaryService_spy: Mocked<CommonDictionaryService> = {
      getJSON: vi
        .fn()
        .mockName('CommonDictionaryService.getJSON')
        .mockReturnValue(of(FAKE_COMMON_DICTIONARY)),
    } as unknown as Mocked<CommonDictionaryService>;
    const assignment_spy = {
      setAssignmentData: vi
        .fn()
        .mockName('AssignemntService.setAssignmentData'),
    } as unknown as Mocked<AssignmentService>;

    await TestBed.configureTestingModule({
      imports: [
        BubbleChartComponent,
        NavStubComponent,
        MatCardModule,
        MatButtonToggleModule,
        MatFormFieldModule,
      ],
      providers: [
        provideRouter([]),
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
});
