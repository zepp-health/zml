import { Logger } from '../../logger.js';
import { EventBus } from '../../event.js';
import { Deferred } from '../../defer.js';
import { nativeBle } from '../../ble.js'; // nativeBle might be passed to BleTransport
import { isZeppOS } from '../../platform.js';
import { setTimeout, clearTimeout } from '../../setTimeout.js'; // May be used for shakeTimer
import { Promise } from '../../promise.js'; // For waitingShakePromise
import { Buffer } from '../../buffer.js';
import { isPlainObject } from '../../utils.js';

import {
  Message,
  Payload,
  serializeMessage,
  deserializeMessage,
  serializePayload,
  deserializePayload,
  MessageFlag,
  MessageType,
  MessageVersion,
  MessagePayloadType,
  MessagePayloadDataTypeOp,
  MessagePayloadOpCode,
  MESSAGE_HEADER,
  MESSAGE_PAYLOAD, // Max payload size for a single message frame
  HM_MESSAGE_PROTO_HEADER, // Header size for the HmProto payload itself
  HM_MESSAGE_PROTO_PAYLOAD, // Max data size within an HmProto payload fragment
} from './core.js';
import { BleTransport, SideTransport } from './transport.js';
import { SessionManager } from './session.js';
import { RequestHandler } from './request.js';
import { MessageError, MessageErrorCode } from './error.js';
import {
  genTraceId,
  genSpanId,
  getTimestamp,
  getDataType, // This is the function from util.js
  json2buf, // Data conversion utilities
  buf2json,
  bin2hex,
  buf2str,
  str2buf,
} from './util.js';

const logger = isZeppOS()
  ? Logger.getLogger('device-message-builder')
  : Logger.getLogger('side-message-builder');

const DEBUG = typeof __DEBUG__ !== 'undefined' ? __DEBUG__ : false;

export const MessageShakeTimeOut = 5000;

export const ShakeStatus = {
  start: 1,
  pending: 2,
  success: 3,
  failure: 4,
};

export class MessageBuilder extends EventBus {
  constructor(
    {
      appId = 0,
      appDevicePort = 20,
      appSidePort = 0,
      ble = isZeppOS() ? nativeBle : undefined,
      messagingInstance = typeof messaging !== 'undefined' ? messaging : undefined, // Allow passing messaging for testing/flexibility
    } = {}
  ) {
    super();
    this.isDevice = isZeppOS();
    this.isSide = !this.isDevice;

    this.config = {
      appId,
      appDevicePort,
      appSidePort,
    };

    this.sessionMgr = new SessionManager();
    this.requestHandler = new RequestHandler(this); 

    if (this.isDevice) {
      if (!ble && typeof nativeBle !== 'undefined') {
        logger.warn('MessageBuilder: BLE handle not provided for BleTransport on device, using default nativeBle.');
        ble = nativeBle;
      } else if (!ble) {
        logger.warn('MessageBuilder: BLE handle not provided for BleTransport on device and no default nativeBle.');
      }
      this.transport = new BleTransport(ble, this.config);
    } else {
      const msgAPI = messagingInstance || (typeof Global !== 'undefined' ? Global.messaging : undefined);
      if (!msgAPI || !msgAPI.peerSocket) {
         logger.warn('MessageBuilder: peerSocket not available for SideTransport on side. Transport may not be functional.');
         this.transport = null; 
      } else {
        this.transport = new SideTransport(msgAPI.peerSocket, this.config);
      }
    }
    
    // Note: this.chunkSize (old) was MESSAGE_PAYLOAD. HM_MESSAGE_PROTO_PAYLOAD is for data within HmProto.
    // The transport layer worries about MTU if frames are larger than BLE MTU.
    // serializeMessage itself doesn't impose a limit from MESSAGE_PAYLOAD anymore.

    this.shakeTask = null;
    this.waitingShakePromise = null; // This will be a Promise instance
    this.shakeStatus = ShakeStatus.start;
    this.shakeTimer = 0;

    if (this.transport) {
      this.transport.on('data', (messageInstance) => { 
        this.onRawMessage(messageInstance);
      });
      this.transport.on('error', (error) => {
        logger.error('MessageBuilder: Transport error:', error.message, error.code);
        this.emit('error', new MessageError(error.code || MessageErrorCode.INTERNAL_ERROR, `Transport error: ${error.message}`));
        if (this.shakeTask && this.shakeStatus === ShakeStatus.pending) {
            this.shakeTask.reject(new MessageError(MessageErrorCode.BLE_CLOSE, `Transport error: ${error.message}`));
            this.shakeStatus = ShakeStatus.failure;
        }
        if (this.requestHandler) {
            this.requestHandler.handleError(new MessageError(MessageErrorCode.BLE_CLOSE, `Transport error: ${error.message}`));
        }
      });
      this.transport.on('disconnect', () => {
        logger.info('MessageBuilder: Transport disconnected.');
        this.config.appSidePort = 0; 
        if (this.shakeTask && this.shakeStatus === ShakeStatus.pending) {
            this.shakeTask.reject(new MessageError(MessageErrorCode.BLE_CLOSE, 'Transport disconnected during shake'));
            this.shakeStatus = ShakeStatus.failure;
        }
        if (this.requestHandler) {
            this.requestHandler.handleError(new MessageError(MessageErrorCode.BLE_CLOSE, 'Transport disconnected'));
        }
        this.emit('bleStatusChanged', false);
      });
      this.transport.on('connect', () => {
        DEBUG && logger.log('MessageBuilder: Transport connected.');
        this.emit('bleStatusChanged', true);
      });
    } else {
        logger.error("MessageBuilder: No transport initialized. Messaging will not work.");
    }
  }

