import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, Input } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer, By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { asyncData } from '../../testing';
import { MatCardModule, MatCheckboxModule, MatListModule, MatSidenavModule } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TextViewComponent } from './text-view.component';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PatternData } from '../patterns.service';
import { TaggedTextService } from '../tagged-text.service';

@Component({selector: 'app-patterns-table', template: ''})
class PatternsTableStubComponent {
  @Input() patterns: PatternData[];
}

const test_html = `
<p>
<span id="tag_0" data-key="bogus" class="tag">
 <span id="w1" class="token">stub</span>
 <span id="w2" class="token">text</span>
</span>
<span id="tag_1" data-key="bogus" class="tag">
 <span id="w3" class="token">stub</span>
 <span id="w4" class="token">text</span>
</span>
<span id="tag_2" data-key="total_bogus" class="tag">
 <span id="w5" class="token">total</span>
 <span id="w6" class="token">bogus</span>
</span>
</p>`;

describe('TextViewComponent', () => {
  let component: TextViewComponent;
  let fixture: ComponentFixture<TextViewComponent>;
  let ngx_spinner_service_spy;
  let tagged_text_service_spy;

  beforeEach(async(() => {
    ngx_spinner_service_spy = jasmine.createSpyObj('NgxUiLoaderService', ['start', 'stop']);
    tagged_text_service_spy = jasmine.createSpyObj('TaggedTextService', ['getTaggedText']);
    tagged_text_service_spy.getTaggedText.and.returnValue(asyncData(
      {'text_id': 'stub_id', word_count: 2,
       html_content: test_html,
       dictionary: {
         bogus: {dimension: 'bogus_dimension', cluster: 'bogus_cluster'},
         no_hit: {dimension: 'no_dimension', cluster: 'no_cluster'}
       },
       dict_info: {
         cluster: [
           {
             id: 'bogus_cluster',
             name: 'Bogus Cluster',
             description: 'This is a bogus cluster.'
           },
           {
             id: 'no_cluster',
             name: 'No Cluster',
             description: 'Cluster does not appear.'
           }
         ],
         dimension: []}}));
    const snapshot_spy = jasmine.createSpyObj('snapshot', ['get']);
    const activatedRoute = jasmine.createSpyObj('ActivatedRoute', ['paramMap']);
    const domSanitizer = jasmine.createSpyObj('DomSanitizer',
                                              ['bypassSecurityTrustHtml',
                                               'sanitize']);
    domSanitizer.sanitize.and.callThrough();
    // domSanitizer.bypassSecurityTrustHtml.and.callThrough();
    domSanitizer.bypassSecurityTrustHtml.and.returnValue({
      'changingThisBreaksApplicationSecurity': test_html
    });

    activatedRoute.snapshot = jasmine.createSpyObj('snapshot', ['pmap']);
    activatedRoute.snapshot.paramMap = snapshot_spy;

    TestBed.configureTestingModule({
      declarations: [ TextViewComponent, PatternsTableStubComponent ],
      imports: [
        MatCardModule,
        MatCheckboxModule,
        MatIconModule,
        MatListModule,
        MatSidenavModule,
        MatSortModule,
        MatTableModule,
        MatTooltipModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DomSanitizer, useValue: domSanitizer },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy },
        { provide: TaggedTextService, useValue: tagged_text_service_spy },
      ],
      schemas: [ /*NO_ERRORS_SCHEMA*/ ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

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

  it('TextClusterData counts', () => fixture.whenStable().then(() => {
    expect(component.clusters.data[0].count).toBe(2);
    expect(component.clusters.data[0].pattern_count).toBe(1);
  }));

  it('expand_handler', () => fixture.whenStable().then(() => {
      const fake_event = jasmine.createSpyObj('event', ['stopPropagation']);
      expect(component.expanded).toBe(null);
      component.expand_handler(fake_event, null);
      expect(component.expanded).toBe(null);
      component.expand_handler(fake_event, component.clusters.data[0]);
      expect(component.expanded).toBe(component.clusters.data[0]);
      component.expand_handler(fake_event, component.clusters.data[0]);
      expect(component.expanded).toBe(null);
    }));

  it('getTaggedText', async () => {
    await component.getTaggedText();
    await fixture.whenStable().then((a) => {
      fixture.detectChanges();
      expect(component.clusters.data[0]).toBeDefined();
      expect(component.tagged_text).toBeDefined();
      expect(component.html_content).toBeDefined();
      // const article: HTMLElement = fixture.nativeElement.querySelector('.text_content');
      // expect(article.textContent).toMatch(/stub\w+text/);
      // expect(article.innerHTML).toMatch(/stub\w+text/);
    });
    /*tagged_text_service_spy.getTaggedText.and.stub();
    tagged_text_service_spy.getTaggedText.and.returnValue(asyncData(null));
    component.getTaggedText();
    await fixture.whenStable().then(() => {
      expect(component.clusters.data).toBeDefined();
    });
    */
    component.sort = null;
    component.getTaggedText();
    await fixture.whenStable().then((a) => {
      expect(component.clusters.data[0]).toBeDefined();
    });
  });

  it('click_select', () => fixture.whenStable().then(async () => {
    fixture.detectChanges();
    const evt = {
      target: {
        parentNode: {
          getAttribute: () => 'invalid',
          classed: () => {},
          select: () => ({style: () => {}})
        }
      }
    };
    expect(() => component.click_select(evt)).not.toThrow();
    await fixture.detectChanges();
    evt.target.parentNode.getAttribute = () => null;
    expect(() => component.click_select(evt)).not.toThrow();
    await fixture.detectChanges();
    evt.target.parentNode.getAttribute = () => 'bogus'; // problems with html not in element
    // expect(()=>component.click_select(evt)).not.toThrow();
    fixture.detectChanges();
  }));

  it('get_lats', () => fixture.whenStable().then(() => {
    const bogus = component.get_lats('bogus_cluster');
    expect(bogus.next().value).toBe('bogus');
    expect(bogus.next().done).toBe(true);
    const fake = component.get_lats('fake');
    expect(fake.next().done).toBe(true);
  }));

  it('lat_to_cluster', () => fixture.whenStable().then(() => {
    expect(component.lat_to_cluster('bogus')).toBe('Bogus Cluster');
  }));

  it('get_cluster_name', () => fixture.whenStable().then(() => {
    expect(component.get_cluster_name('bogus_cluster')).toBe('Bogus Cluster');
    expect(component.get_cluster_name('null_cluster')).toBe('null_cluster');
  }));

  it('get_pattern_count', () => fixture.whenStable().then(() => {
    expect(component.get_pattern_count('mar')).toBe(0);
    expect(component.get_pattern_count('bogus_cluster')).toBe(2);
  }));

  it('get_cluster_title', () => fixture.whenStable().then(() => {
    expect(component.get_cluster_title('bogus_cluster')).toBe('Bogus Cluster (2)');
  }));

  it('selection_change', () => fixture.whenStable().then(() => {
    const evt = {
      source: {
        selectedOptions: {
          selected: []
        }
      },
      option: {
        selected: true,
        value: 'bogus_cluster',
        _getHostElement: () => {}
      }
    };
    expect(() => component.selection_change(evt)).not.toThrow();
    evt.source.selectedOptions.selected = [
      'bogus_cluster', 'c2', 'c3', 'c4', 'c5'
    ];
    expect(() => component.selection_change(evt)).not.toThrow();
  }));

  it('get_cluster_class', () => {
    expect(component.get_cluster_class('mar')).toBe('cluster_0');
    expect(component.get_cluster_class('mar')).toBe('cluster_0');
    expect(component.get_cluster_class('mar1')).toBe('cluster_1');
    expect(component.get_cluster_class('mar2')).toBe('cluster_2');
    expect(component.get_cluster_class('mar3')).toBe('cluster_3');
    expect(component.get_cluster_class('mar4')).toBe('cluster_4');
    expect(component.get_cluster_class('mar5')).toBe('cluster_5');
    expect(component.get_cluster_class('mar6')).toBe('cluster_default');
  });
});
