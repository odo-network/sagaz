/* @flow */
import type {
  Saga$Factory,
  Saga$Saga,
  Saga$Job,
  Saga$Runner,
  Saga$TakeSet,
  Saga$Descriptor,
} from './types';

import { ROOT_SAGAS, ACTIVE_SAGAS } from './context';

import {
  KILL_LOOP, END, CANCEL, EMPTY_ARRAY,
} from './constants';

import { SagaCancellationError } from './errors';

import buildProcess from './proc';

/**
 * Uses a WeakSet to "tag" sagas so they can be easily identified
 * in later points as a saga.
 * @param {*} sagaDescriptor
 */
export function Saga<S: Saga$Saga | Saga$Runner>(sagaDescriptor: S): S {
  if (
    typeof sagaDescriptor !== 'function'
    && typeof sagaDescriptor.run !== 'function'
  ) {
    throw new Error(
      '[ERROR] | saga | saga() | Expected either saga to be a function or saga.run to be a generator function.',
    );
  }
  ACTIVE_SAGAS.add(sagaDescriptor);
  return sagaDescriptor;
}

export function sanitizeChild(job: Saga$Job) {
  if (job.isRoot) {
    if (job.children.size === 0 && job.status.complete) {
      ROOT_SAGAS.delete(job);
    }
    return;
  }
  if (job.children.size === 0 && job.status.complete) {
    job.context.parent.children.delete(job);
    return sanitizeChild(job.context.parent);
  }
}

export function sagaDefer(
  job: Saga$Job,
  sets: Set<Saga$TakeSet>,
  handleFinally?: (descriptor: Saga$Descriptor) => any,
) {
  const descriptor = { job, sets, finally: handleFinally };
  if (sets) {
    sets.forEach(set => {
      set.add(descriptor);
    });
  }
  job.context.queue.add(descriptor);
  return KILL_LOOP;
}

export function sagaPromise(
  promises: void | Array<Promise<any>>,
  job: Saga$Job,
  sets?: Set<Saga$TakeSet>,
  handleFinally?: (descriptor: Saga$Descriptor) => any,
) {
  let descriptor;
  return Promise.race(
    [
      ...(promises || EMPTY_ARRAY),
      new Promise((resolve, reject) => {
        descriptor = { resolve, reject, sets };
        if (sets) {
          sets.forEach(set => {
            set.add(descriptor);
          });
        }
        job.context.queue.add(descriptor);
      }),
    ].filter(Boolean),
  )
    .catch(handleSagaError)
    .finally(() => {
      job.context.queue.delete(descriptor);
      if (handleFinally) handleFinally(descriptor);
    });
}

export function handleSagaError(error: any) {
  switch (error) {
    case END:
    case CANCEL: {
      break;
    }
    default: {
      throw error;
    }
  }
}

export function cancelSaga(job: Saga$Job, args?: Array<any> = EMPTY_ARRAY) {
  if (job.status.cancelled) return;
  if (job.status.complete && job.children.size === 0) return;

  job.status.cancelled = true;
  job.status.error = new SagaCancellationError(job, args[0]);

  if (job.children.size) {
    [...job.children].reverse().forEach(child => cancelSaga(child, args));
  }

  if (job.task.cancelled) {
    job.task.cancelled(...args);
  }

  if (!job.status.complete) {
    // const error = new Error('cancelled');
    // error.saga = job.controller;
    job.runner.return(CANCEL);
    job.proc.return(CANCEL);
    // await job.proc.throw(cancel(...args));
  }
}

export function isSaga(value: any) {
  return ACTIVE_SAGAS.has(value);
}

export function removeSaga(value: any) {
  ACTIVE_SAGAS.delete(value);
}

export function runChildSaga(
  startTask: Saga$Factory,
  args: Array<any>,
  job: Saga$Job,
): Saga$Job {
  const childID = job.id.slice();
  job.status.uid += 1;
  childID.push(job.status.uid);
  const child = buildProcess(
    childID,
    startTask,
    job.root,
    {
      parent: job,
    },
    args,
  );
  return child;
}

export function getTotalSize(job: Saga$Job) {
  const base = job.status.complete ? 0 : 1;
  if (!job.children.size) return base;
  return [...job.children].reduce(
    (value, child) => value + getTotalSize(child),
    base,
  );
}

export function getAndValidateTask(
  startTask: Saga$Factory,
  withArgs: Array<any>,
  job: $Shape<Saga$Job>,
): Saga$Saga {
  let task: void | Saga$Saga;
  let taskValidated = isSaga(startTask);

  if (taskValidated) {
    if (typeof startTask === 'function') {
      // Flow can't handle this well since we are using
      // WeakSet to tag saga functions to identify them.
      // $FlowFixMe
      task = Saga({ run: startTask });
    } else {
      task = startTask;
    }
  } else if (typeof startTask === 'function') {
    const _task = startTask.apply(job.controller, withArgs);
    taskValidated = isSaga(_task);
    if (taskValidated && typeof _task === 'function') {
      task = Saga({ run: _task });
    } else if (typeof _task === 'object' && typeof _task.run === 'function') {
      task = _task;
    }
  }

  if (!task || !taskValidated) {
    throw new Error(
      '[ERROR] | saga | Received factory did not produce a Saga.  Did you forget to wrap it in Saga()?',
    );
  }

  if (typeof task.run !== 'function') {
    throw new Error(
      `[ERROR] | saga | task.run() not found in received saga with id: "${job.id.join(
        '.',
      )}"`,
    );
  }

  return task;
}
