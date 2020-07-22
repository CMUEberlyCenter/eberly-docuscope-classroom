import { Component, Input } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { asyncData } from '../../testing';
import { ComparisonComponent } from './comparison.component';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AssignmentService } from '../assignment.service';
import { CorpusService } from '../corpus.service';
import { Documents, DocumentService } from '../document.service';
import { ComparePatternData } from '../patterns.service';
import { SettingsService } from '../settings.service';

@Component({selector: 'app-compare-patterns-table'})
class ComparePatternsTableStubComponent {
  @Input() colors: string[];
  @Input() patterns: ComparePatternData[];
}

describe('ComparisonComponent', () => {
  let component: ComparisonComponent;
  let fixture: ComponentFixture<ComparisonComponent>;
  let assignment_service_spy;
  let corpus_service_spy;
  let router_spy;
  let settings_spy;
  let ngx_spinner_service_spy;
  let documents_service_spy;

  beforeEach(async(() => {
    corpus_service_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
    corpus_service_spy.getCorpus.and.returnValue(asyncData(['a','b']));
    ngx_spinner_service_spy = jasmine.createSpyObj('NgxUiLoaderService', ['start', 'stop']);
    documents_service_spy = jasmine.createSpyObj('DocumentService', ['getData']);
    documents_service_spy.getData.and.returnValue(asyncData({}));
    settings_spy = jasmine.createSpyObj('SettingsService', ['getSettings']);
    settings_spy.getSettings.and.returnValue(asyncData({
      title: "DocuScope Classroom",
      institution: "CMU",
      unit: 100,
      homepage: "https://www.cmu.edu/dietrich/english/research/docuscope.html",
      scatter: {width: 400, height: 400},
      boxplot: {cloud: true},
      stv: {max_clusters: 4},
      mtv: {horizontal: false, documentColors: ["#1c66aa", "#639c54"]}
    }));

    TestBed.configureTestingModule({
      declarations: [ ComparisonComponent, ComparePatternsTableStubComponent ],
      imports: [
        HttpClientTestingModule,
        MatButtonToggleModule,
        MatCardModule,
        MatIconModule,
        MatSnackBarModule,
        MatSortModule,
        MatTableModule,
        MatTooltipModule,
        NoopAnimationsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: CorpusService, useValue: corpus_service_spy },
        //{ provide: DocumentService, useValue: documents_service_spy },
        { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy },
        { provide: SettingsService, useValue: settings_spy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getSettings', () => {
    settings_spy.getSettings.and.returnValue(asyncData({
      title: "DocuScope Classroom",
      institution: "CMU",
      unit: 100,
      homepage: "https://www.cmu.edu/dietrich/english/research/docuscope.html",
      scatter: {width: 400, height: 400},
      boxplot: {cloud: true},
      stv: {max_clusters: 4},
      mtv: {horizontal: true, documentColors: ["#1c66aa", "#639c54"]}
    }));
    expect(() => component.getSettings()).not.toThrow();
  });

  it('max_selected_clusters', () => {
    expect(component.max_selected_clusters).toBe(4);
  });

  it('getCorpus empty', () => {
    corpus_service_spy.getCorpus.and.returnValue(asyncData([]));
    expect(() => component.getCorpus()).not.toThrow();
  });

  it('getCorpus singular', () => {
    corpus_service_spy.getCorpus.and.returnValue(asyncData(['a']));
    expect(() => component.getCorpus()).not.toThrow();
    // TODO: test if routed
  });

  it('getCorpus too many', async () => {
    corpus_service_spy.getCorpus.and.returnValue(asyncData(['a','b','c']));
    await component.getCorpus();
    expect(component.corpus).toEqual(['a','b']);
  });
});
