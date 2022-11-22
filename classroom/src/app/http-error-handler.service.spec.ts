import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Spied } from 'src/testing';
import {
  HandleError,
  HttpErrorHandlerService,
} from './http-error-handler.service';

describe('HttpErrorHandlerService', () => {
  let snack_spy: Spied<MatSnackBar>;

  beforeEach(() => {
    snack_spy = jasmine.createSpyObj('MatSnackBar', [
      'open',
    ]) as Spied<MatSnackBar>;
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule, NoopAnimationsModule],
      providers: [{ provide: MatSnackBar, useValue: snack_spy }],
    });
  });

  it('should be created', () => {
    const service: HttpErrorHandlerService = TestBed.inject(
      HttpErrorHandlerService
    );
    return expect(service).toBeTruthy();
  });

  it('createHandleError', () => {
    const service: HttpErrorHandlerService = TestBed.inject(
      HttpErrorHandlerService
    );
    const handler: HandleError = service.createHandleError('http-service-spec');
    return expect(handler).toBeTruthy();
  });

  it('handleError default', () => {
    const service: HttpErrorHandlerService = TestBed.inject(
      HttpErrorHandlerService
    );
    const handler: HandleError = service.createHandleError();
    const error: HttpErrorResponse = new HttpErrorResponse({});
    handler()(error).subscribe((data) => {
      void expect(data).toEqual({});
    });
    service
      .handleError()(error)
      .subscribe((data) => {
        void expect(data).toEqual({});
      });
  });

  it('handleError', () => {
    const service: HttpErrorHandlerService = TestBed.inject(
      HttpErrorHandlerService
    );
    const handler: HandleError = service.createHandleError('http-service-spec');
    const error: HttpErrorResponse = new HttpErrorResponse({});
    handler(
      'handle_error',
      {} as never
    )(error).subscribe((data) => {
      void expect(data).toEqual({});
    });
    const error0: HttpErrorResponse = new HttpErrorResponse({
      error: { detail: 'I am a bat bug' },
    });
    handler(
      'handle_error',
      {} as never
    )(error0).subscribe((data) => {
      void expect(data).toEqual({});
    });
    const error1: HttpErrorResponse = new HttpErrorResponse({
      error: { detail: [{ msg: 'I am a bat bug' }] },
    });
    handler(
      'handle_error',
      {} as never
    )(error1).subscribe((data) => {
      void expect(data).toEqual({});
    });
    const error2: HttpErrorResponse = new HttpErrorResponse({
      error: new ErrorEvent('I am an error!'),
    });
    handler(
      'handle_error',
      {} as never
    )(error2).subscribe((data) => {
      void expect(data).toEqual({});
    });
    const error3: HttpErrorResponse = new HttpErrorResponse({
      error: 'String Error',
    });
    handler(
      'handle_error',
      {} as never
    )(error3).subscribe((data) => {
      void expect(data).toEqual({});
    });
  });
});
