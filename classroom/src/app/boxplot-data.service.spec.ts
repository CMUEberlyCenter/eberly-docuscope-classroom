import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { BoxplotDataService } from './boxplot-data.service';

describe('BoxplotDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ BoxplotDataService ]
    });
  });

  it('should be created', () => {
    const service: BoxplotDataService = TestBed.get(BoxplotDataService);
    expect(service).toBeTruthy();
  });
});
