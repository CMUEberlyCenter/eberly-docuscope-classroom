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
    service.loading$.pipe(first()).subscribe((d) => expect(d).toBe(false));
  });
  it('show/hide', async () => {
    await expect(() =>
      service.loading$.pipe(first()).subscribe((d) => expect(d).toBe(false))
    ).not.toThrow();
    service.show();
    service.loading$.pipe(first()).subscribe((d) => expect(d).toBe(true));
    service.hide();
    service.loading$.pipe(first()).subscribe((d) => expect(d).toBe(false));
  });
});
