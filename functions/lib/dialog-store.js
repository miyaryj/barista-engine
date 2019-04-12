const firebase = require('firebase-admin');
const functions = require('firebase-functions');

firebase.initializeApp(functions.config().firebase);

module.exports = class DialogStore {

  constructor(sessionId) {
    this.sessionId = sessionId
    this.db = firebase.firestore();
    this.db.sessions = this.db.collection('sessions');
    this.db.persons = this.db.sessions.doc(sessionId).collection('persons');
    this.db.outputs = this.db.sessions.doc(sessionId).collection('outputs')
  }

  async getPerson(id) {
    const doc = await this.db.persons.doc(id).get();
    if (doc.exists) {
      return doc.data();
    } else {
      return null;
    }
  }

  async postOutputs(outputs) {
    return Promise.all(outputs.filter(o => o).map(o => this.postOutput(o)));
  }

  async postOutput(output) {
    output.consumed = false;
    console.log(`output: `, output);
    const doc = await this.db.outputs.add(output);
    console.log(`Document written by ${doc.id}: `, output);
    return;
  }
}