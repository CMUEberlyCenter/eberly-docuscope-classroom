/*
Service for retrieving information about individual documents, such as the
tagged text and other meta information.
*/
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
import { CategoryPatternData } from './patterns.service';

interface Document {
  text_id: string;
  owner: string;
  ownedby: string;
  word_count: number;
  html_content: string;
  patterns: CategoryPatternData[];
}

export interface Documents extends AssignmentData {
  documents: Document[];
}

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private server = `${environment.backend_server}/document`;
  private handleError: HandleError;
  constructor(
    private _http: HttpClient,
    httpErrorHandler: HttpErrorHandlerService
  ) {
    this.handleError = httpErrorHandler.createHandleError('DocumentService');
  }
  getData(corpus: string[]): Observable<Documents> {
    return this._http
      .post<Documents>(this.server, corpus)
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getData', { documents: [] }))
      );
  }
}
