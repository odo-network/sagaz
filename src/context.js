/* @flow */
import type { Saga$Saga, Saga$Job, Saga$Runner } from './types';

export const ROOT_SAGAS: Set<Saga$Job> = new Set();

export const ACTIVE_SAGAS: WeakSet<Saga$Saga | Saga$Runner> = new WeakSet();
