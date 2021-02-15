/* eslint-disable @typescript-eslint/quotes */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { CommonDictionary, ICommonDictionary } from './common-dictionary';
import { shareReplay } from 'rxjs/operators';
// import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CommonDictionaryService {
  private _common_dict = `${environment.backend_server}/common_dictionary`;

  constructor(private http: HttpClient) { }

  getJSON(): Observable<CommonDictionary> {
    return this.http.get<ICommonDictionary>(this._common_dict).
      pipe(map(data => new CommonDictionary(data)),
        shareReplay(1));
    /* .pipe(catchError(err => of())) */
  }
}
