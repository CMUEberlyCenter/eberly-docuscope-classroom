import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, publishReplay, refCount } from 'rxjs/operators';
import { environment } from './../environments/environment';
import { DictionaryInformation } from './assignment-data';
import { HandleError, HttpErrorHandlerService } from './http-error-handler.service';

export interface TextContent {
  text_id: string;
  word_count: number;
  html_content: string;
  course?: string;
  assignment?: string;
  instructor?: string;
  categories?: DictionaryInformation[];
}

@Injectable({
  providedIn: 'root'
})
export class TaggedTextService {
  private server = `${environment.backend_server}/text_content`;
  // since this is a new window, caching doesn't seem to be useful.
  private tag_data: Map<string, Observable<TextContent>> = new Map<string, Observable<TextContent>>();
  private handleError: HandleError;

  constructor(private _http: HttpClient,
    httpErrorHandler: HttpErrorHandlerService) {
    this.handleError = httpErrorHandler.createHandleError('TaggedTextService');
  }

  getTaggedText(doc_id: string): Observable<TextContent> {
    if (!this.tag_data.has(doc_id)) {
      this.tag_data.set(
        doc_id,
        this._http.get<TextContent>(`${this.server}/${doc_id}`)
          .pipe(
            publishReplay(1),
            refCount(),
            catchError(this.handleError('getTaggedText', {} as TextContent)))
      );
    }
    return this.tag_data.get(doc_id);
  }
}
