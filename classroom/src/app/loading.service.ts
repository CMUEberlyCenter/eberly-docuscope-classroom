import { Injectable } from '@angular/core';
import { BehaviorSubject, delay } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loading = new BehaviorSubject<boolean>(false);
  // add delay(0) so that angular update cycle is not broken.
  public readonly loading$ = this.loading.asObservable().pipe(delay(0));

  //constructor() {}
  show() {
    this.loading.next(true);
  }
  hide() {
    this.loading.next(false);
  }
}
