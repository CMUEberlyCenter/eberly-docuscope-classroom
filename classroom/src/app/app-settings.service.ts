import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppSettings } from './app-settings';

@Injectable({
  providedIn: 'root'
})
export class AppSettingsService {

  constructor(private http: HttpClient) { }

  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>('/assets/appsettings.json');
  }
}
