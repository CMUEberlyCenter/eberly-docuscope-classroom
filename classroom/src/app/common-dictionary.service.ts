/**
 * Service for retrieving the Common Dictionary
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { CommonDictionary, ICommonDictionary } from './common-dictionary';
import {
  HandleError,
  HttpErrorHandlerService,
} from './http-error-handler.service';
// import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CommonDictionaryService {
  private _common_dict = `${environment.backend_server}/common_dictionary`;
  private handleError: HandleError;
  private error_data: CommonDictionary = new CommonDictionary({
    default_dict: 'error',
    custom_dict: 'error',
    use_default_dict: true,
    timestamp: 'now',
    categories: [],
  });
  data: Observable<CommonDictionary> | undefined;

  constructor(
    private http: HttpClient,
    httpErrorHandler: HttpErrorHandlerService
  ) {
    this.handleError = httpErrorHandler.createHandleError(
      'CommonDictionaryService'
    );
  }

  getJSON(): Observable<CommonDictionary> {
    if (!this.data) {
      this.data = this.http.get<ICommonDictionary>(this._common_dict).pipe(
        map((data) => new CommonDictionary(data)),
        shareReplay(1),
        catchError(this.handleError('getJSON', this.error_data))
      );
    }
    return this.data;
  }
}
