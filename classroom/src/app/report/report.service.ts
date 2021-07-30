import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  HandleError,
  HttpErrorHandlerService,
} from '../http-error-handler.service';

interface ReportsSchema {
  corpus: string[];
  intro: string;
  stv_intro: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private _server = `${environment.backend_server}/generate_reports`;
  private handleError: HandleError;

  constructor(
    private http: HttpClient,
    httpErrorHandler: HttpErrorHandlerService
  ) {
    this.handleError = httpErrorHandler.createHandleError('ReportService');
  }

  getReports(
    corpus: string[],
    intro: string,
    stv_intro: string
  ): Observable<Blob> {
    this.log('Generating Reports...');
    const query: ReportsSchema = {
      corpus,
      intro,
      stv_intro,
    };
    return this.http
      .post<Blob>(this._server, query, { responseType: 'blob' as 'json' })
      .pipe(
        tap(() => this.log('Report Generation Successful!')),
        catchError(this.handleError('getReports', {} as Blob))
      );
  }
  log(message: string): void {
    console.log(message);
  }
}
