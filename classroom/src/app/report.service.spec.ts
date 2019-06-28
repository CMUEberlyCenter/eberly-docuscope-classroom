import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { ReportService } from './report.service';
import { MessageService } from './message.service';

describe('ReportService', () => {
  beforeEach(() => {
    const message_service_spy = jasmine.createSpyObj('MessageService', ['add']);
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, MatSnackBarModule ],
      providers: [ ReportService,
                   { provide: MessageService, useValue: message_service_spy } ]
    });
  });

  it('should be created', () => {
    const service: ReportService = TestBed.get(ReportService);
    expect(service).toBeTruthy();
  });
});
