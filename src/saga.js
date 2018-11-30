/* @flow */
import type {
  Saga$Controller,
  Saga$Options,
  Saga$Factory,
  Saga$Runner,
} from './types';

import buildProcess from './proc';

let rootID = 0;

declare function runSaga(
  options: Saga$Options,
  factory: Saga$Factory | Saga$Runner,
): Saga$Controller;

// eslint-disable-next-line no-redeclare
declare function runSaga(factory: Saga$Factory | Saga$Runner): Saga$Controller;

/**
 * Runs a root-level saga, returning a task descriptor
 * that allows control over the task.
 * @param {SagaFactory} startTask
 */
// eslint-disable-next-line no-redeclare
export function runSaga(
  ...args: [Saga$Options, Saga$Factory] & [Saga$Factory]
): Saga$Controller {
  rootID += 1;
  let options: Saga$Options = { works: undefined };
  let startTask: void | Saga$Factory;
  if (args.length === 1) {
    [startTask] = args;
  } else if (args.length === 2) {
    [options, startTask] = args;
  }
  if (!startTask) {
    throw new Error(
      '[ERROR] | saga | runSaga() did not find a valid Saga Factory.',
    );
  }
  return buildProcess([rootID], startTask, undefined, {
    takes: new Map(),
    options,
  }).controller;
}
