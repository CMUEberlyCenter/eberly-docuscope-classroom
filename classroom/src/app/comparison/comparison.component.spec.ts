import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AngularSplitModule } from 'angular-split';
import { asyncData, FAKE_COMMON_DICTIONARY, Spied } from '../../testing';
import { routes } from '../app-routing.module';
import { AssignmentService } from '../assignment.service';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import { DocumentService } from '../document.service';
import { ComparePatternData } from '../patterns.service';
import { SettingsService } from '../settings.service';
import { ComparisonComponent } from './comparison.component';

@Component({ selector: 'app-compare-patterns-table' })
class ComparePatternsTableStubComponent {
  @Input() colors: string[];
  @Input() patterns: ComparePatternData[];
}

describe('ComparisonComponent', () => {
  let component: ComparisonComponent;
  let fixture: ComponentFixture<ComparisonComponent>;
  let loader: HarnessLoader;
  // let assignment_service_spy;
  let corpus_service_spy: Spied<CorpusService>;
  // let router_spy;
  let settings_spy: Spied<SettingsService>;
  let snack_spy: Spied<MatSnackBar>;
  let documents_service_spy: Spied<DocumentService>;
  const test_html = `
  <p id="passage">
  <span id="tag_0" data-key="bogus" class="tag">
   <span id="w1" class="token">stub</span>
   <span id="w2" class="token">text</span>
  </span>
  <span id="tag_1" data-key="Tense FutureTense future" class="tag">
   <span id="w3" class="token">stub</span>
   <span id="w4" class="token">text</span>
  </span>
  <span id="tag_2" data-key="FakeCategory False Subcategory bogus" class="tag">
   <span id="w5" class="token">total</span>
   <span id="w6" class="token">bogus</span>
  </span>
  <span id="tag_3" data-key=" " class="tag"></span>
  </p>`;

  beforeEach(async () => {
    corpus_service_spy = jasmine.createSpyObj('CorpusService', [
      'getCorpus',
    ]) as Spied<CorpusService>;
    corpus_service_spy.getCorpus.and.returnValues(
      asyncData(['a', 'b']),
      asyncData(['a', 'b', 'c']),
      asyncData(['a']),
      asyncData([])
    );
    documents_service_spy = jasmine.createSpyObj('DocumentService', [
      'getData',
    ]) as Spied<DocumentService>;
    documents_service_spy.getData.and.returnValue(
      asyncData({
        course: 'bogus_course',
        assignment: 'bogus_assignment',
        instructor: 'test_instructor',
        documents: [
          {
            text_id: 'a',
            owner: 'astudent',
            ownedby: 'student',
            word_count: 2,
            html_content: test_html,
            patterns: [
              {
                category: 'bogus',
                patterns: [
                  { pattern: 'text', count: 1 },
                  { pattern: 'bogus', count: 1 },
                ],
              },
            ],
          },
          {
            text_id: 'b',
            owner: 'ata',
            ownedby: 'instructor',
            word_count: 2,
            html_content: test_html,
            patterns: [
              {
                category: 'bogus',
                patterns: [
                  { pattern: 'text', count: 1 },
                  { pattern: 'bogus', count: 1 },
                ],
              },
            ],
          },
        ],
      })
    );
    settings_spy = jasmine.createSpyObj('SettingsService', [
      'getSettings',
    ]) as Spied<SettingsService>;
    settings_spy.getSettings.and.returnValues(
      asyncData({
        title: 'DocuScope Classroom',
        institution: 'CMU',
        unit: 2,
        homepage:
          'https://www.cmu.edu/dietrich/english/research/docuscope.html',
        scatter: { width: 400, height: 400 },
        boxplot: { cloud: true },
        stv: { max_clusters: 4 },
        mtv: { horizontal: false, documentColors: ['#1c66aa', '#639c54'] },
      }),
      asyncData({
        title: 'DocuScope Classroom',
        institution: 'CMU',
        unit: 2,
        homepage:
          'https://www.cmu.edu/dietrich/english/research/docuscope.html',
        scatter: { width: 400, height: 400 },
        boxplot: { cloud: true },
        stv: { max_clusters: 4 },
        mtv: { horizontal: true, documentColors: ['#1c66aa', '#639c54'] },
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
    snack_spy = jasmine.createSpyObj('MatSnackBar', [
      'open',
    ]) as Spied<MatSnackBar>;

    await TestBed.configureTestingModule({
      declarations: [ComparisonComponent, ComparePatternsTableStubComponent],
      imports: [
        HttpClientTestingModule,
        AngularSplitModule,
        MatButtonToggleModule,
        MatCardModule,
        MatCheckboxModule,
        MatIconModule,
        MatSnackBarModule,
        MatTreeModule,
        MatTooltipModule,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes(routes),
      ],
      providers: [
        { provide: AssignmentService, useValue: assignment_spy },
        { provide: CorpusService, useValue: corpus_service_spy },
        {
          provide: CommonDictionaryService,
          useValue: commonDictionaryService_spy,
        },
        { provide: DocumentService, useValue: documents_service_spy },
        { provide: SettingsService, useValue: settings_spy },
        { provide: MatSnackBar, useValue: snack_spy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should create', async () => {
    await fixture.whenStable();
    await expect(component).toBeTruthy();
    await expect(component.corpus).toEqual(['a', 'b']);
    await expect(corpus_service_spy.getCorpus).toHaveBeenCalledTimes(1);
    await expect(component.direction).toBe('vertical');
  });

  it('should warn on 3+ document', async () => {
    await fixture.whenStable();
    // too many documents
    component.ngOnInit();
    await fixture.whenStable();
    await expect(component.corpus).toEqual(['a', 'b']);
    await expect(snack_spy.open).toHaveBeenCalled();
    await expect(settings_spy.getSettings).toHaveBeenCalledTimes(2);
    //expect(component.direction).toBe('horizontal');
  });

  it('should error on 1 document', async () => {
    await fixture.whenStable();
    // too many documents
    component.ngOnInit();
    // too few documents
    component.ngOnInit();
    await fixture.whenStable();
    await expect(corpus_service_spy.getCorpus).toHaveBeenCalledTimes(3);
    await expect(component.corpus).toEqual(['a']);
    await expect(snack_spy.open).toHaveBeenCalled();
  });

  it('should error on 0 document', async () => {
    await fixture.whenStable();
    // too many documents
    component.ngOnInit();
    // too few documents
    component.ngOnInit();
    // no documents
    component.ngOnInit();
    await fixture.whenStable();
    await expect(component.corpus).toEqual([]);
    await expect(snack_spy.open).toHaveBeenCalled();
  });

  it('selection', async () => {
    await fixture.whenStable();
    const root = component.treeData.data[3];
    const leaf = root.children[0].children[0];
    component.selectionChange(null, null);
    component.selectionChange(new MatCheckboxChange(), null);
    component.selectionLeafChange(null, null);
    component.selectionLeafChange(new MatCheckboxChange(), null);
    component.selectionLeafChange(new MatCheckboxChange(), leaf);
    expect(component.selection.isSelected(leaf)).toBeTrue();
    component.selectionLeafChange(new MatCheckboxChange(), leaf);
    expect(component.selection.isSelected(leaf)).toBeFalse();
    component.selectionChange(new MatCheckboxChange(), root);
    expect(component.selection.isSelected(root)).toBeTrue();
    component.selectionChange(new MatCheckboxChange(), root);
    expect(component.selection.isSelected(root)).toBeFalse();
    const riot = component.treeData.data[0].children[0].children[0];
    component.selectionLeafChange(new MatCheckboxChange(), riot);
    expect(component.selection.isSelected(riot)).toBeTrue();
    expect(
      component.descendantsPartiallySelected(
        component.treeData.data[0].children[0]
      )
    ).toBeTrue();
    const past = component.treeData.data[1].children[1];
    component.selectionChange(new MatCheckboxChange(), past);
    expect(component.selection.isSelected(past)).toBeTrue();
  });

  it('click_select', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    await expect(fixture.debugElement.query(By.css('.sidebar'))).toBeTruthy();
    const txt = fixture.debugElement.query(By.css('.text_content'));
    const text_content = await loader.getChildLoader('.text_content');
    await expect(text_content).not.toBeNull();
    //expect(txt.nativeElement.innerText).toBeNull();
    txt.triggerEventHandler('click', new MouseEvent('click'));
    const word = fixture.debugElement.query(By.css('#w1'))
      .nativeElement as HTMLElement;
    await expect(word).toBeTruthy();
    word.click();
    word.click();
    (
      fixture.debugElement.query(By.css('#tag_3')).nativeElement as HTMLElement
    ).click();
    //expect(fixture.debugElement.query(By.css('.future')).classes['selected_text']).toBeTrue();
  });
  /*it('click_select invalid', () =>
    fixture.whenStable().then(() => {
      const evt = {
        target: {
          parentNode: {
            getAttribute: () => 'invalid',
            classed: () => {},
            select: () => ({ style: () => {} }),
          },
        },
      };
      expect(() => component.click_select(evt)).not.toThrow();
      // fixture.whenStable().then(() => expect(fixture.debugElement.nativeElement.querySelectorAll('.cluster_id')).toBe(true));
    }));

  it('click_select null', () =>
    fixture.whenStable().then(() => {
      const evt = {
        target: {
          parentNode: {
            getAttribute: () => null,
            classed: () => {},
            select: () => ({ style: () => {} }),
          },
        },
      };
      expect(() => component.click_select(evt)).not.toThrow();
      // return fixture.whenStable().then(() => expect(true).toBe(true));
    }));

  it('click_select bogus', () =>
    fixture.whenStable().then(() => {
      const evt = {
        target: {
          parentNode: {
            getAttribute: () => 'bogus_cluster',
            classed: () => {},
            select: () => ({ style: () => {} }),
            setAttribute: () => true,
            querySelector: () => null,
          },
        },
      };
      expect(() => component.click_select(evt)).not.toThrow();
      // return fixture.whenStable().then(() => expect(() => component.click_select(evt)).not.toThrow());
      // return fixture.whenStable().then(() => expect(true).toBe(true));
    }));*/

  /*it('TextClusterData', () =>
    fixture.whenStable().then(() => {
      const tcd = component.treeData.data[0];
      expect(tcd.left(4)).toBe(25);
      expect(tcd.right(4)).toBe(25);
      expect(tcd.pattern_count).toBe(1);
    }));

  it('selection_change', () =>
    fixture.whenStable().then(() => {
      const evt = {
        source: {
          checked: true,
        },
      };
      const clust = component.clusters.data[0];
      expect(() => component.selection_change(evt, clust)).not.toThrow();
      evt.source.checked = false;
      expect(() => component.selection_change(evt, clust)).not.toThrow();
      expect(() => component.selection_change(null, null)).not.toThrow();
    }));

  it('show_expanded', () => {
    expect(component.show_expanded(null)).toBe('collapsed');
    return fixture.whenStable().then(() => {
      const fake_event = jasmine.createSpyObj('event', ['stopPropagation']);
      const clust = component.clusters.data[0];
      component.expand_handler(fake_event, clust);
      expect(component.show_expanded(null)).toBe('collapsed');
      expect(component.show_expanded(clust)).toBe('expanded');
    });
  });

  it('expand_handler', () =>
    fixture.whenStable().then(() => {
      const fake_event = jasmine.createSpyObj('event', ['stopPropagation']);
      expect(component.expanded).toBe(null);
      component.expand_handler(fake_event, null);
      expect(component.expanded).toBe(null);
      component.expand_handler(fake_event, component.clusters.data[0]);
      expect(component.expanded).toBe(component.clusters.data[0]);
      component.expand_handler(fake_event, component.clusters.data[0]);
      expect(component.expanded).toBe(null);
    }));*/
});
