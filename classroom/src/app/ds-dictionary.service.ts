import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { MessageService } from './message.service';
import { AppSettingsService } from './app-settings.service';

@Injectable({
  providedIn: 'root'
})
export class DSDictionaryService {

  private ds_dictionary_server: string = this.env.config.backend_server+'/_dictionary';

  constructor(private http: HttpClient,
              private env: AppSettingsService,
              private messageService: MessageService) { }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred.
      console.error('An error occurred:', error.error.message);
    } else {
      // service returned an unsuccessful response code.
      console.error(`Service returned code ${error.status}, ` +
                    `body was: ${error.error}`);
    }
    // return an observable
    return throwError('Something bad happened; please try again later.');
  }

  getDictionaryNames(): Observable<string[]> {
    this.messageService.add('Fetching available DocuScope dictionaries');
    return this.http.get<string[]>(this.ds_dictionary_server)
      .pipe(retry(3), catchError(this.handleError));
  }

}
