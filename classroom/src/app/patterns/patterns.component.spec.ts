import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule, MatExpansionModule } from '@angular/material';
import { asyncData } from '../../testing';

import { CorpusService } from '../corpus.service';
import { PatternsComponent } from './patterns.component';

@Component({selector: 'app-nav', template: ''})
class NavStubComponent {}

describe('PatternsComponent', () => {
  let component: PatternsComponent;
  let fixture: ComponentFixture<PatternsComponent>;

  beforeEach(async(() => {
    const corpusService_spy = jasmine.createSpyObj('CorpusService', ['getCorpus']);
    corpusService_spy.getCorpus.and.returnValue(asyncData({
      course: 'stub',
      assignment: 'stub',
      documents: ['1', '2', '3'],
      intro: 'stub',
      stv_intro: 'stub'
    }));
    TestBed.configureTestingModule({
      declarations: [ PatternsComponent,
                      NavStubComponent ],
      imports: [ MatCardModule, MatExpansionModule ],
      providers: [
        { provide: CorpusService, useValue: corpusService_spy }
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
