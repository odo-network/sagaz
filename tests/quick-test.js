// /* @flow */
// // import type { Saga$Saga } from './src/types';
// import {
//   runSaga,
//   Saga,
//   take,
//   // fork,
//   // put,
//   // call,
//   // join,
//   // wait,
//   SagaCancellationError,
// } from '../src';

// // import takeEvery from '../src/sagas/takeEvery';

// // const i = 0;

// // const sagas = {
// //   one() {
// //     return Saga({
// //       * run() {
// //         console.log('[one]: Runs! Awaits NEW_TYPE');
// //         const result = yield take('NEW_TYPE');
// //         console.log('[one]: NEW_TYPE Received: ', result);
// //         return 1;
// //       },
// //       cancelled(reason) {
// //         console.log('[one]: Cancelled Because: ', reason);
// //       },
// //       finally() {
// //         console.log('[one]: Finally!');
// //       },
// //     });
// //   },
// //   two: Saga(function* runSagaTwo(...args) {
// //     console.log('[two]: Runs! ', this.id, args);
// //     // while (true) {
// //     //   const result = yield take('*');
// //     //   console.log('[two]: Dispatch Received: ', result);
// //     // }
// //   }),
// // };

// const sagaTask = runSaga(
//   { works: 'yay' },
//   Saga(
//     function* run() {
//       while (true) {
//         const value = yield take('MY_TYPE');
//         console.log('Receive MY_TYPE: ', value);
//       }
//     },
//     // cancelled(reason) {
//     //   console.log('[root]: Cancelled because: ', reason);
//     // },
//     // // catch(err) {
//     // //   console.log('[1]: Error Occurred: ', err);
//     // // },
//     // async finally() {
//     //   console.log('[root]: Finally Called');
//     // },
//   ),
// );

// sagaTask
//   .promise()
//   .then(result => {
//     console.log('Task Promise is: ', result);
//   })
//   .catch(err => {
//     if (err instanceof SagaCancellationError) {
//       console.log('SAGA WAS CANCELLED!');
//     } else {
//       console.log('Caught!');
//       console.log('Saga Error: ', err);
//       console.log('Saga Error Promise: ', err.saga.id);
//       console.log('Original Error: ', err.saga.error.message);
//       console.log('Propagated Error: ', err.message);
//     }
//   })
//   .finally(() => {
//     console.log('Saga Data: ');
//     console.log('Saga Size: ', sagaTask.size);
//   });

// // const intervalID = setInterval(() => {
// //   i += 1;
// //   console.log('Interval: ', i);
// //   // sagaTask.cancel('finished', 1, 2, 3);
// //   sagaTask.dispatch('MY_TYPE', 'hello!', i);
// //   if (i >= 1) {
// //     // console.log('Cancelling!');
// //     sagaTask.cancel('done');]
// //     // sagaTask.dispatch('SUB_TYPE');
// //     clearInterval(intervalID);
// //   }
// // }, 1000);

// setTimeout(() => {
//   sagaTask.dispatch('MY_TYPE');
//   sagaTask.dispatch('MY_TYPE');
//   sagaTask.dispatch('MY_TYPE');
//   sagaTask.dispatch('MY_TYPE');
// });

// setTimeout(() => {
//   console.log('Finish Last Timeout');
//   sagaTask.cancel('fail');
// }, 10000);

import {
  runSaga, Saga, take, SagaCancellation,
} from '../src';

function* rootSaga(): Generator<any, any, any> {
  const [type, args] = yield take('*');
  console.log('TYPE RECEIVED: ', type, args);
  return [type, args];
}

const sagaTask = runSaga(Saga(rootSaga));

sagaTask
  .promise()
  .then(result => {
    console.log('Root Saga Result: ', result);
  })
  .catch(err => {
    if (err instanceof SagaCancellation) {
      console.log('Saga Was Cancelled!');
    } else {
      console.log('Saga Error: ', err);
    }
  });

sagaTask.cancel('some reason');
