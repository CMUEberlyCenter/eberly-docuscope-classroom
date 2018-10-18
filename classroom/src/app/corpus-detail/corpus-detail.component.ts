import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';
import { DocumentsService } from '../documents.service';

@Component({
  selector: 'app-corpus-detail',
  templateUrl: './corpus-detail.component.html',
  styleUrls: ['./corpus-detail.component.css']
})
export class CorpusDetailComponent implements OnInit, OnChanges {
  corpus: Corpus;
  documents: [string, boolean][];

  constructor(private corpusService: CorpusService,
              private documentService: DocumentsService) { }

  getCorpus(): void {
    this.corpusService.getCorpus()
      .subscribe(corpus => this.corpus = corpus);
  }

  getDocuments(): void {
    this.documentService.getDocumentIds()
      .subscribe((docs:string[]) => this.documents = docs.map((id:string):[string,boolean] => [id, false]));
  }

  ngOnInit() {
    this.getDocuments();
    this.getCorpus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    for (let propName in changes) {
      if (propName === 'corpus' && this.documents) {
        this.documents = this.documents.map((doc:[string, boolean]):[string, boolean] => [doc[0], this.corpus.documents.includes(doc[0])]);
      }
    }
  }
}
