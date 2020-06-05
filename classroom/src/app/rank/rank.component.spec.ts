import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { asyncData } from '../../testing/async-observable-helpers';
import { GoogleChartsModule } from 'angular-google-charts';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';

import { RankComponent } from './rank.component';
import { CorpusService } from '../corpus.service';
import { CategoryData, DocuScopeData, DsDataService } from '../ds-data.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({selector: 'app-rank-graph', template: ''})
class RankGraphStubComponent {
  @Input() data: DocuScopeData;
  @Input() category: CategoryData;
  @Input() unit: number;
}

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

describe('RankComponent', () => {
  let component: RankComponent;
  let fixture: ComponentFixture<RankComponent>;
  let ds_data_service_spy;
  let corpus_service_spy;

  beforeEach(async(() => {
    corpus_service_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
    corpus_service_spy.getCorpus.and.returnValue(asyncData([]));
    ds_data_service_spy = jasmine.createSpyObj('DsDataService', ['getData']);
    ds_data_service_spy.getData.and.returnValue(asyncData({
      categories: [
        {'q1': .1, 'q2': .2, 'q3': .3, 'min': 0, 'max': .4,
          'uifence': .6, 'lifence': 0,
          'id': 'STUB_X', 'name': 'Stub X'},
        {'q1': .2, 'q2': .3, 'q3': .4, 'min': 0, 'max': .5,
          'uifence': .6, 'lifence': 0.1,
          'id': 'STUB_Y', 'name': 'Stub Y'}],
      data: [{
        id: 'bogus_index', text: 'bogus text', ownedby: 'student',
        bogus: 0.5, STUB_X: 0.1, STUB_Y: 0.2, total_words: 2
      }]
    }));
    const ngx_spinner_service_spy = jasmine.createSpyObj('NgxUiLoaderService', ['start', 'stop']);

    TestBed.configureTestingModule({
      declarations: [ RankComponent,
        NavStubComponent,
        RankGraphStubComponent ],
      imports: [ FormsModule,
        GoogleChartsModule,
        MatCardModule,
        MatFormFieldModule ],
      providers: [
        { provide: CorpusService, useValue: corpus_service_spy },
        { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy },
        { provide: DsDataService, useValue: ds_data_service_spy }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('gets data', async () => {
    component.ngOnInit();
    return fixture.whenStable().then(() => {
      expect(corpus_service_spy.getCorpus).toHaveBeenCalled();
      expect(ds_data_service_spy.getData).toHaveBeenCalled();
    });
  });

  it('on_select', () => {
    component.on_select({});
    expect(component.category.id).toBe('STUB_X');
  });
});
