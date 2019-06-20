import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TaggedTextService } from './tagged-text.service';

describe('TaggedTextService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ TaggedTextService ]
    });
  });

  it('should be created', () => {
    const service: TaggedTextService = TestBed.get(TaggedTextService);
    expect(service).toBeTruthy();
  });
});
