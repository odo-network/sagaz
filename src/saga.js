/* @flow */
import type { Saga$Controller, Saga$Factory, Saga$Runner } from './types';

import buildProcess from './proc';

let rootID = 0;

/**
 * Runs a root-level saga, returning a task descriptor
 * that allows control over the task.
 * @param {SagaFactory} startTask
 */
// eslint-disable-next-line no-redeclare
export function runSaga(
  startTask: Saga$Factory | Saga$Runner,
): Saga$Controller {
  if (!startTask) {
    throw new Error(
      '[ERROR] | saga | runSaga() did not find a valid Saga Factory.',
    );
  }
  rootID += 1;
  return buildProcess([rootID], startTask, undefined, {
    takes: new Map(),
  }).controller;
}
