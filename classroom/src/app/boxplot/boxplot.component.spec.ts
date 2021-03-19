import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatTreeModule } from '@angular/material/tree';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { FAKE_DS_DATA } from 'src/testing/fake-ds-data';
import { asyncData, FAKE_COMMON_DICTIONARY } from '../../testing';
import { AssignmentService } from '../assignment.service';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import { CategoryData, DocuScopeData, DsDataService } from '../ds-data.service';
import { SettingsService } from '../settings.service';
import { BoxplotComponent } from './boxplot.component';

@Component({ selector: 'app-nav', template: '' })
class NavStubComponent {}

@Component({ selector: 'app-rank-graph', template: '' })
class RankGraphStubComponent {
  @Input() data: DocuScopeData;
  @Input() category: CategoryData;
  @Input() unit: number;
}

describe('BoxplotComponent', () => {
  let component: BoxplotComponent;
  let fixture: ComponentFixture<BoxplotComponent>;

  beforeEach(
    waitForAsync(() => {
      const ngx_spinner_service_spy = jasmine.createSpyObj(
        'NgxSpinnerService',
        ['start', 'stop']
      );
      const corpusService_spy = jasmine.createSpyObj('CorpusService', [
        'getCorpus',
      ]);
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
      ]);
      dataService_spy.getData.and.returnValue(asyncData(FAKE_DS_DATA));
      const settings_spy = jasmine.createSpyObj('SettingsService', [
        'getSettings',
      ]);
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
      );
      commonDictionaryService_spy.getJSON.and.returnValue(
        asyncData(FAKE_COMMON_DICTIONARY)
      );
      const assignment_spy = jasmine.createSpyObj('AssignemntService', [
        'setAssignmentData',
      ]);

      TestBed.configureTestingModule({
        declarations: [
          BoxplotComponent,
          NavStubComponent,
          RankGraphStubComponent,
        ],
        imports: [MatCardModule, MatTreeModule],
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
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(BoxplotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('null select', () => {
    component.onSelectCategory(null);
    expect(component.selected_category).toBe(null);
  });

  it(
    'bogus rank',
    waitForAsync(async () => {
      await component.onSelectCategory({
        id: 'bogus',
        q1: 1,
        q2: 2,
        q3: 3,
        min: 0,
        max: 4,
        uifence: 3.5,
        lifence: 0.5,
      });
      expect(component.selected_category).toBeTruthy();
    })
  );

  it('open', () => {
    window.open = jasmine.createSpy('open');
    component.open('stv/123');
    expect(window.open).toHaveBeenCalledWith('stv/123');
  });
  it('scale', () => {
    expect(component.scale(.2)).toBe('20.00');
    expect(component.scale(.25678)).toBe('25.68');
    expect(component.scale(0)).toBe('0.00');
  });
  it('get_outliers', () => fixture.whenStable().then(() => {
    expect(component.get_outliers(component.data.categories[0])).toBeTruthy();
    expect(component.get_outliers(component.data.categories[0])).toBeTruthy(); // cache check
    expect(component.get_outliers(component.data.categories[1])).toBeTruthy();

    // handle null data
    component.data = null;
    expect(component.get_outliers({id: 'na', q1: 0, q2: 0, q3:0, uifence: 0, lifence: 0, min: 0, max: 0}));
  }));
  it('hasChild', () => fixture.whenStable().then(() => {
    expect(component.hasChild(0, component.treeData.data[0])).toBeTrue();
  }));
  it('hasDocuments', () => fixture.whenStable().then(() => {
    expect(component.hasDocuments(1, component.treeData.data[1])).toBeFalse();
  }));
  it('treeControl child acsesson', () => fixture.whenStable().then(() => {
    expect(component.treeControl.getChildren(component.treeData.data[0])).toBeTruthy();
  }));
});
