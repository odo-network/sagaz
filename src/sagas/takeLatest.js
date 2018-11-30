/* @flow */
/*
  A saga that gives the similar effect of
  redux-saga's "takeEvery" which takes then
  forks on every match.
*/
import type { Saga$Factory, Saga$Worker } from '../types';

import { take, fork, cancel } from '../effects';

import { Saga } from '../utils';

function* takeLatest(types: Array<any>, saga: Saga$Factory): Saga$Worker {
  // eslint-disable-next-line no-constant-condition
  let previousTask;
  while (true) {
    const [, args] = yield take(...types);
    if (previousTask) {
      yield cancel(previousTask);
    }
    previousTask = yield fork(saga, ...args);
  }
}

export default Saga(takeLatest);
