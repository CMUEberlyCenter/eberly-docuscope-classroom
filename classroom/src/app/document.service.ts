import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, publishReplay, refCount } from 'rxjs/operators';
import { environment } from './../environments/environment';
import { AssignmentData } from './assignment-data';
import { HttpErrorHandlerService, HandleError } from './http-error-handler.service';

interface Document {
  text_id: string;
  owner: string;
  ownedby: string;
  word_count: number;
  html_content: string;
}

export class Documents extends AssignmentData {
  documents: Document[];
}

@Injectable({
  providedIn: 'root'
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
    return this._http.post<Documents>(this.server, corpus)
      .pipe(
        publishReplay(1),
        refCount(),
        catchError(this.handleError('getData', {documents: []}))
      );
  }
}