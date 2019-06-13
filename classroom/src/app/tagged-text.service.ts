import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, publishReplay, refCount } from 'rxjs/operators';
import { AppSettingsService } from './app-settings.service';
import { HttpErrorHandlerService, HandleError } from './http-error-handler.service';

interface TextContentSchema {
  text_id: string;
}
export interface TextContentDictionaryInformation {
  id: string;
  name: string;
  description: string;
}
export interface TextContent {
  text_id: string;
  word_count: number;
  html_content: string;
  dictionary: Record<string, {dimension: string, cluster: string}>;
  dict_info: {
    cluster?: TextContentDictionaryInformation[],
    dimension?: TextContentDictionaryInformation[]
  };
}

@Injectable({
  providedIn: 'root'
})
export class TaggedTextService {
  private server = `${this.env.config.backend_server}/text_content`;
  // since this is a new window, caching doesn't seem to be useful.
  private tag_data: Map<string, Observable<TextContent>> = new Map<string, Observable<TextContent>>();
  private handleError: HandleError;

  constructor(private _http: HttpClient,
              httpErrorHandler: HttpErrorHandlerService,
              private env: AppSettingsService) {
    this.handleError = httpErrorHandler.createHandleError('TaggedTextService');
  }

  getTaggedText(doc_id: string): Observable<TextContent> {
    if (!this.tag_data.has(doc_id)) {
      const text_query: TextContentSchema = {'text_id': doc_id};
      this.tag_data.set(
        doc_id,
        this._http.post<TextContent>(this.server, text_query)
          .pipe(
            publishReplay(1),
            refCount(),
            catchError(this.handleError('getTaggedText', <TextContent>{})))
      );
    }
    return this.tag_data.get(doc_id);
  }
}
