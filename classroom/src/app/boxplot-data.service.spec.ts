import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { BoxplotDataService } from './boxplot-data.service';

describe('BoxplotDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, MatSnackBarModule ],
      providers: [ BoxplotDataService ]
    });
  });

  it('should be created', () => {
    const service: BoxplotDataService = TestBed.get(BoxplotDataService);
    expect(service).toBeTruthy();
  });
});
