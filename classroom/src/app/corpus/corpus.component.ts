import { Component, OnInit } from '@angular/core';
import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';

@Component({
  selector: 'app-corpus',
  templateUrl: './corpus.component.html',
  styleUrls: ['./corpus.component.css']
})
export class CorpusComponent implements OnInit {
  corpus_list: Corpus[];

  constructor(private corpusService: CorpusService) { }

  getCorpus(): void {
    this.corpusService.getCorpi()
      .subscribe(corpi => this.corpus_list = corpi);
  }

  ngOnInit() {
    this.getCorpus();
  }

  /*selectedCorpus: Corpus;
  onSelect(corpus: Corpus): void {
    this.selectedCorpus = corpus;
  }*/
}
