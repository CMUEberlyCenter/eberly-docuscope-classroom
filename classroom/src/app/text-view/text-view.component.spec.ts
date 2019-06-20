import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { asyncData, ActivatedRouteStub } from '../../testing';
import { EasyUIModule } from 'ng-easyui/components/easyui/easyui.module';
import { MatBadgeModule, MatCheckboxModule, MatExpansionModule, MatListModule } from '@angular/material';

import { TextViewComponent } from './text-view.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { TaggedTextService } from '../tagged-text.service';

describe('TextViewComponent', () => {
  let component: TextViewComponent;
  let fixture: ComponentFixture<TextViewComponent>;

  beforeEach(async(() => {
    const ngx_spinner_service_spy = jasmine.createSpyObj('NgxSpinnerService', ['show', 'hide']);
    const tagged_text_service_spy = jasmine.createSpyObj('TaggedTextService', ['getTaggedText']);
    tagged_text_service_spy.getTaggedText.and.returnValue(asyncData(
      {'text_id': 'stub_id', word_count: 2, html_content: 'stub text',
       dictionary: {}, dict_info: {cluster: [], dimension: []}}));
    const snapshot_spy = jasmine.createSpyObj('snapshot', ['get']);
    const activatedRoute = jasmine.createSpyObj('ActivatedRoute', ['paramMap']);
    const domSanitizer = jasmine.createSpyObj('DomSanitizer',
                                              ['bypassSecurityTrustHtml']);
    domSanitizer.bypassSecurityTrustHtml.and.returnValue({
      'changingThisBreaksApplicationSecurity': '<span data-key="lat"></span>'});
    activatedRoute.snapshot = jasmine.createSpyObj('snapshot', ['pmap']);
    activatedRoute.snapshot.paramMap = snapshot_spy;

    TestBed.configureTestingModule({
      declarations: [ TextViewComponent ],
      imports: [ EasyUIModule, MatBadgeModule, MatCheckboxModule, MatExpansionModule, MatListModule ],
      providers: [
        { provide: DomSanitizer, useValue: domSanitizer },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: NgxSpinnerService, useValue: ngx_spinner_service_spy },
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
