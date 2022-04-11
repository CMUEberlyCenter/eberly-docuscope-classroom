/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { asyncData, FAKE_COMMON_DICTIONARY, Spied } from '../../testing';
import { AssignmentService } from '../assignment.service';
import { CommonDictionaryService } from '../common-dictionary.service';
import { DocumentService } from '../document.service';
import { PatternTreeNode } from '../pattern-tree-node';
import { PatternData } from '../patterns.service';
import { SettingsService } from '../settings.service';
import { TextViewComponent } from './text-view.component';

@Component({ selector: 'app-patterns-table', template: '' })
class PatternsTableStubComponent {
  @Input() patterns: PatternData[];
}

@Component({ selector: 'app-sunburst-chart', template: '' })
class SunburstStubComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() data: any;
  @Input() width: number;
}

const test_html = `
<p id="testtext">
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

describe('TextViewComponent', () => {
  let component: TextViewComponent;
  let fixture: ComponentFixture<TextViewComponent>;
  let tagged_text_service_spy: Spied<DocumentService>;

  beforeEach(waitForAsync(() => {
    tagged_text_service_spy = jasmine.createSpyObj('DocumentService', [
      'getData',
    ]) as Spied<DocumentService>;
    tagged_text_service_spy.getData.and.returnValue(
      asyncData({
        course: 'bogus_course',
        assignment: 'bogus_assignment',
        instructor: 'test_instructor',
        documents: [
          {
            text_id: 'stub_id',
            word_count: 2,
            html_content: test_html,
            ownedby: 'student',
            owner: 'TEST',
            patterns: [
              {
                category: 'bogus',
                patterns: [
                  { pattern: 'text', count: 1 },
                  { pattern: 'bogus', count: 1 },
                ],
              },
              {
                category: 'null',
              },
            ],
          },
        ],
      })
    );
    const snapshot_spy = jasmine.createSpyObj('snapshot', ['get']);
    snapshot_spy.get.and.returnValues(['1', undefined]);
    const activatedRoute = jasmine.createSpyObj('ActivatedRoute', ['paramMap']);
    activatedRoute.snapshot = jasmine.createSpyObj('snapshot', ['pmap']);
    activatedRoute.snapshot.paramMap = snapshot_spy;
    /*const sanitizer = jasmine.createSpyObj('DOMSanitizer', [
        'bypassSecurityTrustHtml',
      ]) as Spied<DomSanitizer>;
      sanitizer.bypassSecurityTrustHtml.and.callFake(
        (html: string) =>
          ({
            changingThisBreaksApplicationSecurity: html,
            getTypeName: () => 'HTML',
          } as SafeHtml)
      );*/
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
        stv: { max_clusters: 1 },
        mtv: { horizontal: false },
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

    void TestBed.configureTestingModule({
      declarations: [
        TextViewComponent,
        PatternsTableStubComponent,
        SunburstStubComponent,
      ],
      imports: [
        HttpClientTestingModule, // settings import requires.
        MatCardModule,
        MatCheckboxModule,
        MatDialogModule,
        MatIconModule,
        MatSnackBarModule,
        MatTreeModule,
        MatToolbarModule,
        MatTooltipModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: AssignmentService, useValue: assignment_spy },
        {
          provide: CommonDictionaryService,
          useValue: commonDictionaryService_spy,
        },
        //{ provide: DomSanitizer, useValue: sanitizer },
        { provide: SettingsService, useValue: settings_spy },
        { provide: DocumentService, useValue: tagged_text_service_spy },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', async () => {
    void expect(component).toBeDefined();
    await fixture.whenStable();
    await expect(component.htmlContent).toBeTruthy();
    void expect(component.tagged_text).toBeTruthy();
    void expect(component.htmlContent).toBeTruthy();
    void expect(component.sundata).toBeTruthy();
    void expect(() => component.ngOnInit()).not.toThrow();
  });
  it('getParentNode', () => {
    void expect(
      component.getParentNode(
        new PatternTreeNode({ id: 'foo', label: 'bar', help: 'foobar' }, [], [])
      )
    ).toBeNull();
    //await fixture.whenStable();
  });

  it('click_select', () =>
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      void expect(fixture.debugElement.query(By.css('.sidebar'))).toBeTruthy();
      void expect(component.tagged_text).toBeTruthy();
      const txt = fixture.debugElement.query(By.css('.text_content'));
      void expect(txt.nativeElement.innerText).toBeDefined();
      txt.triggerEventHandler('click', new MouseEvent('click'));
      (
        fixture.debugElement.query(By.css('#tag_3'))
          .nativeElement as HTMLElement
      ).click();
      // it seems like innerText is not getting inserted into test DOM
      // making it difficult to test this handler.
      //const tag = fixture.debugElement.query(By.css('#tag_0'));
      //void expect(tag.nativeElement).toBeDefined();
      //void expect(component.htmlContent.query(By.css('#tag_0'))).toBeUndefined();
      //tag.nativeElement.click();
      const word = fixture.debugElement.query(By.css('#w1'));
      void expect(word).toBeTruthy();
      void expect(word.nativeElement).toBeDefined();
      word.nativeElement.click();
      word.nativeElement.click();
      //fixture.detectChanges();
      //expect(fixture.debugElement.query(By.css('.future')).classes['selected_text']).toBeTrue();
    }));
  /*it('checkRootNodeSelection', () => fixture.whenStable().then(() => {
    const root = component.treeData.data[3];
    const leaf = root.children[0].children[0];
    expect(component.treeControl.getDescendants(root).length).toBe(2);
    component.checkAllParentsSelection(root);
    component.checkAllParentsSelection(leaf);
    expect(component.selection.isSelected(root)).toBeFalse();
    expect(component.selection.isSelected(leaf)).toBeFalse();
    component.selection.select(root);
    expect(component.selection.isSelected(root)).toBeTrue();
    component.checkRootNodeSelection(root);
    expect(component.selection.isSelected(root)).toBeFalse();
    component.checkRootNodeSelection(leaf);
    expect(component.selection.isSelected(leaf)).toBeFalse();
    component.checkAllParentsSelection(root);
    component.checkAllParentsSelection(leaf);
  }));*/
  it('selection', () =>
    fixture.whenStable().then(() => {
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
    }));
  /*it('show_expanded', () => {
    expect(component.show_expanded(null)).toBe('collapsed');
    return fixture.whenStable().then(() => {
      const fake_event = jasmine.createSpyObj('event', ['stopPropagation']);
      const clust = component.clusters.data[0];
      component.expand_handler(fake_event, clust);
      expect(component.show_expanded(null)).toBe('collapsed');
      expect(component.show_expanded(clust)).toBe('expanded');
    });
  });*/

  /*it('TextClusterData counts', () => fixture.whenStable().then(() => {
    expect(component.clusters.data[0].count).toBe(2);
    expect(component.clusters.data[0].pattern_count).toBe(1);
  }));*/

  /*it('expand_handler', () => fixture.whenStable().then(() => {
    const fake_event = jasmine.createSpyObj('event', ['stopPropagation']);
    expect(component.expanded).toBe(null);
    component.expand_handler(fake_event, null);
    expect(component.expanded).toBe(null);
    component.expand_handler(fake_event, component.clusters.data[0]);
    expect(component.expanded).toBe(component.clusters.data[0]);
    component.expand_handler(fake_event, component.clusters.data[0]);
    expect(component.expanded).toBe(null);
  }));*/

  /*it('getTaggedText null', async () => {
    tagged_text_service_spy.getTaggedText.and.stub();
    tagged_text_service_spy.getTaggedText.and.returnValue(asyncData({}));
    await component.getTaggedText();
    await fixture.whenStable().then(() => {
      expect(component.clusters.data).toBeDefined();
    });
  });
  it('getTaggedText', async () => {
    await component.getTaggedText();
    await fixture.whenStable().then(() => {
      expect(component.clusters.data[0]).toBeDefined();
      expect(component.tagged_text).toBeDefined();
      expect(component.htmlContent).toBeDefined();
      // const article: HTMLElement = fixture.nativeElement.querySelector('.text_content');
      // expect(article.textContent).toMatch(/stub\w+text/);
      // expect(article.innerHTML).toMatch(/stub\w+text/);
    });
    component.sort = null;
    component.getTaggedText();
    await fixture.whenStable().then(() => {
      expect(component.clusters.data[0]).toBeDefined();
    });
  });*/

  /* it('click_select cluster_id', () => {
    component.getTaggedText();
    fixture.detectChanges();
    return fixture.whenStable().then(() => {
      //expect(component.html_content).toBe(test_html);
      //expect(fixture.nativeElement.querySelector('.text_content')).toBe(3);
      expect(fixture.debugElement.query(By.css('[data-key]'))).toBe(null);
      expect(fixture.debugElement).toBe(null);
    });
  }); */

  /*t('click_select invalid', () =>
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
    }));*/

  /*it('click_select null', () =>
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

  /*it('get_cluster_name', () => fixture.whenStable().then(() => {
    expect(component.get_cluster_name('bogus_cluster')).toBe('Bogus Cluster');
    expect(component.get_cluster_name('null_cluster')).toBe('null_cluster');
  }));

  it('get_pattern_count', () => fixture.whenStable().then(() => {
    expect(component.get_pattern_count('mar')).toBe(0);
    expect(component.get_pattern_count('bogus_cluster')).toBe(2);
  }));

  it('get_cluster_title', () => fixture.whenStable().then(() => {
    expect(component.get_cluster_title('bogus_cluster')).toBe('Bogus Cluster (2)');
  }));*/

  /*it('selection_change', () => fixture.whenStable().then(() => {
    const evt = {
      source: {
        checked: true
      }
    };
    const clust = component.clusters.data[0];
    expect(() => component.selection_change(evt, clust)).not.toThrow();
    evt.source.checked = false;
    expect(() => component.selection_change(evt, clust)).not.toThrow();
    expect(() => component.selection_change(null, null)).not.toThrow();
  }));*/
});
