import { Component, OnInit } from '@angular/core';

import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';

class PatternData {
  pattern: string;
  count: number;
}
class CategoryPatternData {
  category: string;
  description?: string;
  patterns?: PatternData[];
}
class PatternsData {
  categories: CategoryPatternData[];
}

@Component({
  selector: 'app-patterns',
  templateUrl: './patterns.component.html',
  styleUrls: ['./patterns.component.css']
})
export class PatternsComponent implements OnInit {
  corpus: Corpus;
  patterns_data: CategoryPatternData[] =
    [
      {
        category: 'Future',
        description: 'To the future and beyond!!!!',
        patterns: [
          { pattern: 'i will', count: 4 },
          { pattern: 'future of', count: 1 },
          { pattern: 'potential', count: 1 }
        ]
      },
      {
        category: 'Facilitate',
        patterns: [
          { pattern: 'allowed me', count: 2 },
          { pattern: 'assisted', count: 2 }
        ]
      }
    ];

  constructor(private corpusService: CorpusService) { }

  ngOnInit() {
    // this.spinner.start()
    this.corpusService.getCorpus().subscribe(corpus => this.corpus = corpus);
    // get patterns
  }

  get_pattern_count(category: CategoryPatternData): number {
    return category.patterns.reduce((total: number, current: PatternData) => total + current.count, 0);
  }
}
