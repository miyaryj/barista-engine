const outputMap = require('./output-map');
const directEventMap = require('./direct-event-map');
const dialogflow = require('dialogflow');

const projectId = 'barista-agent';
const languageCode = 'ja-JP';

module.exports = class DialogflowClient {

  constructor(sessionId) {
    // Create a new session
    this.sessionClient = new dialogflow.SessionsClient();
    this.sessionId = sessionId ? sessionId : 'default';
    this.sessionPath = this.sessionClient.sessionPath(projectId, this.sessionId);
    console.log(`sessionPath: `, this.sessionPath);
  }

  async postText(text) {
    // The event query request.
    const request = {
      session: this.sessionPath,
      queryInput: {
        text: {
          text: text,
          languageCode: languageCode
        }
      }
    };

    // Send request and log result
    const responses = await this.sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    console.log(`Detect intent: `, result);

    if (result.intent) {
      return this._outputWithExt(result, 'high');
    } else {
      console.log(`No valid output`);
      return null;
    }
  }

  async postEvents(events) {
    return Promise.all(events.map(e => this.postEvent(e)));
  }

  async postEvent(eventName) {
    // Dialogflowを経由しない応答
    if (Object.keys(directEventMap).indexOf(eventName) >= 0) {
      return this._postEventDirect(eventName);
    }

    // The event query request.
    const request = {
      session: this.sessionPath,
      queryInput: {
        event: {
          name: eventName,
          languageCode: languageCode
        }
      }
    };

    // Send request and log result
    const responses = await this.sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    console.log(`Detect intent: `, result);

    if (result.intent && !result.intent.isFallback) {
      return this._outputWithExt(result);
    } else {
      console.log(`No valid output`);
      return null;
    }
  }

  _postEventDirect(eventName) {
    const result = directEventMap[eventName];
    if (result.intent && !result.intent.isFallback) {
      return this._outputWithExt(result);
    } else {
      console.log(`No valid output`);
      return null;
    }
  }

  _outputWithExt(dialogflowResult, priority) {
    const outputExt = outputMap[dialogflowResult.intent.displayName];
    if (outputExt) {
      return {
        intent: dialogflowResult.intent.displayName,
        text: dialogflowResult.fulfillmentText,
        motionIndex: outputExt.motionIndex !== undefined ? outputExt.motionIndex : null,
        expressionIndex: outputExt.expressionIndex !== undefined ? outputExt.expressionIndex : null,
        priority: priority ? priority : outputExt.priority ? outputExt.priority : 'low'
      };
    } else {
      return {
        intent: dialogflowResult.intent.displayName,
        text: dialogflowResult.fulfillmentText,
        priority: priority ? priority : 'low'
      };
    }
  }
}