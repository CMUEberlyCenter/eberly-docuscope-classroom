import { Component, OnInit } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';
import { CategoryPatternData, PatternData, PatternsService } from '../patterns.service';

@Component({
  selector: 'app-patterns',
  templateUrl: './patterns.component.html',
  styleUrls: ['./patterns.component.css']
})
export class PatternsComponent implements OnInit {
  corpus: Corpus;
  patterns_data: CategoryPatternData[];

  constructor(private corpusService: CorpusService,
              private dataService: PatternsService,
              private spinner: NgxUiLoaderService) { }

  ngOnInit() {
    this.spinner.start();
    this.corpusService.getCorpus().subscribe(corpus => {
      this.corpus = corpus;
      this.dataService.getPatterns(corpus).subscribe(data => {
        this.patterns_data = data;
        this.spinner.stop();
      });
    });
  }

  get_pattern_count(category: CategoryPatternData): number {
    return category.patterns.reduce((total: number, current: PatternData) => total + current.count, 0);
  }
}
