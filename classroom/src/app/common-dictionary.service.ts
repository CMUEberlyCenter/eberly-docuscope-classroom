import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { environment } from "../environments/environment";
import { CommonDictionary, ICommonDictionary } from "./common-dictionary";
// import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: "root",
})
export class CommonDictionaryService {
  private _common_dict = `${environment.backend_server}/common_dictionary`;

  constructor(private http: HttpClient) {}

  getJSON(): Observable<CommonDictionary> {
    return this.http.get<ICommonDictionary>(this._common_dict).pipe(
      map((data) => new CommonDictionary(data)),
      shareReplay(1)
    );
    /* .pipe(catchError(err => of())) */
  }
}