  sendPayload({ requestId, payloadData, payloadType, contentType, responseDataType }) {
    DEBUG && logger.log(`MessageBuilder.sendPayload called by RequestHandler: traceId=${requestId}`);
    this.sendHmProtocol(
      {
        requestId: requestId, 
        dataBin: payloadData, 
        type: payloadType,    
        contentType: contentType, 
        dataType: responseDataType, 
      }
    );
  }

  fork(timeout = MessageShakeTimeOut) {
    if (this.shakeStatus === ShakeStatus.pending) {
      return this.waitingShakePromise;
    }
    if (this.shakeStatus === ShakeStatus.success && this.transport && this.transport.isConnected && this.transport.isConnected()) {
        return Promise.resolve();
    }
    
    this.shakeTask = new Deferred(); 
    this.waitingShakePromise = this.shakeTask.promise;
    this.shakeStatus = ShakeStatus.start;
    this.clearShakeTimer();

    if (!this.transport) {
        const errMsg = "MessageBuilder.fork: No transport available for shake.";
        logger.error(errMsg);
        this.shakeTask.reject(new MessageError(MessageErrorCode.INTERNAL_ERROR, errMsg));
        this.shakeStatus = ShakeStatus.failure;
        return this.waitingShakePromise;
    }
    
    // If transport is not connected, try to connect it first.
    if (this.transport && typeof this.transport.isConnected === 'function' && !this.transport.isConnected()) {
        DEBUG && logger.log("MessageBuilder.fork: Transport not connected, attempting to connect first.");
        this.transport.connect((err) => {
            if (err) {
                logger.error("MessageBuilder.fork: Transport connect failed.", err);
                this.shakeTask.reject(new MessageError(MessageErrorCode.BLE_CLOSE, "Fork: Transport connect failed"));
                this.shakeStatus = ShakeStatus.failure;
            } else {
                DEBUG && logger.log("MessageBuilder.fork: Transport connected, proceeding with shake.");
                this._initiateShakeProtocol(timeout);
            }
        });
    } else {
        // Already connected or doesn't support isConnected check, proceed.
        this._initiateShakeProtocol(timeout);
    }
    
    return this.waitingShakePromise;
  }

