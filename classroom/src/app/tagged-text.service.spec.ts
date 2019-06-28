import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { TaggedTextService } from './tagged-text.service';

describe('TaggedTextService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, MatSnackBarModule ],
      providers: [ TaggedTextService ]
    });
  });

  it('should be created', () => {
    const service: TaggedTextService = TestBed.get(TaggedTextService);
    expect(service).toBeTruthy();
  });
});
