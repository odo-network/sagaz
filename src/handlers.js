/* @flow */
import type {
  Saga$Job,
  Saga$TakeSet,
  Saga$Controller,
  Saga$Error,
} from './types';

import {
  TAKE, CALL, ERROR, CANCEL, FORK, END, PUT, JOIN,
} from './constants';

import {
  runChildSaga,
  isSaga,
  sanitizeChild,
  sagaPromise,
  cancelSaga,
  sagaDefer,
} from './utils';

const handle = {
  // $FlowIgnore
  [TAKE](args: Array<any>, job: Saga$Job) {
    const sets = new Set();
    args.forEach(type => {
      const set: Saga$TakeSet = job.root.context.takes.get(type) || new Set();
      set.type = type;
      sets.add(set);
      job.root.context.takes.set(type, set);
    });
    return sagaDefer(job, sets, descriptor => {
      sets.forEach(nestedSet => {
        nestedSet.delete(descriptor);
        if (nestedSet.size === 0) {
          job.root.context.takes.delete(nestedSet.type);
        }
      });
    });
  },
  // $FlowIgnore
  [PUT](args: Array<any>, job: Saga$Job) {
    return job.root.controller.dispatch(...args);
  },
  // $FlowIgnore
  async [CALL](_args: Array<any>, job: Saga$Job) {
    const [fn, ...args] = _args;
    const fnIsSaga = isSaga(fn);
    const result = fnIsSaga ? fn : await sagaPromise([fn(...args)], job);
    if (!result) return result;
    if (result && (fnIsSaga || isSaga(result))) {
      const child = runChildSaga(result, args, job);
      return child.controller.promise();
    }
    return result;
  },
  // $FlowIgnore
  [FORK]([startTask, ...args], job: Saga$Job): Promise<Saga$Controller> {
    const child = runChildSaga(startTask, args, job);
    return child.controller;
  },
  // $FlowIgnore
  [JOIN](controllers: Array<Saga$Controller>, job: Saga$Job) {
    return sagaPromise(
      [Promise.all(controllers.map(controller => controller.promise()))],
      job,
    );
  },
  // $FlowIgnore
  [ERROR]([_err]: [Saga$Error], job: Saga$Job) {
    console.log('Handle Error! ', _err);
    // $FlowIgnore
    const err: Saga$Error = typeof _err === 'symbol' ? new Error(String(_err)) : _err;
    if (typeof err === 'object' && !err.saga) {
      err.saga = job.controller;
    }
    let error = err;
    let caught = false;
    try {
      job.status.error = err;
      if (job.context.promise) {
        const [, reject] = job.context.promise;
        job.context.promise = undefined;
        reject(error);
      }
      if (job.task.catch) {
        job.task.catch(err);
        caught = true;
      }
    } catch (e) {
      error = e;
      if (typeof error === 'object' && typeof err === 'object') {
        error.saga = err.saga;
      }
      caught = false;
    } finally {
      if (!caught) {
        let ancestor = job;
        while (!ancestor.isRoot) {
          ancestor = ancestor.context.parent;
          if (!ancestor.status.complete) {
            // console.log(
            //   'Propagating Error from ',
            //   job.id,
            //   ' into ancestor: ',
            //   ancestor.id,
            // );
            ancestor.proc.throw(error);
            break;
          }
        }
      }
    }
  },
  // $FlowIgnore
  [END](args: Array<any>, job: Saga$Job) {
    if (job.status.complete) return;

    if (job.context.queue.size) {
      job.context.queue.forEach(descriptor => {
        if (descriptor.finally) {
          descriptor.finally(descriptor);
        }
        if (descriptor.reject) {
          descriptor.reject(job.status.cancelled ? CANCEL : END);
        }
      });
      job.context.queue.clear();
    }

    job.status.complete = true;

    if (job.task.finally) {
      try {
        job.task.finally();
      } catch (e) {
        job.status.error = e;
      }
    }

    if (job.context.promise) {
      const [resolve, reject] = job.context.promise;
      job.context.promise = undefined;
      if (job.status.error) {
        reject(job.status.error);
      } else {
        resolve(job.status.result);
      }
    }

    sanitizeChild(job);

    if (!job.status.cancelled) {
      job.runner.return(job.status.result);
    }
  },
  // $FlowIgnore
  [CANCEL](args: Array<any>, job: Saga$Job) {
    return cancelSaga(job);
  },
};

export default function handler(value: void | Array<any>, job: Saga$Job) {
  let response;
  if (Array.isArray(value)) {
    const [type, ...args] = value;
    // console.log('[handler]: Handle Type: ', job.id, type, args);
    if (handle[type]) {
      response = handle[type](args, job);
    } else {
      const err = new Error(`Unknown Signal "${String(type)}"`);
      // $FlowIgnore
      response = handle[ERROR]([err], job);
    }
  }
  return response;
}
