import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { asyncData } from '../../testing/async-observable-helpers';

import { RankComponent } from './rank.component';
import { RankData } from '../boxplot-data';
import { CorpusService } from '../corpus.service';
import { BoxplotDataService } from '../boxplot-data.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({selector: 'app-rank-graph', template: ''})
class RankGraphStubComponent {
  @Input() rank_data: RankData;
  @Input() max_value: number;
}

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

describe('RankComponent', () => {
  let component: RankComponent;
  let fixture: ComponentFixture<RankComponent>;

  beforeEach(async(() => {
    const corpus_service_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
    corpus_service_spy.getCorpus.and.returnValue(asyncData([]));
    const boxplot_data_service_spy = jasmine.createSpyObj('BoxplotDataService', ['getBoxPlotData', 'getRankedList']);
    const ngx_spinner_service_spy = jasmine.createSpyObj('NgxSpinnerService', ['show', 'hide']);

    TestBed.configureTestingModule({
      declarations: [ RankComponent,
                      NavStubComponent,
                      RankGraphStubComponent ],
      imports: [ FormsModule ],
      providers: [
        { provide: CorpusService, useValue: corpus_service_spy },
        { provide: NgxSpinnerService, useValue: ngx_spinner_service_spy },
        { provide: BoxplotDataService, useValue: boxplot_data_service_spy }
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
});
