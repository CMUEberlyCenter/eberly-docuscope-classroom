import { Component, OnInit } from '@angular/core';

import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  corpus: Corpus;

  constructor(private corpusService: CorpusService) { }

  getCorpus(): void {
    this.corpusService.getCorpus()
      .subscribe(corpus => this.corpus = corpus);
  }

  ngOnInit() {
    this.getCorpus();
  }

}
