import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FAKE_COMMON_DICTIONARY } from '../../testing';
import { AssignmentService } from '../assignment.service';
import { CommonDictionary, Entry } from '../common-dictionary';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import { DsDataService } from '../ds-data.service';
import { SettingsService } from '../settings.service';
import { ScatterplotComponent } from './scatterplot.component';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { provideRouter, RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-category-select',
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
class CategorySelectStubComponent {
  @Input()
  dictionary: CommonDictionary | undefined;
  @Input()
  selectedCategory: Entry | undefined;
}

describe('ScatterplotComponent', () => {
  let component: ScatterplotComponent;
  let fixture: ComponentFixture<ScatterplotComponent>;

  beforeEach(async () => {
    const commonDictionaryService_spy = {
      getJSON: vi
        .fn()
        .mockName('CommonDictionaryService.getJSON')
        .mockReturnValue(of(FAKE_COMMON_DICTIONARY)),
    } as unknown as Mocked<CommonDictionaryService>;
    const corpusService_spy = {
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
    const dataService_spy = {
      getData: vi
        .fn()
        .mockName('DsDataService.getData')
        .mockReturnValue(
          of({
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
        ),
    } as unknown as Mocked<DsDataService>;
    const settings_spy = {
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
            stv: { max_clusters: 4 },
          })
        ),
    } as unknown as Mocked<SettingsService>;
    const assignment_spy = {
      setAssignmentData: vi
        .fn()
        .mockName('AssignemntService.setAssignmentData'),
    } as unknown as Mocked<AssignmentService>;

    await TestBed.configureTestingModule({
      declarations: [ScatterplotComponent],
      imports: [
        CategorySelectStubComponent,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        CommonModule,
        RouterLink,
        MatTooltipModule,
      ],
      providers: [
        provideRouter([]),
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
    expect(component).toBeTruthy();
  });

  it('on_select_x', async () => {
    await fixture.whenStable();
    component.on_select_x({
      name: 'STUB_X',
      label: 'Stub X',
      help: '',
    });
    expect(component.x_category?.id).toBe('STUB_X');
    component.on_select_x({
      label: 'STUB_X',
      help: '',
    });
    expect(component.x_category?.id).toBe('STUB_X');
  });
  it('on_select_y', async () => {
    await fixture.whenStable();
    component.on_select_y({ name: 'STUB_Y', label: 'Stub Y', help: '' });
    expect(component.y_category?.id).toBe('STUB_Y');
    component.on_select_y({ label: 'STUB_Y', help: '' });
    expect(component.y_category?.id).toBe('STUB_Y');
  });
  it('categories', async () => {
    await fixture.whenStable();
    expect(component.categories.length).toBe(2);
  });
  it('is_model', () => {
    expect(
      component.is_model({
        ownedby: 'instructor',
        title: 'foo',
        id: '0',
        total_words: 0,
      })
    ).toBe(true);
  });
  it('get_value', async () => {
    expect(
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
    await fixture.whenStable();
    expect(
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
    ).toBe(20);
    await fixture.whenStable();
    expect(
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
    expect(
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
