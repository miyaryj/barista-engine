const DialogflowClient = require('./lib/dialogflow-client');
const DialogStore = require('./lib/dialog-store');
const PersonEventDetector = require('./lib/person-event-detector');
const functions = require('firebase-functions');

exports.postSpeechEvent = functions.region('asia-northeast1').https
  .onCall((data, context) => {
    console.log('postSpeechEvent: ', data);

    if (data.utterance) {
      return new DialogflowClient(data.sessionId).postText(data.utterance).then(output => {
        if (output) {
          return new DialogStore(data.sessionId).postOutputs([output]);
        } else {
          return Promise.resolve();
        }
      });
    } else {
      return Promise.resolve();
    }
  });

exports.onCreatePerson = functions.region('asia-northeast1').firestore
  .document('sessions/{sessionId}/persons/{personId}')
  .onCreate((snap, context) => {
    console.log('Created: sessionId: ', snap.ref.parent.parent.id);
    console.log('Created: id: ', snap.id);
    console.log('Created: data: ', snap.data());

    const sessionId = snap.ref.parent.parent.id;
    const store = new DialogStore(sessionId);

    return new PersonEventDetector(store).onPersonFound(snap).then(events => {
      if (events.length === 0) {
        return Promise.resolve();
      }

      console.log(`events: `, events);
      const dialogflow = new DialogflowClient(sessionId);
      return dialogflow.postEvents(events);
    }).then(outputs => {
      if (outputs) {
        return store.postOutputs(outputs);
      } else {
        return Promise.resolve();
      }
    });
  });

exports.onUpdatePerson = functions.region('asia-northeast1').firestore
  .document('sessions/{sessionId}/persons/{personId}')
  .onUpdate((change, context) => {
    const newValue = change.after.data();
    console.log('Updated: id: ', change.after.id);
    console.log('Updated: before: ', change.before.data());
    console.log('Updated: after: ', change.after.data());

    const sessionId = change.after.ref.parent.parent.id;
    const store = new DialogStore(sessionId);

    return new PersonEventDetector(store).onPersonUpdated(change).then(events => {
      if (events.length === 0) {
        return Promise.resolve();
      }

      console.log(`events: `, events);
      const dialogflow = new DialogflowClient(sessionId);
      return dialogflow.postEvents(events);
    }).then(outputs => {
      if (outputs) {
        return store.postOutputs(outputs);
      } else {
        return Promise.resolve();
      }
    });
  });

exports.onDeletePerson = functions.region('asia-northeast1').firestore
  .document('sessions/{sessionId}/persons/{personId}')
  .onDelete((snap, context) => {
    console.log('Deleted: id: ', snap.id);
    console.log('Deleted: data: ', snap.data());

    const sessionId = snap.ref.parent.parent.id;
    const store = new DialogStore(sessionId);

    return new PersonEventDetector(store).onPersonLost(snap).then(events => {
      if (events.length === 0) {
        return Promise.resolve();
      }

      console.log(`events: `, events);
      const dialogflow = new DialogflowClient(sessionId);
      return dialogflow.postEvents(events);
    }).then(outputs => {
      if (outputs) {
        return store.postOutputs(outputs);
      } else {
        return Promise.resolve();
      }
    });
  });

exports.onCreateBeverage = functions.region('asia-northeast1').firestore
  .document('sessions/{sessionId}/beverages/{beverageId}')
  .onCreate((snap, context) => {
    console.log('Created: sessionId: ', snap.ref.parent.parent.id);
    console.log('Created: id: ', snap.id);
    console.log('Created: data: ', snap.data());

    const sessionId = snap.ref.parent.parent.id;
    const store = new DialogStore(sessionId);
    const dialogflow = new DialogflowClient(sessionId);
    return dialogflow.postEvents(['beverage-prepared']).then(outputs => {
      if (outputs) {
        return store.postOutputs(outputs);
      } else {
        return Promise.resolve();
      }
    });
  });