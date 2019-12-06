import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, publishReplay, refCount } from 'rxjs/operators';
import { makeCorpusSchema } from './boxplot-data';
import { environment } from './../environments/environment';
import { HttpErrorHandlerService, HandleError } from './http-error-handler.service';

export class PatternData {
  pattern: string;
  count: number;
}
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

export class DictionaryInformation {
  id: string;
  name: string;
  description?: string;
}
export class CategoryPatternData {
  category: DictionaryInformation;
  patterns?: PatternData[];
}

@Injectable({
  providedIn: 'root'
})
export class PatternsService {
  private server = `${environment.backend_server}/patterns`;
  private handleError: HandleError;
  private pattern_data: Observable<CategoryPatternData[]>;

  constructor(private _http: HttpClient,
              httpErrorHandler: HttpErrorHandlerService) {
    this.handleError = httpErrorHandler.createHandleError('PatternsService');
  }

  getPatterns(corpus: string[]): Observable<CategoryPatternData[]> {
    if (!this.pattern_data) {
      const p_query = makeCorpusSchema(corpus);
      this.pattern_data = this._http.post<CategoryPatternData[]>(this.server, p_query)
        .pipe(
          publishReplay(1),
          refCount(),
          catchError(this.handleError('Retrieve Patterns Data', [])));
    }
    return this.pattern_data;
  }
}
