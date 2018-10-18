import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map, publishReplay, refCount } from 'rxjs/operators';
import { MessageService } from './message.service';
import { AppSettingsService } from './app-settings.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  database = this.env.config.backend_server+'/_documents';

  constructor(private http: HttpClient,
              private env: AppSettingsService,
              private messageService: MessageService) { }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred.
      console.error('An error occurred:', error.error.message);
      this.messageService.add('An error occurred: '+ error.error.message);
    } else {
      // service returned an unsuccessful response code.
      console.error(`Service returned code ${error.status}, ` +
                    `body was: ${error.error}`);
      this.messageService.add(`Service returned code ${error.status}, ` +
                    `body was: ${error.error}`);
    }
    // return an observable
    return throwError('Something bad happened; please try again later.');
  };

  _document_ids;
  getDocumentIds(): Observable<string[]> {
    if (!this._document_ids) {
      this.messageService.add('Fetching document id\'s');
      this._document_ids = this.http.get<string[]>(this.database)
        .pipe(
          publishReplay(1),
          refCount(),
          catchError(this.handleError));
    }
    return this._document_ids;
  }
}
