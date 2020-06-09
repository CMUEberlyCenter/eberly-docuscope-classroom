import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Settings {
  title: string;
  institution: string;
  unit: number;
  homepage: string;
  scatter: {width: number; height: number};
  boxplot: {cloud: boolean};
  stv: {max_clusters: number};
}

const default_settings: Settings = {
  title: 'DocuScope Classroom',
  institution: 'CMU',
  unit: 100,
  homepage: 'https://www.cmu.edu/dietrich/english/research/docuscope.html',
  scatter: {width: 400, height: 400},
  boxplot: {cloud: true},
  stv: {max_clusters: 4}
};

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  assets_settings = 'assets/settings.json';
  constructor(private http: HttpClient) { }
  getSettings(): Observable<Settings> {
    return this.http.get<Settings>(this.assets_settings).pipe(
      catchError(err => of(default_settings))
    );
  }
}
