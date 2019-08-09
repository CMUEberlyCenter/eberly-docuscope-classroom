import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { /*NO_ERRORS_SCHEMA,*/ Component, Input } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
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

describe('TextViewComponent', () => {
  let component: TextViewComponent;
  let fixture: ComponentFixture<TextViewComponent>;

  beforeEach(async(() => {
    const ngx_spinner_service_spy = jasmine.createSpyObj('NgxUiLoaderService', ['start', 'stop']);
    const tagged_text_service_spy = jasmine.createSpyObj('TaggedTextService', ['getTaggedText']);
    tagged_text_service_spy.getTaggedText.and.returnValue(asyncData(
      {'text_id': 'stub_id', word_count: 2, html_content: 'stub text',
       dictionary: {}, dict_info: {cluster: [], dimension: []}}));
    const snapshot_spy = jasmine.createSpyObj('snapshot', ['get']);
    const activatedRoute = jasmine.createSpyObj('ActivatedRoute', ['paramMap']);
    const domSanitizer = jasmine.createSpyObj('DomSanitizer',
                                              ['bypassSecurityTrustHtml',
                                               'sanitize']);
    domSanitizer.bypassSecurityTrustHtml.and.returnValue({
      'changingThisBreaksApplicationSecurity': '<span data-key="lat"></span>'});
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
    expect(component).toBeTruthy();
  });
});
