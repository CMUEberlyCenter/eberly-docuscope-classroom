import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, retry, publishReplay, refCount } from 'rxjs/operators';
import { AppSettings, CONFIG } from './app-settings';

@Injectable(/*{
  providedIn: 'root'
}*/)
export class AppSettingsService {
  settings_url: string = 'assets/app-settings.json';
  private _settings;

  constructor(private injector: Injector) { }

  loadSettings() {
    let http = this.injector.get(HttpClient);
    return http.get(this.settings_url)
      .toPromise()
      .then(data => this._settings = data)
      .catch(error => this._settings = CONFIG)
  }

  get config() { return this._settings; }
  get settings() {
    return this._settings;
  }
}
