import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, publishReplay, refCount } from 'rxjs/operators';
import { environment } from './../environments/environment';
import {
  HttpErrorHandlerService,
  HandleError,
} from './http-error-handler.service';

export class PatternData {
  pattern: string;
  count: number;
}
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function pattern_compare(a: PatternData, b: PatternData): number {
  if (a.count === b.count) {
    if (a.pattern < b.pattern) {
      return -1;
    }
    if (a.pattern > b.pattern) {
      return 1;
    }
    return 0;
  }
  return b.count - a.count;
}

export class ComparePatternData extends PatternData {
  pattern: string;
  counts: number[];
  /* get count(): number {
    return this.counts.reduce((t: number, c: number): number => t + c, 0);
  }*/
  constructor(pattern: string, counts: number[]) {
    super();
    this.pattern = pattern;
    this.counts = counts;
    this.count = this.counts.reduce((t: number, c: number): number => t + c, 0);
  }
  get count0(): number {
    return this.counts[0];
  }
  get count1(): number {
    return this.counts[1];
  }
}

export class CategoryPatternData {
  category: string;
  patterns?: PatternData[];
}

@Injectable({
  providedIn: 'root',
})
export class PatternsService {
  private server = `${environment.backend_server}/patterns`;
  private handleError: HandleError;
  private pattern_data: Observable<CategoryPatternData[]>;

  constructor(
    private _http: HttpClient,
    httpErrorHandler: HttpErrorHandlerService
  ) {
    this.handleError = httpErrorHandler.createHandleError('PatternsService');
  }

  getPatterns(corpus: string[]): Observable<CategoryPatternData[]> {
    if (!this.pattern_data) {
      this.pattern_data = this._http
        .post<CategoryPatternData[]>(this.server, corpus)
        .pipe(
          publishReplay(1),
          refCount(),
          catchError(this.handleError('Retrieve Patterns Data', []))
        );
    }
    return this.pattern_data;
  }
}
