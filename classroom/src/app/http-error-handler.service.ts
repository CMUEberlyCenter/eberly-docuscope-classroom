/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';

export type HandleError = <T>(
  operation?: string,
  result?: T
) => (error: HttpErrorResponse) => Observable<T>;

@Injectable({
  providedIn: 'root',
})
export class HttpErrorHandlerService {
  constructor(private _snackBar: MatSnackBar) {}

  createHandleError =
    (serviceName = '') =>
    <T>(
      operation = 'operation',
      result = {} as T
    ): ((error: HttpErrorResponse) => Observable<T>) =>
      this.handleError(serviceName, operation, result);

  handleError<T>(serviceName = '', operation = 'operation', result = {} as T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(error);
      let message = '';
      if (error.error instanceof ErrorEvent) {
        message = error.error.message;
      } else if (error.error && typeof error.error === 'string') {
        message = `${error.message} -- ${error.error}`;
      } else if (error.error && 'detail' in error.error) {
        if (Array.isArray(error.error.detail)) {
          const details = error.error.detail as { msg: string }[];
          message = `Server response ${error.status} (${
            error.statusText
          }) with message "${details.map((e) => e.msg).join(', ')}"`;
        } else {
          message = error.error.detail as string;
        }
      } else {
        message = error.message;
      }
      console.log(`${serviceName}: ${operation} failed: ${message}`);
      this._snackBar.open(message, '\u2612');
      return of(result);
    };
  }
}
