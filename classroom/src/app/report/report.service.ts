import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { MessageService } from '../message.service';
import { HttpErrorHandlerService, HandleError } from '../http-error-handler.service';
import { DocumentSchema, makeDocumentSchema } from '../boxplot-data';

class ReportsSchema {
  corpus: DocumentSchema[];
  intro: string;
  stv_intro: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private _server = `${environment.backend_server}/generate_reports`;
  private handleError: HandleError;

  constructor(private http: HttpClient,
              httpErrorHandler: HttpErrorHandlerService,
              private messageService: MessageService) {
    this.handleError = httpErrorHandler.createHandleError('ReportService');
  }

  getReports(corpus: string[], intro: string, stv_intro: string): Observable<Blob> {
    this.messageService.add('Generating Reports...');
    const query: ReportsSchema = {
      corpus: makeDocumentSchema(corpus),
      intro: intro,
      stv_intro: stv_intro
    };
    return this.http.post<Blob>(this._server, query,
                                {responseType: 'blob' as 'json'})
      .pipe(
        tap(() => this.messageService.add('Report Generation Successful!')),
        catchError(this.handleError('getReports', <Blob>{}))
      );
  }

}
