/* @flow */

export const TAKE = Symbol.for('@@saga/take');

export const PUT = Symbol.for('@@saga/put');

export const JOIN = Symbol.for('@@saga/join');

export const CANCEL = Symbol.for('@@saga/cancel');

export const CALL = Symbol.for('@@saga/call');

export const FORK = Symbol.for('@@saga/fork');

export const ERROR = Symbol.for('@@saga/error');

export const END = Symbol.for('@@saga/end');

export const KILL_LOOP = Symbol.for('@@saga/kill_loop');

export const ROOT_SAGA = Symbol.for('@@saga/root_saga');

export const IS_SAGA = Symbol.for('@@saga/is_saga');

export const EMPTY_OBJECT = Object.freeze(Object.create(null));

export const EMPTY_ARRAY = Object.freeze([]);
