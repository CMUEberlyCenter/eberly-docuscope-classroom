/// <reference types="@types/google.visualization" />
import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GoogleChartsLoaderService {
  private scriptLoadingEmitter: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  private scriptPromise: Promise<void>;

  private scriptIsLoading = false;
  private loaded = false;

  constructor() {
    this.scriptPromise = new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.charts) {
        resolve();
      } else if (!this.scriptIsLoading) {
        this.scriptIsLoading = true;
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://www.gstatic.com/charts/loader.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          this.scriptIsLoading = false;
          this.scriptLoadingEmitter.emit(true);
          resolve();
        };
        script.onerror = () => {
          this.scriptIsLoading = false;
          this.scriptLoadingEmitter.emit(false);
          reject();
        };
        document.getElementsByTagName('head')[0].appendChild(script);
      } else {
        this.scriptLoadingEmitter.subscribe((loaded: boolean) =>
          loaded ? resolve() : reject()
        );
      }
    });
  }

  public async load(): Promise<void> {
    await this.scriptPromise;
    if (!this.loaded) {
      await google.charts.load('current', { packages: ['corechart'] });
      this.loaded = true;
    }
  }
}
