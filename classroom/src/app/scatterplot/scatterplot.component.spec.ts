import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { asyncData, FAKE_COMMON_DICTIONARY, Spied } from '../../testing';
import { AssignmentService } from '../assignment.service';
import { CommonDictionary, Entry } from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import { DsDataService } from '../ds-data.service';
import { SettingsService } from '../settings.service';
import { ScatterplotComponent } from './scatterplot.component';

@Component({ selector: 'app-category-select', template: '' })
class CategorySelectStubComponent {
  @Input() dictionary: CommonDictionary | undefined;
  @Input() selectedCategory: Entry | undefined;
}

describe('ScatterplotComponent', () => {
  let component: ScatterplotComponent;
  let fixture: ComponentFixture<ScatterplotComponent>;

  beforeEach(async () => {
    const commonDictionaryService_spy = jasmine.createSpyObj(
      'CommonDictionaryService',
      ['getJSON']
    ) as Spied<CommonDictionaryService>;
    commonDictionaryService_spy.getJSON.and.returnValue(
      asyncData(FAKE_COMMON_DICTIONARY)
    );
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
    dataService_spy.getData.and.returnValue(
      asyncData({
        categories: [
          {
            q1: 0.1,
            q2: 0.2,
            q3: 0.3,
            min: 0,
            max: 0.4,
            uifence: 0.6,
            lifence: 0,
            id: 'STUB_X',
            name: 'Stub X',
          },
          {
            q1: 0.2,
            q2: 0.3,
            q3: 0.4,
            min: 0,
            max: 0.5,
            uifence: 0.6,
            lifence: 0.1,
            id: 'STUB_Y',
            name: 'Stub Y',
          },
        ],
        data: [
          {
            id: 'bogus_index',
            text: 'bogus text',
            ownedby: 'student',
            bogus: 0.5,
            STUB_X: 0.1,
            STUB_Y: 0.2,
            total_words: 2,
          },
          {
            id: 'bogus_index1',
            text: 'instructor text',
            ownedby: 'instructor',
            bogus: 0.4,
            STUB_X: 0.2,
            STUB_Y: 0.1,
            total_words: 2,
          },
        ],
      })
    );
    const settings_spy = jasmine.createSpyObj('SettingsService', [
      'getSettings',
    ]) as Spied<SettingsService>;
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
    const assignment_spy = jasmine.createSpyObj('AssignemntService', [
      'setAssignmentData',
    ]) as Spied<AssignmentService>;

    await TestBed.configureTestingModule({
      declarations: [ScatterplotComponent, CategorySelectStubComponent],
      imports: [
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        NoopAnimationsModule,
      ],
      providers: [
        {
          provide: CommonDictionaryService,
          useValue: commonDictionaryService_spy,
        },
        { provide: CorpusService, useValue: corpusService_spy },
        { provide: AssignmentService, useValue: assignment_spy },
        { provide: SettingsService, useValue: settings_spy },
        { provide: DsDataService, useValue: dataService_spy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ScatterplotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', async () => {
    await expect(component).toBeTruthy();
  });

  it('on_select_x', async () => {
    await fixture.whenStable();
    component.on_select_x({
      name: 'STUB_X',
      label: 'Stub X',
      help: '',
    });
    await expect(component.x_category?.id).toBe('STUB_X');
    component.on_select_x({
      label: 'STUB_X',
      help: '',
    });
    await expect(component.x_category?.id).toBe('STUB_X');
  });
  it('on_select_y', async () => {
    await fixture.whenStable();
    component.on_select_y({ name: 'STUB_Y', label: 'Stub Y', help: '' });
    await expect(component.y_category?.id).toBe('STUB_Y');
    component.on_select_y({ label: 'STUB_Y', help: '' });
    await expect(component.y_category?.id).toBe('STUB_Y');
  });
  it('categories', async () => {
    await expect(component.categories).toEqual([]);
    await fixture.whenStable();
    await expect(component.categories.length).toBe(2);
  });
  it('is_model', () => {
    expect(
      component.is_model({
        ownedby: 'instructor',
        title: 'foo',
        id: '0',
        total_words: 0,
      })
    ).toBeTrue();
  });
  it('get_value', async () => {
    await expect(
      component.get_value(
        {
          q1: 0.1,
          q2: 0.2,
          q3: 0.3,
          min: 0,
          max: 0.4,
          uifence: 0.6,
          lifence: 0,
          id: 'STUB_X',
        },
        {
          id: 'bogus_index',
          title: 'A test essay in 2 words.',
          text: 'bogus text',
          ownedby: 'student',
          bogus: 0.5,
          STUB_X: 0.1,
          STUB_Y: 0.2,
          total_words: 2,
        }
      )
    ).toBe(10);
  });
  it('get_max_value', async () => {
    await expect(
      component.get_max_value(
        {
          q1: 0.1,
          q2: 0.2,
          q3: 0.3,
          min: 0,
          max: 0.4,
          uifence: 0.6,
          lifence: 0,
          id: 'STUB_X',
        },
        {
          q1: 0.2,
          q2: 0.3,
          q3: 0.4,
          min: 0,
          max: 0.5,
          uifence: 0.6,
          lifence: 0.1,
          id: 'STUB_Y',
        }
      )
    ).toBe(0);
    await fixture.whenStable();
    await expect(
      component.get_max_value(
        {
          q1: 0.1,
          q2: 0.2,
          q3: 0.3,
          min: 0,
          max: 0.4,
          uifence: 0.6,
          lifence: 0,
          id: 'bogus',
        },
        {
          q1: 0.2,
          q2: 0.3,
          q3: 0.4,
          min: 0,
          max: 0.5,
          uifence: 0.6,
          lifence: 0.1,
          id: 'STUB_Y',
        }
      )
    ).toBe(50);
  });

  it('point_tooltip', async () => {
    component.x_axis = { label: 'STUB_X', help: '' };
    component.y_axis = { label: 'STUB_Y', help: '' };
    await expect(
      component.point_tooltip({
        id: 'bogus_index',
        title: 'A test essay in 2 words.',
        text: 'bogus text',
        ownedby: 'student',
        bogus: 0.5,
        STUB_X: 0.1,
        STUB_Y: 0.2,
        total_words: 2,
      })
    ).toBeTruthy();
  });
});
