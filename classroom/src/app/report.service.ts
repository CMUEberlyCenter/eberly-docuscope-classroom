import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { AppSettingsService } from './app-settings.service';
import { MessageService } from './message.service';
import { Corpus } from './corpus';

export interface ReportsSchema {
  corpus: {id: string}[];
  intro: string;
  stv_intro: string;
}
function generateReportsSchema(corpus: Corpus): ReportsSchema {
  const report = {
    corpus: corpus.documents.map((d: string): {id: string} => ({id: d})),
    intro: corpus.intro,
    stv_intro: corpus.stv_intro,
  };
  return report as ReportsSchema;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private _server = `${this.env.config.backend_server}/generate_reports`;

  constructor(private http: HttpClient,
              private env: AppSettingsService,
              private messageService: MessageService) { }

  handleError(error: HttpErrorResponse) {
    return throwError(error);
  }

  getReports(corpus: Corpus): Observable<Blob> {
    this.messageService.add('Generating Reports...');
    const query: ReportsSchema = generateReportsSchema(corpus);
    return this.http.post<Blob>(this._server, query, {responseType: 'blob' as 'json'})
      .pipe(
        tap(() => this.messageService.add('Report Generation Successful!')),
        catchError(this.handleError)
      );
  }

}
