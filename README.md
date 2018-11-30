# sagaz

A generalized dependency-free library providing a similar UX to `redux-saga` but less tied to `redux`. It provides most of the core effects that `redux-saga` provides and should have overall similar behavior.

## Install

```
yarn add sagaz
```

**or**

```
npm install --save sagaz
```

## Coverage

This project provides `.flow.js` files for `Flow` to utilize. It also attempts to provide 100% test coverage.

## Example

### Simple

```js
import { runSaga, Saga, take } from "sagaz";

const sagaTask = runSaga(
  Saga(function* rootSaga() {
    while (true) {
      const [type, args] = yield take("MY_TYPE");
      console.log("Receive MY_TYPE: ", args);
    }
  })
);

sagaTask.dispatch("MY_TYPE", 1);
sagaTask.dispatch("MY_TYPE", 2);
sagaTask.dispatch("MY_TYPE", 3);
sagaTask.dispatch("MY_TYPE", 4);
```

```
Receive MY_TYPE:  [ 1 ]
Receive MY_TYPE:  [ 2 ]
Receive MY_TYPE:  [ 3 ]
Receive MY_TYPE:  [ 4 ]
```

### Simple Take & Fork

```js
import { runSaga, Saga, take, fork } from "sagaz";

function* forkedSaga(...args): Generator<any, any, any> {
  while (true) {
    const [, args2] = yield take("SECOND_TYPE");
    cconsole.log("SECOND_TYPE RECEIVED ", args, args2);
  }
}

function* rootSaga(): Generator<any, any, any> {
  while (true) {
    const [, args] = yield take("MY_TYPE");
    console.log("MY_TYPE RECEIVED ", args);
    yield fork(forkedSaga, ...args);
  }
}

Saga(rootSaga);
Saga(forkedSaga);

const sagaTask = runSaga(rootSaga);

sagaTask.dispatch("MY_TYPE", 1);
sagaTask.dispatch("MY_TYPE", 2);

sagaTask.dispatch("SECOND_TYPE", 5);
sagaTask.dispatch("SECOND_TYPE", 6);
```

```
MY_TYPE RECEIVED  [ 1 ]
MY_TYPE RECEIVED  [ 2 ]
SECOND_TYPE RECEIVED  [ 1 ] [ 5 ]
SECOND_TYPE RECEIVED  [ 2 ] [ 5 ]
SECOND_TYPE RECEIVED  [ 1 ] [ 6 ]
SECOND_TYPE RECEIVED  [ 2 ] [ 6 ]
```

### Promised Result

It is also possible to get a promise that resolves to the result of any saga. Since cancellation isn't a native part of `Promise` we throw a custom error in its place that you can check against within a catch clause.

```js
import { runSaga, Saga, take, SagaCancellation } from "sagaz";

function* rootSaga(): Generator<any, any, any> {
  const [type, args] = yield take("*");
  console.log("TYPE RECEIVED: ", type, args);
  return [type, args];
}

const sagaTask = runSaga(Saga(rootSaga));

sagaTask
  .promise()
  .then(result => {
    console.log("Root Saga Result: ", result);
  })
  .catch(err => {
    if (err instanceof SagaCancellation) {
      console.log("Saga Was Cancelled!");
    } else {
      console.log("Saga Error: ", err);
    }
  });

sagaTask.dispatch("WILDCARD_PROMISE_EXAMPLE", 1);
```

```
TYPE RECEIVED:  WILDCARD_PROMISE_EXAMPLE [ 1 ]
Root Saga Result:  [ 'WILDCARD_PROMISE_EXAMPLE', [ 1 ] ]
```
