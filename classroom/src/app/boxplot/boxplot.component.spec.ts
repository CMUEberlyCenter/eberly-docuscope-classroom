//import { HarnessLoader } from '@angular/cdk/testing';
//import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatTreeModule } from '@angular/material/tree';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FAKE_DS_DATA } from 'src/testing/fake-ds-data';
import { asyncData, FAKE_COMMON_DICTIONARY, Spied } from '../../testing';
import { AssignmentService } from '../assignment.service';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import { CategoryData, DocuScopeData, DsDataService } from '../ds-data.service';
import { SettingsService } from '../settings.service';
import { BoxplotComponent } from './boxplot.component';
//import { MatTooltipHarness } from '@angular/material/tooltip/testing';

@Component({ selector: 'app-frequency-graph', template: '' })
class FrequencyGraphStubComponent {
  @Input() data!: DocuScopeData;
  @Input() category!: CategoryData;
  @Input() unit!: number;
}

describe('BoxplotComponent', () => {
  let component: BoxplotComponent;
  let fixture: ComponentFixture<BoxplotComponent>;
  //let loader: HarnessLoader;

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
      declarations: [BoxplotComponent, FrequencyGraphStubComponent],
      imports: [MatCardModule, MatTreeModule, NoopAnimationsModule],
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

    fixture = TestBed.createComponent(BoxplotComponent);
    component = fixture.componentInstance;
    //loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
    //await fixture.whenStable();
  });

  it('should create', () => {
    return expect(component).toBeTruthy();
  });

  /*it('null select', () => {
    component.onSelectCategory(null);
    expect(component.selected_category).toBe(null);
  });

  it(
    'bogus rank',
    waitForAsync(() => {
      component.onSelectCategory({
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
  );*/

  it('scale', () => {
    void expect(component.scale(0.2)).toBe('20.00');
    void expect(component.scale(0.25678)).toBe('25.68');
    void expect(component.scale(0)).toBe('0.00');
  });
  it('get_outliers', async () => {
    await fixture.whenStable();
    await expect(
      component.get_outliers(component.data?.categories?.at(0))
    ).toBeTruthy();
    await expect(
      component.get_outliers(component.data?.categories?.at(0))
    ).toBeTruthy(); // cache check
    await expect(
      component.get_outliers(component.data?.categories?.at(1))
    ).toBeTruthy();

    // handle null data
    component.data = undefined;
    expect(
      component.get_outliers({
        id: 'na',
        q1: 0,
        q2: 0,
        q3: 0,
        uifence: 0,
        lifence: 0,
        min: 0,
        max: 0,
      })
    );
  });
  it('hasChild', async () => {
    await fixture.whenStable();
    return expect(component.hasChild(0, component.treeData.data[0])).toBeTrue();
  });
  it('hasDocuments', async () => {
    await fixture.whenStable();
    const td = component.treeData.data[2];
    await expect(td.documents?.length).toEqual(2);
    expect(component.hasDocuments(2, component.treeData.data[2])).toBeTrue();
  });
  it('treeControl child acsesson', async () => {
    await fixture.whenStable();
    await expect(
      component.treeControl.getChildren(component.treeData.data[0])
    ).toBeTruthy();
  });
  it('box_tooltip', async () => {
    //const svg = await loader.getChildLoader('.box_plot_tree_item');
    await fixture.whenStable();
    //const tooltip = await loader.getHarness(
    //  MatTooltipHarness
    //);
    //await tooltip.show();
    const tip = component.box_tooltip({
      label: 'test',
      min: 0,
      q1: 1,
      q2: 2,
      q3: 3,
      max: 4,
      help: 'Some help',
      id: 'tst3',
      uifence: 3.5,
      lifence: 0.5,
    });
    expect(tip.startsWith('test')).toBeTrue();
  });
});
