import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { FAKE_COMMON_DICTIONARY } from '../../testing';
import { CommonDictionaryService } from '../common-dictionary.service';
import { CorpusService } from '../corpus.service';
import { PatternData, PatternsService } from '../patterns.service';
import { PatternsComponent } from './patterns.component';

@Component({
  selector: 'app-patterns-table',
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
class PatternsTableStubComponent {
  @Input()
  patterns!: PatternData[];
}

@Component({
  selector: 'app-sunburst-chart',
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
class SunburstStubComponent {
  @Input()
  data: unknown;
  @Input()
  width!: number;
}

describe('PatternsComponent', () => {
  let component: PatternsComponent;
  let fixture: ComponentFixture<PatternsComponent>;

  beforeEach(async () => {
    const corpusService_spy: Mocked<CorpusService> = {
      getCorpus: vi
        .fn()
        .mockName('CorpusService.getCorpus')
        .mockReturnValue(
          of({
            course: 'stub',
            assignment: 'stub',
            documents: ['1', '2', '3'],
            intro: 'stub',
            stv_intro: 'stub',
          })
        ),
    } as unknown as Mocked<CorpusService>;
    const commonDictionaryService_spy: Mocked<CommonDictionaryService> = {
      getJSON: vi
        .fn()
        .mockName('CommonDictionaryService.getJSON')
        .mockReturnValue(of(FAKE_COMMON_DICTIONARY)),
    } as unknown as Mocked<CommonDictionaryService>;
    const patternsService_spy: Mocked<PatternsService> = {
      getPatterns: vi
        .fn()
        .mockName('PatternsService.getPatterns')
        .mockReturnValue(
          of([
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
            {
              category: 'null',
            },
          ])
        ),
    } as unknown as Mocked<PatternsService>;

    await TestBed.configureTestingModule({
      declarations: [
        PatternsComponent,
        PatternsTableStubComponent,
        SunburstStubComponent,
      ],
      imports: [
        // NoopAnimationsModule,
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
      ],
    }).compileComponents();
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
