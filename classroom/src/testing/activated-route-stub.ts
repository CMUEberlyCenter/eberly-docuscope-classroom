// export for convenience.
export { ActivatedRoute } from '@angular/router';

import { convertToParamMap, ParamMap, Params } from '@angular/router';
import { Observable, ReplaySubject } from 'rxjs';

/**
 * An ActivateRoute test double with a `paramMap` observable.
 * Use the `setParamMap()` method to add the next `paramMap` value.
 */
export class ActivatedRouteStub {
  // Use a ReplaySubject to share previous values with subscribers
  // and pump new values into the `paramMap` observable
  #subject = new ReplaySubject<ParamMap>();

  /** The mock paramMap observable */
  readonly paramMap = this.#subject.asObservable();

  constructor(initialParams?: Params) {
    this.setParamMap(initialParams);
  }

  /** Set the paramMap observables's next value */
  setParamMap(params?: Params): void {
    this.#subject.next(convertToParamMap(params));
  }

  get snapshot(): { paramMap: Observable<ParamMap> } {
    return { paramMap: this.#subject.asObservable() };
  }
}

/*
Copyright 2017-2018 Google Inc. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/
