import { TestBed } from '@angular/core/testing';

import { ReportIntroductionService } from './report-introduction.service';

describe('ReportIntroductionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ReportIntroductionService = TestBed.get(ReportIntroductionService);
    expect(service).toBeTruthy();
  });
});
