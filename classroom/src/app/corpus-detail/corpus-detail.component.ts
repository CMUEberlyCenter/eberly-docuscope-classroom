import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';

@Component({
  selector: 'app-corpus-detail',
  templateUrl: './corpus-detail.component.html',
  styleUrls: ['./corpus-detail.component.css']
})
export class CorpusDetailComponent implements OnInit, OnChanges {
  corpus: Corpus;
  documents: [string, boolean][];

  constructor(private corpusService: CorpusService) { }

  getCorpus(): void {
    this.corpusService.getCorpus()
      .subscribe(corpus => this.corpus = corpus);
  }

  ngOnInit() {
    this.getCorpus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    for (const propName in changes) {
      if (propName === 'corpus' && this.documents) {
        this.documents = this.documents.map(
          (doc: [string, boolean]): [string, boolean] =>
            [doc[0], this.corpus.documents.includes(doc[0])]);
      }
    }
  }
}
