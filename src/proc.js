/* @flow */

import type { Saga$Factory, Saga$Job } from './types';

import { ROOT_SAGAS } from './context';
import { KILL_LOOP, EMPTY_OBJECT, EMPTY_ARRAY } from './constants';
import { end, error } from './effects';

import handle from './handlers';

import { cancelSaga, getTotalSize, getAndValidateTask } from './utils';

// used for testing cleanup and sanitization
// const SAGAS = new Set();

function* taskRunner(job: Saga$Job) {
  try {
    yield;
    // SAGAS.add(job.controller.id);
    // console.log(`${job.controller.id} STARTS: ${SAGAS.size} total sagas`);
    let response;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const { value, done } = job.runner.next(response);
        if (done) {
          job.status.result = value;
          return value;
        }
        response = yield value;
      } catch (e) {
        handle(error(e), job);
        break;
      }
    }
  } finally {
    handle(end(), job);
    // SAGAS.delete(job.controller.id);
    // console.log(`${job.controller.id} ENDS: ${SAGAS.size} total sagas`);
    // console.log(`
    //   [FINISH DESCRIPTOR]:
    //     ID: ${job.controller.id}
    //     Children Remaining: ${job.children.size}
    //     Status: ${JSON.stringify(job.status)}
    //     Takes Size: ${job.root.context.takes.size}
    //     Queue Size: ${job.context.queue.size}
    //     Remaining Sagas: ${Array.from(SAGAS).join(', ')}
    //     Total Size: ${job.root.controller.size}
    // `);
  }
}

async function loopJob(job: Saga$Job, _response) {
  let response = _response;
  try {
    job.status.loop = true;
    // eslint-disable-next-line no-constant-condition
    while (!job.status.complete) {
      const { value, done } = job.proc.next(response);
      if (done) return;
      response = value ? handle(value, job) : undefined;
      if (typeof response === 'object' && typeof response.then === 'function') {
        response = await response;
      }
      if (response === KILL_LOOP) {
        return;
      }
    }
  } finally {
    job.status.loop = false;
  }
}

function createJob(
  id: Array<number>,
  startTask: Saga$Factory,
  rootJob: void | Saga$Job,
  withContext: Object,
  withArgs: Array<any>,
): Saga$Job {
  const queue = new Set();
  const children = new Set();
  let promise;

  const _job: $Shape<Saga$Job> = {
    id,
    isRoot: !rootJob,
    get root() {
      if (!rootJob) {
        return job;
      }
      return rootJob;
    },
    get promise() {
      return promise;
    },
    children,
    status: {
      uid: 0,
      cancelled: false,
      complete: false,
      error: undefined,
      loop: false,
      result: undefined,
    },
    context: {
      ...withContext,
      queue,
    },
    controller: Object.freeze({
      get id() {
        return id.join('.');
      },
      get size() {
        return getTotalSize(job);
      },
      get complete() {
        return job.status.complete;
      },
      get cancelled() {
        return job.status.cancelled;
      },
      get result() {
        return job.status.result;
      },
      get error() {
        return job.status.error;
      },
      promise() {
        if (!promise) {
          promise = new Promise((resolve, reject) => {
            job.context.promise = [resolve, reject];
          });
          if (job.task.catch) {
            // we can swallow the error in this case since
            // it will be handled
            promise.catch(() => {});
          }
        }
        return promise;
      },
      dispatch(type, ...args) {
        console.log('[DISPATCH]: ', type);
        const wildcardSet = job.root.context.takes.get('*');
        if (wildcardSet) {
          wildcardSet.forEach(descriptor => {
            if (descriptor.finally) {
              descriptor.finally(descriptor);
            }
            loopJob(descriptor.job, [type, args]);
          });
        }
        const set = job.root.context.takes.get(type);
        if (!set) return;
        set.forEach(descriptor => {
          if (wildcardSet && wildcardSet.has(descriptor)) return;
          if (descriptor.finally) {
            descriptor.finally(descriptor);
          }
          loopJob(descriptor.job, [type, args]);
        });
      },
      cancel(...args: Array<any>) {
        return cancelSaga(job, args);
      },
    }),
  };

  const task = getAndValidateTask(startTask, withArgs, _job);

  /*
    This was necessary to trick Flow into typing
    the job properly here so that we did not need
    to make `proc` an optional property.
  */
  const job: Saga$Job = Object.assign(_job, {
    task,
    runner: task.run.apply(_job.controller, withArgs),
    proc: taskRunner(_job),
  });

  return job;
}

export default function buildProcess(
  id: Array<number>,
  startTask: Saga$Factory,
  rootJob?: void | Saga$Job,
  withContext?: Object = EMPTY_OBJECT,
  withArgs?: Array<any> = EMPTY_ARRAY,
): Saga$Job {
  const job = createJob(id, startTask, rootJob, withContext, withArgs);

  if (job.isRoot) {
    ROOT_SAGAS.add(job);
  } else if (job.context.parent) {
    job.context.parent.children.add(job);
  }

  loopJob(job);

  return job;
}
