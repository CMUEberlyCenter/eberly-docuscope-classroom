import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { Corpus } from '../corpus';
import { CorpusService } from '../corpus.service';
import { DSDictionaryService } from '../ds-dictionary.service';
import { DocumentsService } from '../documents.service';

@Component({
  selector: 'app-corpus-detail',
  templateUrl: './corpus-detail.component.html',
  styleUrls: ['./corpus-detail.component.css']
})
export class CorpusDetailComponent implements OnInit, OnChanges {
  corpus: Corpus;

  dictionaries: string[];
  documents: [string, boolean][];

  constructor(private corpusService: CorpusService,
              private dictionaryService: DSDictionaryService,
              private documentService: DocumentsService,
              private route: ActivatedRoute,
              private location: Location) { }

  getCorpus(): void {
    //const id = +this.route.snapshot.paramMap.get('id');
    this.corpusService.getCorpus() //(id)
      .subscribe(corpus => this.corpus = corpus);
  }

  getDictionaries(): void {
    this.dictionaryService.getDictionaryNames()
      .subscribe(ds_dicts => this.dictionaries = ds_dicts);
  }

  getDocuments(): void {
    this.documentService.getDocumentIds()
      .subscribe((docs:string[]) => this.documents = docs.map((id:string):[string,boolean] => [id, false]));
  }

  ngOnInit() {
    this.getDictionaries();
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

  goBack(): void {
    this.location.back();
  }
}