  _initiateShakeProtocol(timeout) {
    this.shakeTimer = setTimeout(() => {
      if (this.shakeStatus === ShakeStatus.pending) { 
        logger.warn('MessageBuilder: Shake timeout');
        this.shakeStatus = ShakeStatus.failure;
        this.shakeTask.reject(
          new MessageError(MessageErrorCode.SHAKE_TIME_OUT, 'Shake timeout'),
        );
      }
    }, timeout);
    
    logger.info('MessageBuilder: Initiating shake protocol...');
    this.shakeStatus = ShakeStatus.pending;
    this.sendShake();
  }

  clearShakeTimer() {
    if (this.shakeTimer) {
      clearTimeout(this.shakeTimer);
      this.shakeTimer = 0;
    }
  }

  connect(cb) {
    if (!this.transport) {
      const msg = 'MessageBuilder.connect: No transport available.';
      logger.error(msg);
      if (cb) cb(new MessageError(MessageErrorCode.INTERNAL_ERROR, msg));
      return;
    }
    this.transport.connect(cb);
  }

  disConnect(cb) {
    DEBUG && logger.info('MessageBuilder: disconnecting...');
    this.sendClose(); 
    
    if (this.transport) {
        this.transport.disconnect(cb);
    } else {
        logger.warn('MessageBuilder.disConnect: No transport to disconnect.');
        if (cb) cb();
    }
    this.shakeStatus = ShakeStatus.start; 
    this.waitingShakePromise = null; // Reset shake promise
  }

  listen(cb) {    
    if (this.isSide && typeof globalThis !== 'undefined' && typeof globalThis.getApp === 'function' && globalThis.getApp()) {
        this.config.appSidePort = globalThis.getApp().port2;
        DEBUG && logger.log(`MessageBuilder.listen: appSidePort set to ${this.config.appSidePort} for side service.`);
    } else if (this.isSide && !this.config.appSidePort) { // if appSidePort wasn't set by constructor
        logger.warn("MessageBuilder.listen: Could not determine appSidePort for side service.");
    }

    if (!this.transport) {
      const msg = 'MessageBuilder.listen: No transport available.';
      logger.error(msg);
      if (cb) cb(new MessageError(MessageErrorCode.INTERNAL_ERROR, msg));
      return;
    }

    this.transport.connect((err) => {
      if (err) {
        logger.error('MessageBuilder.listen: transport connection failed', err);
        if (cb) cb(err);
        return;
      }
      DEBUG && logger.log('MessageBuilder: transport listening via listen() method.');
      this.waitingShakePromise = Promise.resolve(); 
      this.shakeStatus = ShakeStatus.success; 
      if (cb) cb(this);
    });
  }

  buildShakeMessage() {
    return new Message({
      flag: MessageFlag.App,
      version: MessageVersion.Version1,
      type: MessageType.Shake,
      port1: this.config.appDevicePort,
      port2: this.config.appSidePort, 
      appId: this.config.appId,
      extra: 0,
      payload: Buffer.from([this.config.appId || 0]),
    });
  }

  sendShake() {
    logger.info('MessageBuilder: Sending Shake...');
    const shakeMessageInstance = this.buildShakeMessage();
    const serializedMessage = serializeMessage(shakeMessageInstance);
    if (this.transport) {
      this.transport.send(serializedMessage);
    } else {
      logger.error('MessageBuilder.sendShake: No transport available.');
      if (this.shakeTask && this.shakeStatus === ShakeStatus.pending) {
        this.shakeTask.reject(new MessageError(MessageErrorCode.INTERNAL_ERROR, "No transport for shake"));
        this.shakeStatus = ShakeStatus.failure;
      }
    }
  }

  buildCloseMessage() {
     return new Message({
      flag: MessageFlag.App,
      version: MessageVersion.Version1,
      type: MessageType.Close,
      port1: this.config.appDevicePort,
      port2: this.config.appSidePort,
      appId: this.config.appId,
      extra: 0,
      payload: Buffer.from([this.config.appId || 0]),
    });
  }

