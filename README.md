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
