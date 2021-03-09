import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { asyncData, FAKE_COMMON_DICTIONARY } from '../../testing';
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
  // let assignment_service_spy;
  let corpus_service_spy;
  // let router_spy;
  let settings_spy;
  let ngx_spinner_service_spy;
  let documents_service_spy;
  const test_html = `
  <p>
  <span id="tag_0" data-key="bogus_cluster" class="tag">
   <span id="w1" class="token">stub</span>
   <span id="w2" class="token">text</span>
  </span>
  <span id="tag_1" data-key="bogus_cluster" class="tag">
   <span id="w3" class="token">stub</span>
   <span id="w4" class="token">text</span>
  </span>
  <span id="tag_2" data-key="total_bogus" class="tag">
   <span id="w5" class="token">total</span>
   <span id="w6" class="token">bogus</span>
  </span>
  </p>`;

  beforeEach(
    waitForAsync(() => {
      corpus_service_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
      corpus_service_spy.getCorpus.and.returnValue(asyncData(['a', 'b']));
      ngx_spinner_service_spy = jasmine.createSpyObj('NgxUiLoaderService', [
        'start',
        'stop',
      ]);
      documents_service_spy = jasmine.createSpyObj('DocumentService', [
        'getData',
      ]);
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
                  patterns: [{ pattern: 'text', count: 1 }],
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
                  patterns: [{ pattern: 'text', count: 1 }],
                },
              ],
            },
          ],
        })
      );
      settings_spy = jasmine.createSpyObj('SettingsService', ['getSettings']);
      settings_spy.getSettings.and.returnValue(
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
        declarations: [ComparisonComponent, ComparePatternsTableStubComponent],
        imports: [
          HttpClientTestingModule,
          MatButtonToggleModule,
          MatCardModule,
          MatCheckboxModule,
          MatIconModule,
          MatSnackBarModule,
          MatSortModule,
          MatTableModule,
          MatTooltipModule,
          NoopAnimationsModule,
          RouterTestingModule,
        ],
        providers: [
          { provide: AssignmentService, useValue: assignment_spy },
          { provide: CorpusService, useValue: corpus_service_spy },
          {
            provide: CommonDictionaryService,
            useValue: commonDictionaryService_spy,
          },
          { provide: DocumentService, useValue: documents_service_spy },
          { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy },
          { provide: SettingsService, useValue: settings_spy },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