  sendClose() {
    DEBUG && logger.info('MessageBuilder: Sending Close...');
    const closeMessageInstance = this.buildCloseMessage();
    const serializedMessage = serializeMessage(closeMessageInstance);
     if (this.transport) {
      this.transport.send(serializedMessage);
    } else {
      logger.warn('MessageBuilder.sendClose: No transport available.');
    }
  }

  sendHmProtocol(
    { requestId, dataBin, type, contentType, dataType }, 
    { messageType = MessageType.Data } = {}
  ) {
    const hmDataChunkSize = HM_MESSAGE_PROTO_PAYLOAD; 
    const userDataLength = dataBin.byteLength;
    let offset = 0;
    
    const currentTraceId = requestId !== undefined ? requestId : genTraceId();
    const currentSpanId = genSpanId(); 
    let currentSeqId = 0; 

    const chunkCount = Math.ceil(userDataLength / hmDataChunkSize);
    if (chunkCount === 0 && userDataLength === 0) { // Handle empty data case
        // Send one empty payload if needed, or decide if this is an error
        const emptyPayloadInstance = new Payload({
            traceId: currentTraceId, parentId: 0, spanId: currentSpanId, seqId: currentSeqId,
            totalLength: 0, payloadLength: 0, payloadType: type,
            opCode: MessagePayloadOpCode.Finished, contentType: contentType, dataType: dataType,
            timestamp1: getTimestamp(), payload: Buffer.alloc(0),
        });
        this._sendPayloadFragment(emptyPayloadInstance, { messageType });
        return;
    }
    
    DEBUG && logger.log(`MessageBuilder.sendHmProtocol: traceId=${currentTraceId}, totalSize=${userDataLength}, chunks=${chunkCount}`);

    for (let i = 0; i < chunkCount; i++) {
      this._assertTransportReady(); 

      const isLastChunk = (i === chunkCount - 1);
      const chunkDataSize = isLastChunk ? (userDataLength - offset) : hmDataChunkSize;
      
      const chunkDataBuffer = Buffer.alloc(chunkDataSize);
      dataBin.copy(chunkDataBuffer, 0, offset, offset + chunkDataSize);
      offset += chunkDataSize;

      const payloadInstance = new Payload({
        traceId: currentTraceId, parentId: 0, spanId: currentSpanId, seqId: currentSeqId++,
        totalLength: userDataLength, payloadLength: chunkDataBuffer.byteLength, 
        payloadType: type, 
        opCode: isLastChunk ? MessagePayloadOpCode.Finished : MessagePayloadOpCode.Continued,
        contentType: contentType, dataType: dataType, 
        timestamp1: getTimestamp(), payload: chunkDataBuffer,
      });
      
      this._sendPayloadFragment(payloadInstance, { messageType });
    }

    if (offset !== userDataLength) {
      logger.error(`MessageBuilder.sendHmProtocol: Data sending incomplete. Sent ${offset}/${userDataLength} for traceId ${currentTraceId}`);
    }
  }

  _sendPayloadFragment(payloadInstance, { messageType = MessageType.Data } = {}) {
    const serializedPayload = serializePayload(payloadInstance); 
    const messageInstance = new Message({
      flag: MessageFlag.App, version: MessageVersion.Version1, type: messageType, 
      port1: this.config.appDevicePort, port2: this.config.appSidePort,
      appId: this.config.appId, extra: 0, payload: serializedPayload, 
    });
    const serializedMessage = serializeMessage(messageInstance); 

    if (this.transport) {
      try {
        DEBUG && logger.log(`MessageBuilder._sendPayloadFragment: Sending fragment for traceId=${payloadInstance.traceId}, seqId=${payloadInstance.seqId}`);
        this.transport.send(serializedMessage);
      } catch (e) {
        logger.error(`MessageBuilder._sendPayloadFragment: transport.send error: ${e.message}`, e);
        throw e; 
      }
    } else {
      const errMsg = 'MessageBuilder._sendPayloadFragment: No transport available.';
      logger.error(errMsg);
      throw new MessageError(MessageErrorCode.INTERNAL_ERROR, errMsg);
    }
  }
  
