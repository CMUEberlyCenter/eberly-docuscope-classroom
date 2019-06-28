import { TestBed } from '@angular/core/testing';

import { MatSnackBarModule } from '@angular/material/snack-bar';

import { HttpErrorHandlerService } from './http-error-handler.service';

describe('HttpErrorHandlerService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ MatSnackBarModule ]
  }));

  it('should be created', () => {
    const service: HttpErrorHandlerService = TestBed.get(HttpErrorHandlerService);
    expect(service).toBeTruthy();
  });
});
