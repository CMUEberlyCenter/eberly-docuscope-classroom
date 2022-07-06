import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoadingService } from './loading.service';

import { NetworkInterceptor } from './network.interceptor';

describe('NetworkInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;
  let mockService: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NetworkInterceptor,
        {
          provide: LoadingService,
          useClass: mockService,
        },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: NetworkInterceptor,
          multi: true,
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    mockService = TestBed.inject(LoadingService);
  });

  /*it('should be created', async () => {
    const interceptor: NetworkInterceptor = TestBed.inject(NetworkInterceptor);
    await expect(interceptor).toBeTruthy();
  });*/

  it('should call show and hide on request.', () => {
    spyOn(mockService, 'show').and.callFake(() => of());
    spyOn(mockService, 'hide').and.callFake(() => of());
    http.get('/ds_data').subscribe((data) => {
      void expect(data).toEqual('Payload');
    });
    const successReq = httpTestingController.match('/ds_data')[0];
    successReq.flush('Payload', { status: 200, statusText: 'OK' });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    void expect(mockService.show).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    void expect(mockService.hide).toHaveBeenCalled();
    httpTestingController.verify();
  });
});
