import { Injectable } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable, of } from 'rxjs';
import { zip, tap } from 'rxjs/operators';

import { AssignmentService } from './assignment.service';
import { DocumentsService } from './documents.service';
import { Corpus } from './corpus';

@Injectable({
  providedIn: 'root'
})
export class CorpusService {

  private _corpus: Corpus;

  constructor(private activatedRoute: ActivatedRoute,
              private assignment: AssignmentService,
              private documents: DocumentsService) { }

  getCorpus(): Observable<Corpus> {
    if (this._corpus) {
      return of(this._corpus);
    } else {
      return this.assignment.getAssignment('270CoverLetter')
        .pipe(
          zip(this.documents.getDocumentIds(),
              (assign, docs) => { // TODO: add types
                //console.log(assign, docs);
                return {
                  course: assign.course,
                  assignment: assign.assignment,
                  ds_dictionary: '270CoverLetter',
                  documents: docs,
                  intro: assign.intro,
                  stv_intro: assign.stv_intro
                }}),
          tap(c => this._corpus = c)
        );
    }
  }

  getParams() {
    return this.activatedRoute.queryParams.subscribe((params: Params) => {
      console.log(params);
    });
  }

}
