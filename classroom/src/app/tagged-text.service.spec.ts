import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from './../environments/environment';
import { TaggedTextService } from './tagged-text.service';

describe('TaggedTextService', () => {
  let service: TaggedTextService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatSnackBarModule],
      providers: [TaggedTextService],
    });
    service = TestBed.inject(TaggedTextService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getTaggedText', () => {
    const fubar = {
      text_id: 'fubar',
      word_count: 4,
      html_content: '<p>a somewhat short sentence.</p>',
      dictionary: { short: { dimension: 'descriptive', cluster: 'adjective' } },
      dict_info: {},
    };

    service.getTaggedText('fubar').subscribe((data) => {
      expect(data.text_id).toBe('fubar');
    });
    const req = httpMock.expectOne(
      `${environment.backend_server}/text_content/fubar`
    );
    expect(req.request.method).toBe('GET');
    req.flush(fubar);

    // check caching
    service.getTaggedText('fubar').subscribe((data) => {
      expect(data.text_id).toBe('fubar');
    });
  });
});
