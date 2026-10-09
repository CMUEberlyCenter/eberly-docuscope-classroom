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
import { CategoryData, DocuScopeData, DsDataService } from '../ds-data.service';
import { SettingsService } from '../settings.service';
import { FrequencyComponent } from './frequency.component';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { of } from 'rxjs';

@Component({
  selector: 'app-frequency-graph',
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
class FrequencyGraphStubComponent {
  @Input()
  data!: DocuScopeData;
  @Input()
  category!: CategoryData;
  @Input()
  unit!: number;
}

@Component({
  selector: 'app-category-select',
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
class CategorySelectStubComponent {
  @Input()
  dictionary: CommonDictionary | undefined;
  @Input()
  selectedCategory: Entry | undefined;
}

describe('FrequencyComponent', () => {
  let component: FrequencyComponent;
  let fixture: ComponentFixture<FrequencyComponent>;

  let ds_data_service_spy: Mocked<DsDataService>;
  let corpus_service_spy: Mocked<CorpusService>;
  let settings_spy: Mocked<SettingsService>;
  let assignment_spy: Mocked<AssignmentService>;
  let commonDictionaryService_spy: Mocked<CommonDictionaryService>;

  beforeEach(async () => {
    corpus_service_spy = {
      getCorpus: vi
        .fn()
        .mockName('CorpusService.getCorpus')
        .mockReturnValue(of([])),
    } as unknown as Mocked<CorpusService>;
    ds_data_service_spy = {
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
            ],
          })
        ),
    } as unknown as Mocked<DsDataService>;
    settings_spy = {
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
          })
        ),
    } as unknown as Mocked<SettingsService>;
    assignment_spy = {
      setAssignmentData: vi
        .fn()
        .mockName('AssignemntService.setAssignmentData'),
    } as unknown as Mocked<AssignmentService>;
    commonDictionaryService_spy = {
      getJSON: vi
        .fn()
        .mockName('CommonDictionaryService.getJSON')
        .mockReturnValue(of(FAKE_COMMON_DICTIONARY)),
    } as unknown as Mocked<CommonDictionaryService>;

    await TestBed.configureTestingModule({
      declarations: [
        FrequencyComponent,
        FrequencyGraphStubComponent,
        CategorySelectStubComponent,
      ],
      imports: [FormsModule, MatCardModule, MatFormFieldModule],
      providers: [
        { provide: AssignmentService, useValue: assignment_spy },
        {
          provide: CommonDictionaryService,
          useValue: commonDictionaryService_spy,
        },
        { provide: SettingsService, useValue: settings_spy },
        { provide: CorpusService, useValue: corpus_service_spy },
        { provide: DsDataService, useValue: ds_data_service_spy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FrequencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    return expect(component).toBeTruthy();
  });

  it('gets data', async () => {
    component.ngOnInit();
    await fixture.whenStable();
    void expect(corpus_service_spy.getCorpus).toHaveBeenCalled();
    void expect(ds_data_service_spy.getData).toHaveBeenCalled();
  });
  it('categories', async () => {
    // void expect(component.categories).toEqual([]);
    await fixture.whenStable();
    void expect(component.categories).toEqual([
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
      },
    ]);
  });

  it('onSelectCategory', async () => {
    //component.ngOnInit();
    await fixture.whenStable();
    component.onSelectCategory({ label: 'STUB_X', help: '' });
    await expect(component.category?.id).toBe('STUB_X');
    component.onSelectCategory({ name: 'STUB_X', label: 'Stub X', help: '' });
    await expect(component.category?.id).toBe('STUB_X');
    component.dsmap = undefined;
    component.onSelectCategory({ label: 'STUB_X', help: '' });
    await expect(component.category).toBeUndefined();
  });
});
