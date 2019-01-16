import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { asyncData } from '../../testing';

import { GroupingComponent } from './grouping.component';
import { CorpusService } from '../corpus.service';
import { BoxplotDataService } from '../boxplot-data.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

describe('GroupingComponent', () => {
  let component: GroupingComponent;
  let fixture: ComponentFixture<GroupingComponent>;

  beforeEach(async(() => {
    const corpus_service_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
    corpus_service_spy.getCorpus.and.returnValue(asyncData([]));
    const boxplot_data_service_spy = jasmine.createSpyObj('BoxplotDataService', ['getBoxPlotData', 'getRankedList']);
    const ngx_spinner_service_spy = jasmine.createSpyObj('NgxSpinnerService', ['show', 'hide']);

    TestBed.configureTestingModule({
      declarations: [ GroupingComponent,
                      NavStubComponent ],
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
    fixture = TestBed.createComponent(GroupingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
