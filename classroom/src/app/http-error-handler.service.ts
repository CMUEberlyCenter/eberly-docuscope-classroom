import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Observable, of } from 'rxjs';

import { MessageService } from './message.service';

export type HandleError = <T> (operation?: string, result?: T) =>
  (error: HttpErrorResponse) => Observable<T>;

@Injectable({
  providedIn: 'root'
})
export class HttpErrorHandlerService {

  constructor(private messageService: MessageService,
              private _snackBar: MatSnackBar) { }

  createHandleError = (serviceName = '') =>
    <T> (operation = 'operation', result = {} as T) =>
    this.handleError(serviceName, operation, result)

  handleError<T> (serviceName = '', operation = 'operation', result = {} as T) {
    return (error: HttpErrorResponse):
    Observable<T> => {
      console.error(error);
      let message = '';
      if (error.error instanceof ErrorEvent) {
        message = error.error.message;
      } else if (error.error && 'detail' in error.error) {
        if (Array.isArray(error.error.detail)) {
          message = `Server response ${error.status} (${error.statusText}) with message "${error.error.detail.map(e => e.msg).join(', ')}"`;
        } else {
          message = error.error.detail;
        }
      } else {
        message = error.message;
      }
      this.messageService.add(`${serviceName}: ${operation} failed: ${message}`);
      this._snackBar.open(message, '\u2612');
      return of(result);
    };
  }
}
