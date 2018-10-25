import { TestBed } from '@angular/core/testing';

import { BoxplotDataService } from './boxplot-data.service';

describe('BoxplotDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BoxplotDataService = TestBed.get(BoxplotDataService);
    expect(service).toBeTruthy();
  });
});
