import { Injectable } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable, of } from 'rxjs';

import { Corpus } from './corpus';
import { CORPI } from './mock-corpus';

@Injectable({
  providedIn: 'root'
})
export class CorpusService {

  constructor(private activatedRoute: ActivatedRoute) { }

  getCorpi(): Observable<Corpus[]> {
    return of(CORPI);
  }

  // getCorpus(id: number): Observable<Corpus> {
  //  return of(CORPI.find(corpus => corpus.id === id));
  //}
  getCorpus(): Observable<Corpus> {
    return of(CORPI[0]);
  }

  getParams() {
    return this.activatedRoute.queryParams.subscribe((params: Params) => {
      console.log(params);
    });
  }

}
