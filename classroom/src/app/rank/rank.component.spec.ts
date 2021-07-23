import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { GoogleChartsModule } from 'angular-google-charts';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { FAKE_COMMON_DICTIONARY, Spied } from 'src/testing';
import { asyncData } from '../../testing/async-observable-helpers';
import { AssignmentService } from '../assignment.service';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import { CategoryData, DocuScopeData, DsDataService } from '../ds-data.service';
import { SettingsService } from '../settings.service';
import { RankComponent } from './rank.component';

@Component({ selector: 'app-rank-graph', template: '' })
class RankGraphStubComponent {
  @Input() data: DocuScopeData;
  @Input() category: CategoryData;
  @Input() unit: number;
}

describe('RankComponent', () => {
  let component: RankComponent;
  let fixture: ComponentFixture<RankComponent>;
  let ds_data_service_spy: Spied<DsDataService>;
  let corpus_service_spy: Spied<CorpusService>;

  beforeEach(
    waitForAsync(() => {
      corpus_service_spy = jasmine.createSpyObj('CorpusService', [
        'getCorpus',
      ]) as Spied<CorpusService>;
      corpus_service_spy.getCorpus.and.returnValue(asyncData([]));
      ds_data_service_spy = jasmine.createSpyObj('DsDataService', [
        'getData',
      ]) as Spied<DsDataService>;
      ds_data_service_spy.getData.and.returnValue(
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
      );
      const ngx_spinner_service_spy = jasmine.createSpyObj(
        'NgxUiLoaderService',
        ['start', 'stop']
      ) as Spied<NgxUiLoaderService>;
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
        })
      );
      const assignment_spy = jasmine.createSpyObj('AssignemntService', [
        'setAssignmentData',
      ]) as Spied<AssignmentService>;
      const commonDictionaryService_spy = jasmine.createSpyObj(
        'CommonDictionaryService',
        ['getJSON']
      ) as Spied<CommonDictionaryService>;
      commonDictionaryService_spy.getJSON.and.returnValue(
        asyncData(FAKE_COMMON_DICTIONARY)
      );

      void TestBed.configureTestingModule({
        declarations: [RankComponent, RankGraphStubComponent],
        imports: [
          FormsModule,
          GoogleChartsModule,
          MatCardModule,
          MatFormFieldModule,
        ],
        providers: [
          { provide: AssignmentService, useValue: assignment_spy },
          {
            provide: CommonDictionaryService,
            useValue: commonDictionaryService_spy,
          },
          { provide: SettingsService, useValue: settings_spy },
          { provide: CorpusService, useValue: corpus_service_spy },
          { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy },
          { provide: DsDataService, useValue: ds_data_service_spy },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(RankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    return expect(component).toBeTruthy();
  });

  it(
    'gets data',
    waitForAsync(async () => {
      component.ngOnInit();
      await fixture.whenStable();
      void expect(corpus_service_spy.getCorpus).toHaveBeenCalled();
      void expect(ds_data_service_spy.getData).toHaveBeenCalled();
    })
  );
  it('categories', async () => {
    void expect(component.categories).toEqual([]);
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
    await expect(component.category.id).toBe('STUB_X');
    component.onSelectCategory({ name: 'STUB_X', label: 'Stub X', help: '' });
    await expect(component.category.id).toBe('STUB_X');
    component.dsmap = undefined;
    component.onSelectCategory({ label: 'STUB_X', help: '' });
    await expect(component.category).toBeUndefined();
  });
});
