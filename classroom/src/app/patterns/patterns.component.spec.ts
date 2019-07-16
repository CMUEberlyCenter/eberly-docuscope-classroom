import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule, MatExpansionModule } from '@angular/material';
import { NgxUiLoaderService, NgxUiLoaderModule } from 'ngx-ui-loader';
import { asyncData } from '../../testing';

import { CorpusService } from '../corpus.service';
import { PatternsComponent } from './patterns.component';
import { PatternsService } from '../patterns.service';

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

describe('PatternsComponent', () => {
  let component: PatternsComponent;
  let fixture: ComponentFixture<PatternsComponent>;

  beforeEach(async(() => {
    const ngx_spinner_service_spy = jasmine.createSpyObj('NgxSpinnerService', ['start', 'stop']);
    const corpusService_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
    corpusService_spy.getCorpus.and.returnValue(asyncData({
      course: 'stub',
      assignment: 'stub',
      documents: ['1', '2', '3'],
      intro: 'stub',
      stv_intro: 'stub'
    }));
    const patternsService_spy = jasmine.createSpyObj('PatternsService', ['getPatterns']);
    patternsService_spy.getPatterns.and.returnValue(asyncData(
      [
        {
          category: { id: 'future', name: 'Future',
                      description: 'To the future and beyond!!!!'},
          patterns: [
            { pattern: 'i will', count: 4 },
            { pattern: 'future of', count: 1 },
            { pattern: 'potential', count: 1 }
          ]
        },
        {
          category: {id: 'facilitate', name: 'Facilitate'},
          patterns: [
            { pattern: 'allowed me', count: 2 },
            { pattern: 'assisted', count: 2 }
          ]
        }
      ]));

    TestBed.configureTestingModule({
      declarations: [ PatternsComponent,
                      NavStubComponent ],
      imports: [ MatCardModule, MatExpansionModule ],
      providers: [
        { provide: CorpusService, useValue: corpusService_spy },
        { provide: PatternsService, useValue: patternsService_spy },
        { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatternsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
