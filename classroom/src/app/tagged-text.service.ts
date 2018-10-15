import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { CONFIG } from './app-settings';

@Injectable({
  providedIn: 'root'
})
export class TaggedTextService {
  private server: string = CONFIG.backend_server+'/text_content';

  constructor(private http: HttpClient) { }

  getTaggedText(doc_id: string) {
    let text_query = {'text_id': doc_id, 'dictionary': '270CoverLetter'};
    return this.http.post(this.server, text_query);
  }
}
