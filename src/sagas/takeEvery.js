/* @flow */
/*
  A saga that gives the similar effect of
  redux-saga's "takeEvery" which takes then
  forks on every match.
*/
import type { Saga$Factory, Saga$Worker } from '../types';

import { take, fork } from '../effects';

import { Saga } from '../utils';

function* takeEvery(types: Array<any>, saga: Saga$Factory): Saga$Worker {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [, args] = yield take(...types);
    yield fork(saga, ...args);
  }
}

export default Saga(takeEvery);