  onRawMessage(messageInstance) { 
    DEBUG && logger.log('MessageBuilder.onRawMessage: received Message object', JSON.stringify(messageInstance));

    if (!(messageInstance instanceof Message) && messageInstance.flag === undefined) { // Simple check if it's a raw buffer from transport not yet a Message obj
        // This case should ideally not happen if transport.on('data') provides deserialized Message objects.
        // If transport provides raw buffers, it should be on a 'raw_data' event or similar.
        logger.warn('MessageBuilder.onRawMessage: received data is not a Message instance. Attempting deserializeMessage.');
        try {
            messageInstance = deserializeMessage(messageInstance); // Assuming it's a buffer
        } catch (e) {
            logger.error('MessageBuilder.onRawMessage: Failed to deserialize raw buffer from transport.', e);
            return;
        }
    } else if (!(messageInstance instanceof Message)) {
        logger.error('MessageBuilder.onRawMessage: received data is not a Message instance after initial check. Ignoring.');
        return;
    }


    if (messageInstance.flag === MessageFlag.App) {
      switch (messageInstance.type) {
        case MessageType.Shake:
          this.config.appSidePort = messageInstance.port2; 
          logger.info(`MessageBuilder: Shake response received. AppSidePort set to ${messageInstance.port2}`);
          this.emit('shake:response', messageInstance); 
          if (this.shakeTask && this.shakeStatus === ShakeStatus.pending) {
            this.clearShakeTimer(); 
            this.shakeTask.resolve(messageInstance); 
            this.shakeStatus = ShakeStatus.success;
          }
          break;
        case MessageType.Data:
        case MessageType.DataWithSystemTool:
          try {
            const hmProtoPayload = deserializePayload(messageInstance.payload);
            this.onHmProtoPayload(hmProtoPayload); 
          } catch (e) {
            logger.error(`MessageBuilder.onRawMessage: Error deserializing HmProto payload: ${e.message}`, e);
            this.emit('error', new MessageError(MessageErrorCode.DESERIALIZATION_ERROR, e.message));
          }
          break;
        case MessageType.Close:
          this.config.appSidePort = 0; 
          logger.info('MessageBuilder: Close message received from peer.');
          this.emit('app:close', messageInstance);
          // Optionally, trigger a disconnect locally
          // this.disConnect();
          break;
        case MessageType.Log:
          this.emit('log', messageInstance.payload); 
          break;
        default:
          logger.warn(`MessageBuilder.onRawMessage: Unhandled App message type ${messageInstance.type}`);
          break;
      }
    } else if (messageInstance.flag === MessageFlag.Runtime) {
      DEBUG && logger.debug(`MessageBuilder.onRawMessage: Received Runtime message type ${messageInstance.type}`);
    } else {
      logger.warn(`MessageBuilder.onRawMessage: Unknown message flag ${messageInstance.flag}`);
    }
  }

  _assertTransportReady() {
    if (!this.transport) {
        throw new MessageError(MessageErrorCode.INTERNAL_ERROR, 'Transport not available');
    }
    if (typeof this.transport.isConnected === 'function' && !this.transport.isConnected()) {
        throw new MessageError(MessageErrorCode.NOT_CONNECTED, 'Transport not connected');
    }
    // Shake status check (especially for device sending to side)
    if (this.isDevice && this.config.appSidePort === 0 && this.shakeStatus !== ShakeStatus.success) {
        // Allow sending if shake is pending, as shake itself needs to send.
        if (this.shakeStatus !== ShakeStatus.pending) {
             logger.warn("MessageBuilder: Attempting to send data on device before shake success and appSidePort is known.");
            // throw new MessageError(MessageErrorCode.APP_CLOSE, 'Side service not available (shake incomplete)');
        }
    }
  }
  
