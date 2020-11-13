/* eslint-disable @typescript-eslint/quotes */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable /* , of*/ } from 'rxjs';
// import { catchError } from 'rxjs/operators';

export interface Entry {
  label: string;
  help: string;
}
export interface Cluster extends Entry {
  name: string;
}
interface Subcategory extends Entry {
  clusters: Cluster[];
}
interface Category extends Entry {
  subcategories: Subcategory[];
}
export interface CommonDictionary {
  default_dict: string;
  custom_dict: string;
  use_default_dict: boolean;
  timestamp: string;
  categories: Category[];
}

@Injectable({
  providedIn: 'root'
})
export class DictionaryTreeService {
  private _common_dict = 'assets/common_dict.json';

  constructor(private http: HttpClient) { }

  getJSON(): Observable<CommonDictionary> {
    return this.http.get<CommonDictionary>(this._common_dict);
    /* .pipe(catchError(err => of())) */
  }
}
