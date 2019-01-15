import { Injectable } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable, of, zip } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { AssignmentService } from './assignment.service';
import { Corpus } from './corpus';

@Injectable({
  providedIn: 'root'
})
export class CorpusService {

  private _corpus: Corpus;

  constructor(private activatedRoute: ActivatedRoute,
              private assignment: AssignmentService
             ) { }

  getDocumentIds(): Observable<string[]> {
      const str_ids: string = this.activatedRoute.snapshot.queryParamMap.get('ids');
      let ids: string[] = [];
      if (str_ids) {
        ids = str_ids.split(',');
      } else {
        console.error('CorpusService.getCorpus() => no document ids provided!');
      }
    return of(ids);
  }

  getCorpus(): Observable<Corpus> {
    if (this._corpus) {
      return of(this._corpus);
    } else {
      return zip(this.assignment.getAssignment('270CoverLetter'),
                 this.getDocumentIds())
        .pipe(
          map(([assign, doc_ids]) => ({
            course: assign.course,
            assignment: assign.assignment,
            documents: doc_ids,
            intro: assign.intro,
            stv_intro: assign.stv_intro
          })),
          tap(c => this._corpus = c));
    }
  }
}
