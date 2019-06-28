import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { asyncData } from '../../testing';

import { GroupingComponent } from './grouping.component';
import { CorpusService } from '../corpus.service';
import { BoxplotDataService } from '../boxplot-data.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

describe('GroupingComponent', () => {
  let component: GroupingComponent;
  let fixture: ComponentFixture<GroupingComponent>;

  beforeEach(async(() => {
    const corpus_service_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
    corpus_service_spy.getCorpus.and.returnValue(asyncData([]));
    const boxplot_data_service_spy = jasmine.createSpyObj('BoxplotDataService', ['getBoxPlotData', 'getRankedList']);
    const ngx_spinner_service_spy = jasmine.createSpyObj('NgxUiLoaderService', ['start', 'stop']);

    TestBed.configureTestingModule({
      declarations: [ GroupingComponent,
                      NavStubComponent ],
      imports: [ DragDropModule, FormsModule, MatCardModule, MatFormFieldModule, MatSidenavModule ],
      providers: [
        { provide: CorpusService, useValue: corpus_service_spy },
        { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy },
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
