// transport.js
import { EventBus } from '../event.js';
import { Logger } from '../logger.js';
import { isZeppOS } from '../platform.js';
// Assuming Message class might be used for constructing messages before serialization
// and deserializeMessage will return an object usable as a Message.
import { serializeMessage, deserializeMessage, Message } from './core.js';
import { bin2hex } from '../data.js'; // For logging raw data

const logger = isZeppOS()
  ? Logger.getLogger('device-transport')
  : Logger.getLogger('side-transport');

const DEBUG = typeof __DEBUG__ !== 'undefined' ? __DEBUG__ : false; // Define __DEBUG__ if not present

class Transport extends EventBus {
  constructor() {
    super();
    if (new.target === Transport) {
      throw new TypeError("Cannot construct Transport instances directly");
    }
    this.messageConfig = {}; // To store appPort, etc.
  }

  connect(cb) {
    throw new Error("Method 'connect()' must be implemented.");
  }

  disconnect(cb) {
    throw new Error("Method 'disconnect()' must be implemented.");
  }

  /**
   * Sends data over the transport.
   * @param {Message | object} message - The message object to send.
   * This can be a Message instance or a plain object that serializeMessage can handle.
   */
  send(message) {
    throw new Error("Method 'send(message)' must be implemented.");
  }

  // onReceive will be handled by emitting a 'data' event with the deserialized message
  // and a 'raw_data' event with the raw data buffer.
}

class BleTransport extends Transport {
  constructor(ble, messageConfig = {}) {
    super();
    this.ble = ble;
    this.messageConfig = messageConfig; // e.g., { appDevicePort, appSidePort, appId }
                                      // These might be used by serializeMessage or for logging
    if (!this.ble) {
      throw new Error("BleTransport: BLE object is required.");
    }
  }

  connect(cb) {
    DEBUG && logger.log("BleTransport: connecting...");
    this.ble.createConnect((index, data, size) => {
      DEBUG && logger.log(
        `[RAW] [R] BleTransport: received index=>${index} size=>${size} bin=>${bin2hex(data)}`
      );
      this.emit('raw_data', data); // Emit raw data

      try {
        const message = deserializeMessage(data); // deserializeMessage should handle ArrayBuffer
        if (message) {
          this.emit('data', message);
        } else {
          logger.error("BleTransport: deserializeMessage returned null or undefined");
        }
      } catch (e) {
        logger.error("BleTransport: Error deserializing message", e);
      }
    });

    // Assuming createConnect is synchronous or handles its own connection state reporting.
    // If BleTransport needs to manage connection state, more logic is needed here.
    if (cb) cb();
    this.emit('connect');
    DEBUG && logger.log("BleTransport: connected.");
  }

  disconnect(cb) {
    DEBUG && logger.log("BleTransport: disconnecting...");
    this.ble.disConnect();
    // Assuming disConnect is synchronous.
    if (cb) cb();
    this.emit('disconnect');
    DEBUG && logger.log("BleTransport: disconnected.");
  }

  send(message) {
    // message should be an object that serializeMessage can handle
    // or a Message instance.
    // serializeMessage is expected to return a Buffer.
    const bufferToSend = serializeMessage(message);

    if (!bufferToSend) {
        logger.error("BleTransport: serializeMessage returned null or undefined, cannot send.");
        return false;
    }

    DEBUG && logger.log(
        `[RAW] [S] BleTransport: sending size=${bufferToSend.byteLength} bin=${bin2hex(bufferToSend)}`
    );
    const result = this.ble.send(bufferToSend.buffer, bufferToSend.byteLength); // Assuming ble.send expects ArrayBuffer and length

    if (!result) {
      logger.error('BleTransport: send message error');
      // Optionally throw an error or emit an error event
      this.emit('error', new Error('BleTransport: send message error'));
    }
    return result;
  }
}

class SideTransport extends Transport {
  constructor(messaging, messageConfig = {}) {
    super();
    this.messaging = messaging; // This should be the peerSocket object or similar
    this.messageConfig = messageConfig;

    if (!this.messaging || !this.messaging.addListener || !this.messaging.send) {
        throw new Error("SideTransport: messaging object with addListener and send methods is required.");
    }

    this._onMessage = this._onMessage.bind(this); // Bind for listener
  }

  _onMessage(messageBuffer) {
    DEBUG && logger.log(
        `[RAW] [R] SideTransport: received size=>${messageBuffer.byteLength} bin=>${bin2hex(messageBuffer)}`
    );
    this.emit('raw_data', messageBuffer);

    try {
      const message = deserializeMessage(messageBuffer); // deserializeMessage should handle ArrayBuffer
      if (message) {
        this.emit('data', message);
      } else {
        logger.error("SideTransport: deserializeMessage returned null or undefined");
      }
    } catch (e) {
      logger.error("SideTransport: Error deserializing message", e);
    }
  }

  connect(cb) {
    DEBUG && logger.log("SideTransport: connecting (adding message listener)...");
    this.messaging.addListener('message', this._onMessage);
    // Connection is typically implicit with peerSocket listeners
    if (cb) cb();
    this.emit('connect');
    DEBUG && logger.log("SideTransport: connected (message listener added).");
  }

  disconnect(cb) {
    DEBUG && logger.log("SideTransport: disconnecting (removing message listener)...");
    // Attempt to remove listener if removeListener is supported, otherwise it's a no-op
    if (typeof this.messaging.removeListener === 'function') {
        this.messaging.removeListener('message', this._onMessage);
        DEBUG && logger.log("SideTransport: message listener removed.");
    } else {
        DEBUG && logger.log("SideTransport: removeListener not available on messaging object.");
    }
    
    if (cb) cb();
    this.emit('disconnect');
    DEBUG && logger.log("SideTransport: disconnected.");
  }

  send(message) {
    // message should be an object that serializeMessage can handle
    // or a Message instance.
    // serializeMessage is expected to return a Buffer.
    const bufferToSend = serializeMessage(message);

    if (!bufferToSend) {
        logger.error("SideTransport: serializeMessage returned null or undefined, cannot send.");
        return false;
    }
    
    DEBUG && logger.log(
        `[RAW] [S] SideTransport: sending size=${bufferToSend.byteLength} bin=${bin2hex(bufferToSend)}`
    );
    // peerSocket.send typically expects an ArrayBuffer
    this.messaging.send(bufferToSend.buffer); 
    // Side transport send usually doesn't return a status, assuming success if no error thrown.
    return true; 
  }
}

export { Transport, BleTransport, SideTransport };
