import { Component, Input } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatCardModule } from '@angular/material/card';
import { TagCloudModule } from 'angular-tag-cloud-module';
import { asyncData } from '../../testing';

import { BoxplotComponent } from './boxplot.component';
import { CorpusService } from '../corpus.service';
import { CategoryData, DsDataService, DocuScopeData} from '../ds-data.service';
import { SettingsService } from '../settings.service';
import { NgxUiLoaderService, NgxUiLoaderModule } from 'ngx-ui-loader';

@Component({selector: 'app-boxplot-graph', template: ''})
class BoxplotGraphStubComponent {
  @Input() boxplot: DocuScopeData;
  @Input() unit: number;
}

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

@Component({selector: 'app-rank-graph', template: ''})
class RankGraphStubComponent {
  @Input() data: DocuScopeData;
  @Input() category: CategoryData;
  @Input() unit: number;
}

describe('BoxplotComponent', () => {
  let component: BoxplotComponent;
  let fixture: ComponentFixture<BoxplotComponent>;

  beforeEach(waitForAsync(() => {
    const ngx_spinner_service_spy = jasmine.createSpyObj('NgxSpinnerService', ['start', 'stop']);
    const corpusService_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
    corpusService_spy.getCorpus.and.returnValue(asyncData({
      course: 'stub',
      assignment: 'stub',
      documents: ['1', '2', '3'],
      intro: 'stub',
      stv_intro: 'stub'
    }));
    const dataService_spy = jasmine.createSpyObj('DsDataService', ['getData']);
    dataService_spy.getData.and.returnValue(asyncData({
      categories: [{
        id: 'bogus',
        name: 'Bogus Data',
        description: 'A completely bogus category.',
        q1: 1, q2: 2, q3: 3, min: 0, max: 4,
        uifence: 3.5, lifence: 0.5,
      }],
      data: [{
        id: 'bogus_index', text: 'bogus text', ownedby: 'student',
        bogus: 0.5, total_words: 2
      }]
    }));
    const settings_spy = jasmine.createSpyObj('SettingsService', ['getSettings']);
    settings_spy.getSettings.and.returnValue(asyncData({
      title: 'DocuScope Classroom',
      institution: 'CMU',
      unit: 100,
      homepage: 'https://www.cmu.edu/dietrich/english/research/docuscope.html',
      scatter: {width: 400, height: 400},
      boxplot: {cloud: true},
      stv: {max_clusters: 4}
    }));

    TestBed.configureTestingModule({
      declarations: [ BoxplotComponent,
        BoxplotGraphStubComponent,
        NavStubComponent,
        RankGraphStubComponent ],
      imports: [ MatCardModule, TagCloudModule],
      providers: [
        { provide: SettingsService, useValue: settings_spy },
        { provide: DsDataService, useValue: dataService_spy },
        { provide: CorpusService, useValue: corpusService_spy },
        { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy }
      ]
    })
      .compileComponents();
  }));

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

  it('bogus rank', waitForAsync(async () => {
    await component.onSelectCategory({
      id: 'bogus',
      name: 'Bogus Data',
      description: 'A completely bogus category.',
      q1: 1, q2: 2, q3: 3, min: 0, max: 4,
      uifence: 3.5, lifence: 0.5,
    });
    expect(component.selected_category).toBeTruthy();
  }));
});
