/* @flow */
// const job = {
//   id,
//   isRoot: !root,
//   get root() {
//     if (!root) {
//       return job;
//     }
//     return root;
//   },
//   children,
//   status: {
//     cancelled: false,
//     complete: false,
//     error: undefined,
//     result: undefined,
//   },
//   context: {
//     ...withContext,
//     queue,
//   },
//   task,
//   runner,
// };

// controller: Object.freeze({
//   get id() {
//     return id.join('.');
//   },
//   get complete() {
//     return job.status.complete;
//   },
//   get cancelled() {
//     return job.status.cancelled;
//   },
//   get result() {
//     return job.status.result;
//   },
//   get error() {
//     return job.status.error;
//   },
//   promise() {
//     if (!promise) {
//       promise = new Promise((resolve, reject) => {
//         job.context.promise = [resolve, reject];
//       });
//       if (job.task.catch) {
//         // we can swallow the error in this case since
//         // it will be handled
//         promise.catch(() => { });
//       }
//     }
//     return promise;
//   },
//   dispatch(type, ...args) {
//     if (!job.status.complete) {
//       const set = job.root.context.takes.get(type);
//       if (!set) return;
//       set.forEach(descriptor => {
//         descriptor.resolve(args);
//       });
//       return true;
//     }
//     return false;
//   },
//   cancel(reason, ...args) {
//     if (!job.status.complete && !job.status.cancelled) {
//       job.proc.throw(cancel(reason, ...args));
//       return true;
//     }
//     return false;
//   },
// }),

export type Saga$Options = {| [any]: empty, works?: string |};

export type Saga$Controller = {|
  get id(): string,
  get complete(): boolean,
  get cancelled(): boolean,
  get result(): any,
  get error(): any,
  get size(): number,
  promise(): Promise<any>,
  dispatch(type: any, ...args: Array<any>): void,
  cancel(reason: any, ...args: Array<any>): void,
|};

export type Saga$Worker = Generator<any, any, any>;

export type Saga$Runner = (...args: Array<any>) => Saga$Worker;

export type Saga$Factory =
  | Saga$Saga
  | ((...args: Array<any>) => Saga$Runner | Saga$Saga);

export type Saga$Saga = {|
  run(...args: Array<any>): Generator<any, any, any>,
  catch?: (err: Error) => any,
  cancelled?: (...args: Array<any>) => any,
  finally?: () => any,
|};

export type Saga$Descriptor = Object;
export type Saga$TakeSet = Set<Saga$Descriptor> & { type?: any };

export type Saga$Job = {|
  id: Array<number>,
  isRoot: boolean,
  get root(): Saga$Job,
  get promise(): void | Promise<any>,
  runner: Saga$Worker,
  children: Set<Saga$Job>,
  status: {|
    uid: number,
    cancelled: boolean,
    complete: boolean,
    loop: boolean,
    error: any,
    result: any,
  |},
  context: {
    [key: string]: any,
    queue: Set<Saga$Descriptor>,
  },
  task: any,
  controller: Saga$Controller,
  proc: Generator<void | Array<any>, void | Array<any>, *>,
|};

export type Saga$Error = Error & { saga?: Saga$Controller };
