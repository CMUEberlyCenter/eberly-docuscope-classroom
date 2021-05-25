import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { asyncData, FAKE_COMMON_DICTIONARY, Spied } from '../../testing';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import { PatternData, PatternsService } from '../patterns.service';
import { PatternsComponent } from './patterns.component';

@Component({ selector: 'app-nav', template: '' })
class NavStubComponent {}

@Component({ selector: 'app-patterns-table', template: '' })
class PatternsTableStubComponent {
  @Input() patterns: PatternData[];
}

@Component({ selector: 'app-sunburst-chart', template: '' })
class SunburstStubComponent {
  @Input() data: unknown;
  @Input() width: number;
}

describe('PatternsComponent', () => {
  let component: PatternsComponent;
  let fixture: ComponentFixture<PatternsComponent>;

  beforeEach(
    waitForAsync(() => {
      const ngx_spinner_service_spy = jasmine.createSpyObj(
        'NgxSpinnerService',
        ['start', 'stop']
      ) as Spied<NgxUiLoaderService>;
      const corpusService_spy = jasmine.createSpyObj('CorpusService', [
        'getCorpus',
      ]) as Spied<CorpusService>;
      corpusService_spy.getCorpus.and.returnValue(
        asyncData({
          course: 'stub',
          assignment: 'stub',
          documents: ['1', '2', '3'],
          intro: 'stub',
          stv_intro: 'stub',
        })
      );
      const commonDictionaryService_spy = jasmine.createSpyObj(
        'CommonDictionaryService',
        ['getJSON']
      ) as Spied<CommonDictionaryService>;
      commonDictionaryService_spy.getJSON.and.returnValue(
        asyncData(FAKE_COMMON_DICTIONARY)
      );
      const patternsService_spy = jasmine.createSpyObj('PatternsService', [
        'getPatterns',
      ]) as Spied<PatternsService>;
      patternsService_spy.getPatterns.and.returnValue(
        asyncData([
          {
            category: 'future',
            patterns: [
              { pattern: 'i will', count: 4 },
              { pattern: 'future of', count: 1 },
              { pattern: 'potential', count: 1 },
            ],
          },
          {
            category: 'facilitate',
            patterns: [
              { pattern: 'allowed me', count: 2 },
              { pattern: 'assisted', count: 2 },
            ],
          },
        ])
      );

      void TestBed.configureTestingModule({
        declarations: [
          PatternsComponent,
          PatternsTableStubComponent,
          SunburstStubComponent,
          NavStubComponent,
        ],
        imports: [
          NoopAnimationsModule,
          MatCardModule,
          MatIconModule,
          MatTreeModule,
          MatTooltipModule,
        ],
        providers: [
          { provide: CorpusService, useValue: corpusService_spy },
          {
            provide: CommonDictionaryService,
            useValue: commonDictionaryService_spy,
          },
          { provide: PatternsService, useValue: patternsService_spy },
          { provide: NgxUiLoaderService, useValue: ngx_spinner_service_spy },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PatternsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    void expect(component).toBeTruthy();
  });

  /*it('count', () => {
    const pat_data = new PatternClusterData({
      category: 'future',
      patterns: [
        { pattern: 'i will', count: 4 },
        { pattern: 'future of', count: 1 },
        { pattern: 'potential', count: 1 }
      ]
    });
    expect(pat_data.count).toBe(6);
  });*/

  /*it('pattern_count', () => {
    const pat_data = new PatternClusterData({
      category: 'future',
      patterns: [
        { pattern: 'i will', count: 4 },
        { pattern: 'future of', count: 1 },
        { pattern: 'potential', count: 1 }
      ]
    });
    expect(pat_data.pattern_count).toBe(3);
  });*/
});
