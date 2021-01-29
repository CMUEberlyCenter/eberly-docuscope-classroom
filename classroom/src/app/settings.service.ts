import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, publishReplay, refCount, shareReplay } from 'rxjs/operators';

interface Settings {
  title: string;
  institution: string;
  unit: number;
  homepage: string;
  scatter: {width: number; height: number};
  boxplot: {cloud: boolean};
  stv: {max_clusters: number};
  mtv: {horizontal: boolean; documentColors: string[]};
}

const default_settings: Settings = {
  title: 'DocuScope Classroom',
  institution: 'CMU',
  unit: 100,
  homepage: 'https://www.cmu.edu/dietrich/english/research/docuscope.html',
  scatter: {width: 400, height: 400},
  boxplot: {cloud: true},
  stv: {max_clusters: 4},
  mtv: {horizontal: true, documentColors: ['#1c66aa', '#639c54']}
};

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  assets_settings = 'assets/settings.json';
  settings: Observable<Settings>;

  constructor(private http: HttpClient) { }
  getSettings(): Observable<Settings> {
    if (!this.settings) {
      this.settings = this.http.get<Settings>(this.assets_settings).pipe(
        shareReplay(1),
        catchError(() => of(default_settings))
      );
    }
    return this.settings;
  }
}
