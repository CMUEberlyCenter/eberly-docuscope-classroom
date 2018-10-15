import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';
import { MessageService } from './message.service';
import { CONFIG } from './app-settings';

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  database = CONFIG.backend_server+'/_documents';

  constructor(private http: HttpClient, private messageService: MessageService) { }

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

  getDocumentIds(): Observable<string[]> {
    this.messageService.add('Fetching document id\'s');
    return this.http.get<string[]>(this.database)
      .pipe(catchError(this.handleError));
  }
}
