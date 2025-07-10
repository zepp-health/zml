// request.js
import { Deferred } from '../defer.js';
import {
  MessagePayloadType,
  MessagePayloadDataTypeOp,
  DataType,
  // Payload class might be used for type hinting if responsePayload is an instance
} from './core.js';
// buf2json, json2buf, str2buf, buf2str are now available from util.js
// However, request.js uses them directly from data.js in the original code, let's keep that for now
// unless the goal is to strictly channel everything via util.js.
// For this step, I will assume direct import from util.js is preferred for data conversions.
import { genTraceId, getDataType, buf2json, json2buf, str2buf, buf2str } from './util.js';
import { MessageError, MessageErrorCode } from './error.js';
import { isPlainObject } from '../utils.js';
import { Buffer } from '../buffer.js';
import { Logger } from '../logger.js';
import { isZeppOS } from '../platform.js';
import { setTimeout, clearTimeout } from '../setTimeout.js';

const logger = isZeppOS()
  ? Logger.getLogger('device-request-handler')
  : Logger.getLogger('side-request-handler');

const DEBUG = typeof __DEBUG__ !== 'undefined' ? __DEBUG__ : false;

class RequestHandler {
  constructor(messageBuilder) {
    if (!messageBuilder || typeof messageBuilder.sendPayload !== 'function') {
      throw new Error('RequestHandler: messageBuilder with sendPayload method is required.');
    }
    this.messageBuilder = messageBuilder;
    this._requests = new Map(); // Stores { deferred, timer }
    DEBUG && logger.log('RequestHandler initialized');
  }

  request(data, opts = {}) {
    const requestId = genTraceId();
    const deferred = new Deferred();

    let contentTypeOp;
    let payloadDataBuffer;

    if (typeof data === 'string') {
      contentTypeOp = MessagePayloadDataTypeOp.TEXT;
      payloadDataBuffer = str2buf(data);
    } else if (isPlainObject(data)) {
      contentTypeOp = MessagePayloadDataTypeOp.JSON;
      payloadDataBuffer = json2buf(data);
    } else if (Buffer.isBuffer(data)) {
      contentTypeOp = MessagePayloadDataTypeOp.BIN;
      payloadDataBuffer = data;
    } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
      contentTypeOp = MessagePayloadDataTypeOp.BIN;
      payloadDataBuffer = Buffer.from(data);
    } else if (data === undefined || data === null) {
      // Handle cases like call with no data, assuming it means an empty payload
      contentTypeOp = MessagePayloadDataTypeOp.EMPTY;
      payloadDataBuffer = Buffer.alloc(0); // Or handle as per specific protocol needs
    }
    else {
      deferred.reject(new MessageError(MessageErrorCode.INTERNAL_ERROR, 'Unsupported data type for request.'));
      return deferred.promise;
    }

    const timeout = opts.timeout || 60000; // Default timeout 60s
    // opts.dataType refers to the expected response data type (string like 'json', 'text', 'bin')
    // If not provided, it might default to the request's contentType or a predefined default.
    const responseDataTypeOp = opts.dataType ? getDataType(opts.dataType) : contentTypeOp;

    const timer = setTimeout(() => {
      if (this._requests.has(requestId)) {
        DEBUG && logger.warn(`Request ${requestId} timed out after ${timeout}ms`);
        const { deferred: reqDeferred } = this._requests.get(requestId);
        reqDeferred.reject(
          new MessageError(
            MessageErrorCode.REQUEST_TIMEOUT,
            `Request ${requestId} timed out in ${timeout}ms`,
          ),
        );
        this._requests.delete(requestId);
      }
    }, timeout);

    this._requests.set(requestId, { deferred, timer });
    
    DEBUG && logger.log(`Sending request ${requestId}, contentType: ${contentTypeOp}, responseDataType: ${responseDataTypeOp}`);

    try {
      // This is the presumed method on MessageBuilder.
      // It needs to handle the actual serialization of the payload header and then the data.
      this.messageBuilder.sendPayload({
        requestId, // This is the traceId for the payload
        payloadData: payloadDataBuffer, // The actual data to be wrapped
        payloadType: MessagePayloadType.Request,
        contentType: contentTypeOp, // Data type of the request payloadData
        responseDataType: responseDataTypeOp, // Expected data type of the response
        // Other options like specific messageType for transport could be passed via opts if necessary
      });
    } catch (e) {
      clearTimeout(timer);
      this._requests.delete(requestId);
      deferred.reject(e); // Propagate error from sendPayload
      return deferred.promise;
    }

    return deferred.promise.finally(() => {
      // Ensure cleanup is always attempted if promise resolves or rejects for any reason
      if (this._requests.has(requestId)) {
        const currentRequest = this._requests.get(requestId);
        clearTimeout(currentRequest.timer);
        this._requests.delete(requestId);
        DEBUG && logger.log(`Request ${requestId} finalized and removed from active requests.`);
      }
    });
  }

  onResponse(responsePayload) {
    // responsePayload is expected to be an instance of the Payload class from core.js
    const requestId = responsePayload.traceId;
    const requestEntry = this._requests.get(requestId);

    if (requestEntry) {
      clearTimeout(requestEntry.timer);
      DEBUG && logger.log(`Received response for request ${requestId}`);

      let resultData;
      const payloadBuffer = responsePayload.payload; // This is a Buffer

      switch (responsePayload.dataType) { // dataType here is MessagePayloadDataTypeOp
        case MessagePayloadDataTypeOp.JSON:
          try {
            resultData = buf2json(payloadBuffer);
          } catch (e) {
            requestEntry.deferred.reject(new MessageError(MessageErrorCode.INTERNAL_ERROR, `Failed to parse JSON response: ${e.message}`));
            this._requests.delete(requestId);
            return;
          }
          break;
        case MessagePayloadDataTypeOp.TEXT:
          resultData = buf2str(payloadBuffer);
          break;
        case MessagePayloadDataTypeOp.BIN:
          resultData = payloadBuffer; // Return as Buffer
          break;
        case MessagePayloadDataTypeOp.EMPTY:
          resultData = undefined; // Or null, depending on API contract
          break;
        default:
          logger.warn(`Unhandled response dataType ${responsePayload.dataType} for request ${requestId}. Returning raw buffer.`);
          resultData = payloadBuffer;
          break;
      }
      
      requestEntry.deferred.resolve(resultData);
      this._requests.delete(requestId); // Cleaned up by finally() too, but good to be explicit.
    } else {
      DEBUG && logger.warn(`Received response for unknown or timed out request ${requestId}. Ignoring.`);
    }
  }

  handleError(error) {
    DEBUG && logger.error(`Handling global error: ${error.message}. Rejecting all pending requests.`);
    for (const [requestId, requestEntry] of this._requests) {
      clearTimeout(requestEntry.timer);
      requestEntry.deferred.reject(error); // Reject with the provided error
      DEBUG && logger.log(`Request ${requestId} rejected due to global error.`);
    }
    this._requests.clear();
  }
}

export { RequestHandler };
