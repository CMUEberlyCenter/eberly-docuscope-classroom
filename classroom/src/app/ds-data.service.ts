/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, publishReplay, refCount } from 'rxjs/operators';
import { environment } from './../environments/environment';
import { AssignmentData } from './assignment-data';
import {
  HandleError,
  HttpErrorHandlerService,
} from './http-error-handler.service';

export class DocumentData {
  id: string;
  title: string;
  ownedby: string;
  total_words: number;
  value?: number;
}

export function category_value(
  category: CategoryData | string,
  datum: DocumentData
): number {
  const cat: string = typeof category === 'string' ? category : category.id;
  if (cat in datum) {
    return datum[cat];
  }
  return 0.0;
}

export class CategoryData {
  id: string;
  q1: number;
  q2: number;
  q3: number;
  min: number;
  max: number;
  uifence: number;
  lifence: number;
}

export class DocuScopeData extends AssignmentData {
  categories?: CategoryData[];
  data: DocumentData[];
}
export type CategoryInfoMap = Map<string, CategoryData>;
export function genCategoryDataMap(data: DocuScopeData): CategoryInfoMap {
  const cmap = new Map<string, CategoryData>();
  for (const clust of data.categories) {
    cmap.set(clust.id, clust);
  }
  return cmap;
}

export function max_boxplot_value(data: DocuScopeData): number {
  let maximum = 0.0;
  if (data && data.categories) {
    maximum = data.categories.reduce(
      (max, cat) => Math.max(max, cat.max, cat.uifence),
      0.0
    );
  }
  return Math.ceil(maximum * 10) / 10;
}

@Injectable({
  providedIn: 'root',
})
export class DsDataService {
  server = `${environment.backend_server}/ds_data`;
  handleError: HandleError;
  data: Observable<DocuScopeData>;

  constructor(
    private http: HttpClient,
    httpErrorHandler: HttpErrorHandlerService
  ) {
    this.handleError = httpErrorHandler.createHandleError('DsDataService');
  }

  getData(corpus: string[]): Observable<DocuScopeData> {
    if (!this.data) {
      this.data = this.http
        .post<DocuScopeData>(this.server, corpus)
        .pipe(
          publishReplay(1),
          refCount(),
          catchError(this.handleError('getData', { categories: [], data: [] }))
        );
    }
    return this.data;
  }
}
