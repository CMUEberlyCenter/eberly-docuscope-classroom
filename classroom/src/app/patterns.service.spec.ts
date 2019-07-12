import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { PatternsService } from './patterns.service';

describe('PatternsService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule, MatSnackBarModule ]
  }));

  it('should be created', () => {
    const service: PatternsService = TestBed.get(PatternsService);
    expect(service).toBeTruthy();
  });
});