  getRequestCount() {
    return this.requestHandler ? this.requestHandler._requests.size : 0; // Accessing private member for count, consider adding a method to RequestHandler
  }

  onHmProtoPayload(hmProtoPayloadInstance) { 
    DEBUG && logger.log('MessageBuilder.onHmProtoPayload: processing Payload', JSON.stringify(hmProtoPayloadInstance));

    if (!(hmProtoPayloadInstance instanceof Payload)) {
      logger.error('MessageBuilder.onHmProtoPayload: Data is not a Payload instance. Ignoring.');
      return;
    }
    
    let session = this.sessionMgr.getById(hmProtoPayloadInstance.traceId, hmProtoPayloadInstance.payloadType);

    if (!session) {
      if (hmProtoPayloadInstance.opCode === MessagePayloadOpCode.Continued && hmProtoPayloadInstance.seqId !== 0) {
          logger.warn(`MessageBuilder.onHmProtoPayload: Received continued chunk for non-existent session ${hmProtoPayloadInstance.traceId}. Discarding.`);
          return;
      }
      
      session = this.sessionMgr.newSession(
        hmProtoPayloadInstance.traceId, hmProtoPayloadInstance.payloadType,
        hmProtoPayloadInstance.totalLength, this 
      );

      session.on('data', (assembledPayload) => { 
        DEBUG && logger.log('MessageBuilder: SessionManager emitted assembled data for traceId:', assembledPayload.traceId);
        if (assembledPayload.opCode === MessagePayloadOpCode.Finished) {
          switch (assembledPayload.payloadType) {
            case MessagePayloadType.Request:
              this.emit('request', { 
                request: assembledPayload, 
                response: ({ data, dataType }) => { 
                  const responseContentTypeOp = typeof dataType === 'string' ? getDataType(dataType) : dataType;
                  this.response({ 
                      requestId: assembledPayload.traceId, data, contentType: responseContentTypeOp,
                  });
                },
              });
              break;
            case MessagePayloadType.Response:
              this.requestHandler.onResponse(assembledPayload);
              break;
            case MessagePayloadType.Notify:
              this.emit('call', assembledPayload); 
              break;
            default:
              logger.warn(`MessageBuilder: Unknown assembled payload type ${assembledPayload.payloadType}`);
              break;
          }
          this.emit('data', assembledPayload); 
          this.sessionMgr.destroy(session); 
        }
      });

      session.on('error', (error) => {
        logger.error(`MessageBuilder: Session error for traceId ${session.id}: ${error.message}`);
        this.sessionMgr.destroy(session);
        this.emit('error', error); 
      });
    }

    try {
      session.addChunk(hmProtoPayloadInstance); 
    } catch (e) {
        logger.error(`MessageBuilder.onHmProtoPayload: Error adding chunk to session ${session.id}: ${e.message}`);
        this.emit('error', e);
        this.sessionMgr.destroy(session); 
    }
  }

  request(data, opts = {}) {
    // Ensure shake is attempted or completed before sending a request.
    const ensureShake = () => {
        if (this.isDevice && this.shakeStatus !== ShakeStatus.success) { // Only force shake for device
            if (!this.waitingShakePromise || this.shakeStatus === ShakeStatus.start || this.shakeStatus === ShakeStatus.failure) {
                DEBUG && logger.log("MessageBuilder.request: Shake process not completed or started. Initiating fork.");
                return this.fork(); // Initiates shake
            }
            return this.waitingShakePromise; // Already pending
        }
        return Promise.resolve(); // Shake not required or already success
    };
    
    return ensureShake()
      .then(() => {
        this._assertTransportReady(); 
        return this.requestHandler.request(data, opts);
      })
      .catch(err => {
        logger.error(`MessageBuilder.request: Error: ${err.message}`, err);
        if (!(err instanceof MessageError)) {
            throw new MessageError(err.code || MessageErrorCode.INTERNAL_ERROR, err.message);
        }
        throw err;
      });
  }

