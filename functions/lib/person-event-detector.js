const PERSON_FOUND = 'person-found';
const PERSON_FACING_START = 'person-facing-start';
const PERSON_FACING_END = 'person-facing-end';
const PERSON_ATTENTION_START = 'person-attention-start';
const PERSON_ATTENTION_END = 'person-attention-end';
const PERSON_SMILING_START = 'person-smiling-start';
const PERSON_SMILING_END = 'person-smiling-end';
const PERSON_LOST = 'person-lost';

module.exports = class PersonEventDetector {

  constructor(store) {
    this.store = store;
  }

  async onPersonFound(snap) {
    const events = [];

    const latest = await this.store.getPerson(snap.id)
    if (!latest) {
      console.log(`person already lost: `, snap.id);
      return events;
    }

    events.push(PERSON_FOUND);

    if (this._personFacing(snap.data()) && this._personFacing(latest)) {
      events.push(PERSON_FACING_START);
    }
    return events;
  }

  async onPersonUpdated(change) {
    const events = [];

    const latest = await this.store.getPerson(change.after.id)
    if (!latest) {
      console.log(`person already lost: `, change.after.id);

      if (this._personFacing(change.before.data()) && !this._personFacing(change.after.data())) {
        events.push(PERSON_FACING_END);
      }
      if (this._personAttention(change.before.data()) && !this._personAttention(change.after.data())) {
        events.push(PERSON_ATTENTION_END);
      }
      if (this._personSmiling(change.before.data()) && !this._personSmiling(change.after.data())) {
        events.push(PERSON_SMILING_END);
      }
      return events;
    }

    if (!this._personFacing(change.before.data()) && this._personFacing(change.after.data()) && this._personFacing(latest)) {
      events.push(PERSON_FACING_START);
    }

    if (this._personFacing(change.before.data()) && !this._personFacing(change.after.data()) && !this._personFacing(latest)) {
      events.push(PERSON_FACING_END);
    }

    if (!this._personAttention(change.before.data()) && this._personAttention(change.after.data()) && this._personAttention(latest)) {
      events.push(PERSON_ATTENTION_START);
    }

    if (this._personAttention(change.before.data()) && !this._personAttention(change.after.data()) && !this._personAttention(latest)) {
      events.push(PERSON_ATTENTION_END);
    }

    if (!this._personSmiling(change.before.data()) && this._personSmiling(change.after.data())/* && this._personSmiling(latest)*/) {
      events.push(PERSON_SMILING_START)
    }

    if (this._personSmiling(change.before.data()) && !this._personSmiling(change.after.data())/* && !this._personSmiling(latest)*/) {
      events.push(PERSON_SMILING_END)
    }

    return events;
  }

  _personFacing(person) {
    return person.facePosition === 'frontal' && person.faceDistance === 'near';
  }

  _personAttention(person) {
    return person.faceDirection === 'frontal';
  }

  _personSmiling(person) {
    return person.smiling;
  }

  async onPersonLost(snap) {
    const events = [];

    if (this._personFacing(snap.data())) {
      events.push(PERSON_FACING_END);
    }

    events.push(PERSON_LOST);
    return events;
  }
}