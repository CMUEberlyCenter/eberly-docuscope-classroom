import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { asyncData, FAKE_COMMON_DICTIONARY, Spied } from '../../testing';
import { AssignmentService } from '../assignment.service';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import { DsDataService } from '../ds-data.service';
import { SettingsService } from '../settings.service';
import { ScatterplotComponent } from './scatterplot.component';

describe('ScatterplotComponent', () => {
  let component: ScatterplotComponent;
  let fixture: ComponentFixture<ScatterplotComponent>;

  beforeEach(waitForAsync(() => {
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

    void TestBed.configureTestingModule({
      declarations: [ScatterplotComponent],
      imports: [
        FormsModule,
        MatCardModule,
        MatDialogModule,
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
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScatterplotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    return expect(component).toBeTruthy();
  });

  it('genPoints null axis', async () => {
    await fixture.whenStable();
    component.x_axis = null;
    await expect(() => component.genPoints()).not.toThrow();
  });
  it('genPoints null data', async () => {
    await fixture.whenStable();
    component.data = undefined;
    await expect(() => component.genPoints()).not.toThrow();
  });

  /*it('select_point', async () => {
    window.open = jasmine.createSpy('open');
    await fixture.whenRenderingDone();
    component.select_point(component.scatterplot, { selection: [{ row: 1 }] });
    expect(window.open).toHaveBeenCalledWith('stv/123');
  });*/

  it('on_select_x', () =>
    fixture.whenStable().then(() => {
      component.on_select_x({
        name: 'STUB_X',
        label: 'Stub X',
        help: '',
      });
      void expect(component.x_category.id).toBe('STUB_X');
      component.on_select_x({
        label: 'STUB_X',
        help: '',
      });
      void expect(component.x_category.id).toBe('STUB_X');
    }));
  it('on_select_y', () =>
    fixture.whenStable().then(() => {
      component.on_select_y({ name: 'STUB_Y', label: 'Stub Y', help: '' });
      void expect(component.y_category.id).toBe('STUB_Y');
      component.on_select_y({ label: 'STUB_Y', help: '' });
      void expect(component.y_category.id).toBe('STUB_Y');
    }));
  it('categories', async () => {
    void expect(component.categories).toEqual([]);
    await fixture.whenStable();
    void expect(component.categories.length).toBe(2);
  });
});