  response({ requestId, contentType, data }) { 
    if (requestId === undefined) {
        logger.error("MessageBuilder.response: requestId is required.");
        throw new MessageError(MessageErrorCode.INTERNAL_ERROR, "Response: requestId is required.");
    }
    DEBUG && logger.log(`MessageBuilder.response: Sending response for requestId ${requestId}, contentType ${contentType}`);

    let dataBuffer;
    let actualContentType = contentType; 

    if (Buffer.isBuffer(data)) {
      dataBuffer = data;
      actualContentType = actualContentType === undefined ? MessagePayloadDataTypeOp.BIN : actualContentType;
    } else if (typeof data === 'string') {
      dataBuffer = str2buf(data);
      actualContentType = actualContentType === undefined ? MessagePayloadDataTypeOp.TEXT : actualContentType;
    } else if (isPlainObject(data)) {
      dataBuffer = json2buf(data);
      actualContentType = actualContentType === undefined ? MessagePayloadDataTypeOp.JSON : actualContentType;
    } else if (data === undefined || data === null) {
      dataBuffer = Buffer.alloc(0);
      actualContentType = actualContentType === undefined ? MessagePayloadDataTypeOp.EMPTY : actualContentType;
    } else {
      logger.error("MessageBuilder.response: Unsupported data type for response.");
      throw new MessageError(MessageErrorCode.INTERNAL_ERROR, "Unsupported data type for response.");
    }

    this.sendHmProtocol({
      requestId: requestId, dataBin: dataBuffer, type: MessagePayloadType.Response,
      contentType: actualContentType, 
      dataType: MessagePayloadDataTypeOp.EMPTY, 
    });
  }

  call(data) {
    let contentTypeOp;
    let payloadDataBuffer;

    if (typeof data === 'string') {
      contentTypeOp = MessagePayloadDataTypeOp.TEXT; payloadDataBuffer = str2buf(data);
    } else if (isPlainObject(data)) {
      contentTypeOp = MessagePayloadDataTypeOp.JSON; payloadDataBuffer = json2buf(data);
    } else if (Buffer.isBuffer(data)) {
      contentTypeOp = MessagePayloadDataTypeOp.BIN; payloadDataBuffer = data;
    } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
      contentTypeOp = MessagePayloadDataTypeOp.BIN; payloadDataBuffer = Buffer.from(data);
    } else if (data === undefined || data === null) {
      contentTypeOp = MessagePayloadDataTypeOp.EMPTY; payloadDataBuffer = Buffer.alloc(0);
    } else {
      const errMsg = "MessageBuilder.call: Unsupported data type for call.";
      logger.error(errMsg);
      return Promise.reject(new MessageError(MessageErrorCode.INTERNAL_ERROR, errMsg));
    }
    
    const ensureShake = () => {
        if (this.isDevice && this.shakeStatus !== ShakeStatus.success) { // Only force shake for device
             if (!this.waitingShakePromise || this.shakeStatus === ShakeStatus.start || this.shakeStatus === ShakeStatus.failure) {
                DEBUG && logger.log("MessageBuilder.call: Shake process not completed or started. Initiating fork.");
                return this.fork();
            }
            return this.waitingShakePromise;
        }
        return Promise.resolve();
    };

    return ensureShake().then(() => {
      this._assertTransportReady();
      this.sendHmProtocol({
        requestId: genTraceId(), dataBin: payloadDataBuffer, type: MessagePayloadType.Notify,
        contentType: contentTypeOp, dataType: MessagePayloadDataTypeOp.EMPTY, 
      });
    }).catch(err => {
        logger.error(`MessageBuilder.call: Error: ${err.message}`, err);
         if (!(err instanceof MessageError)) {
            throw new MessageError(err.code || MessageErrorCode.INTERNAL_ERROR, err.message);
        }
        throw err;
    });
  }
}
