import { TestBed } from '@angular/core/testing';
import { first } from 'rxjs';

import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should be created', async () => {
    await expect(service).toBeTruthy();
    service.loading$.pipe(first()).subscribe((d) => expect(d).toBeFalse());
  });
  it('show/hide', () => {
    void expect(() =>
      service.loading$.pipe(first()).subscribe((d) => expect(d).toBeFalse())
    ).not.toThrow();
    service.show();
    service.loading$.pipe(first()).subscribe((d) => expect(d).toBeTrue());
    service.hide();
    service.loading$.pipe(first()).subscribe((d) => expect(d).toBeFalse());
  });
});
