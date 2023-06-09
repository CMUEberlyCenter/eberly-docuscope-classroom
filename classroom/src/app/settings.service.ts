import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

export interface Settings {
  title: string;
  institution: string;
  unit: number;
  homepage: string;
  sticky_headers: boolean;
  bubble: { initial_level: string };
  scatter: { width: number; height: number };
  mtv: { horizontal: boolean; documentColors: string[] };
}

const default_settings: Settings = {
  title: 'DocuScope Classroom',
  institution: 'CMU',
  unit: 100,
  homepage: 'https://www.cmu.edu/dietrich/english/research/docuscope.html',
  sticky_headers: true,
  bubble: { initial_level: 'Category' },
  scatter: { width: 400, height: 400 },
  mtv: { horizontal: true, documentColors: ['#1c66aa', '#639c54'] },
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  assets_settings = 'assets/settings.json';
  settings: Observable<Settings> | undefined;

  constructor(private http: HttpClient) {}
  getSettings(): Observable<Settings> {
    if (!this.settings) {
      this.settings = this.http.get<Settings>(this.assets_settings).pipe(
        map((ret) => ({ ...default_settings, ...ret })),
        shareReplay(1),
        catchError(() => of(default_settings))
      );
    }
    return this.settings;
  }
}
