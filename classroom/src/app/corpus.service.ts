import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CorpusService {
  private _corpus: string[];

  constructor(private activatedRoute: ActivatedRoute) {}

  getDocumentIds(): string[] {
    const str_ids: string =
      this.activatedRoute.snapshot.queryParamMap.get('ids');
    let ids: string[] = [];
    if (str_ids) {
      ids = str_ids.split(',');
    } else {
      console.error('CorpusService.getCorpus() => no document ids provided!');
    }
    return ids;
  }

  getCorpus(): Observable<string[]> {
    if (!this._corpus) {
      this._corpus = this.getDocumentIds();
    }
    return of(this._corpus);
  }
}
