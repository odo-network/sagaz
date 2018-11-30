/* @flow */
import type { Saga$Saga, Saga$Controller } from './types';

import {
  TAKE, CALL, ERROR, CANCEL, FORK, END, PUT, JOIN,
} from './constants';

export function wait(delay?: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delay));
}

export function take(...types: Array<any>) {
  return [TAKE, ...types];
}

export function put(type: any, ...args: Array<any>) {
  return [PUT, type, ...args];
}

export function call(fn: Saga$Saga | Function, ...args: Array<any>) {
  return [CALL, fn, ...args];
}

export function error(err: any) {
  return [ERROR, err];
}

export function cancel(reason: any, ...args: Array<any>) {
  return [CANCEL, reason, ...args];
}

export function fork(fn: Saga$Saga | Function, ...args: Array<any>) {
  return [FORK, fn, ...args];
}

export function join(...args: Array<Saga$Controller>) {
  return [JOIN, ...args];
}

export function end() {
  return [END];
}
