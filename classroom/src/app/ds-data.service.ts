import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { environment } from './../environments/environment';
import { AssignmentData } from './assignment-data';
import {
  HandleError,
  HttpErrorHandlerService,
} from './http-error-handler.service';

export interface DocumentData {
  [category: string]: number | string | undefined;
  id: string;
  title: string;
  ownedby: string;
  total_words: number;
  //value?: number;
}

/**
 * Retrieve the value of the given category from the document data.
 * @param category Either the CategoryData object or its string id
 * @param datum the document to retrieve the given category value from
 * @returns the value of category in datum.
 */
export function category_value(
  category: CategoryData | string | undefined | null,
  datum: DocumentData
): number {
  if (category) {
    const cat: string = typeof category === 'string' ? category : category.id;
    if (cat in datum) {
      const val = Number(datum[cat]);
      return isNaN(val) ? 0.0 : val;
    }
  }
  return 0.0;
}

export interface CategoryData {
  id: string;
  q1: number;
  q2: number;
  q3: number;
  min: number;
  max: number;
  uifence: number;
  lifence: number;
}

export interface DocuScopeData extends AssignmentData {
  categories?: CategoryData[];
  data: DocumentData[];
}
export type CategoryInfoMap = Map<string, CategoryData>;
/** generate the lookup table of category data by id. */
export function genCategoryDataMap(data: DocuScopeData): CategoryInfoMap {
  const cmap = new Map<string, CategoryData>();
  for (const clust of data.categories ?? []) {
    cmap.set(clust.id, clust);
  }
  return cmap;
}

/** Calculate the maximum value in the sumative categories data. */
export function max_boxplot_value(data?: DocuScopeData): number {
  let maximum = 0.0;
  if (data && data.categories) {
    maximum = data.categories.reduce(
      (max, cat) => Math.max(max, cat.max, cat.uifence),
      0.0
    );
  }
  return Math.ceil(maximum * 10) / 10;
}

/**
 * Find the maximal value of category proportions.
 * @param data Data from docuscope
 * @returns the max proportion value over all categories of the document data.
 */
export function max_document_data_value(data: DocuScopeData): number {
  const maxValue = Math.max(
    ...data.data.map((doc) =>
      Math.max(
        ...Object.values(doc)
          .map((p) => Number(p))
          .filter((n) => !isNaN(n) && n <= 1) // Remove NaN and total count
      )
    )
  );
  return maxValue > 0 ? maxValue : 1;
}

@Injectable({
  providedIn: 'root',
})
export class DsDataService {
  server = `${environment.backend_server}/ds_data`;
  handleError: HandleError;
  data: Observable<DocuScopeData> | undefined;

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
          shareReplay(1),
          catchError(this.handleError('getData', { categories: [], data: [] }))
        );
    }
    return this.data;
  }
}
