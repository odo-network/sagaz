/* @flow */
import type { Saga$Job, Saga$Controller } from './types';

export class SagaCancellationError extends Error {
  saga: Saga$Controller;

  constructor(job: Saga$Job, ...args: Array<any>) {
    super(...args);
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, SagaCancellationError);
    }
    this.saga = job.controller;
  }
}
