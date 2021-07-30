import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, publishReplay, refCount } from 'rxjs/operators';
import { environment } from './../environments/environment';
import {
  HandleError,
  HttpErrorHandlerService,
} from './http-error-handler.service';

export interface PatternData {
  pattern: string;
  count: number;
}

export const pattern_compare = (a: PatternData, b: PatternData): number => {
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
};

export const instance_count = (patterns: PatternData[]): number =>
  patterns.reduce(
    (total: number, current: PatternData) => total + current.count,
    0
  );

export class ComparePatternData implements PatternData {
  pattern: string;
  count: number;
  counts: number[];
  /* get count(): number {
    return this.counts.reduce((t: number, c: number): number => t + c, 0);
  }*/
  constructor(pattern: string, counts: number[]) {
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

export interface CategoryPatternData {
  category: string;
  patterns?: PatternData[];
}

@Injectable({
  providedIn: 'root',
})
export class PatternsService {
  private server = `${environment.backend_server}/patterns`;
  private handleError: HandleError;
  private pattern_data: Observable<CategoryPatternData[]> | undefined;

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
