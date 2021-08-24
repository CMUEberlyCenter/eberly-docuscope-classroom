export * from './async-observable-helpers';
// export * from './activated-route-stub'; // broken Params? (unused)
export * from './fake-common-dictionary';

export type Spied<T> = {
  [Method in keyof T]: jasmine.Spy;
};
