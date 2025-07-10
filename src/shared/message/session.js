// session.js
import { EventBus } from '../event.js';
import { Buffer } from '../buffer.js';
import { MessagePayloadOpCode, Payload } from './core.js';
import { Logger } from '../logger.js';
import { isZeppOS } from '../platform.js';

const logger = isZeppOS()
  ? Logger.getLogger('device-session')
  : Logger.getLogger('side-session');

const DEBUG = typeof __DEBUG__ !== 'undefined' ? __DEBUG__ : false;

class Session extends EventBus {
  constructor(id, type, size, ctx) {
    super();
    this.id = id; // Typically traceId
    this.type = type; // payloadType (Request, Response, Notify)
    this.size = size; // Expected total size of data (totalLength from the first chunk of this session)
    this.ctx = ctx; // Context, e.g., the MessageBuilder instance

    this.chunks = [];
    this.count = -1; // Expected number of chunks, set when the 'Finished' chunk arrives
    this.finishChunk = null; // Stores the chunk with MessagePayloadOpCode.Finished
    this.receivedSize = 0; // Accumulated size of payloads received
  }

  addChunk(payloadInstance) {
    if (!(payloadInstance instanceof Payload)) {
      logger.error('Session.addChunk: payloadInstance is not an instance of Payload class.');
      this.emit('error', new Error('Invalid payload type provided to Session.addChunk.'));
      return;
    }

    // payloadInstance.payload is expected to be a Buffer
    // payloadInstance.payloadLength is the length of this specific chunk's data
    if (!payloadInstance.payload || typeof payloadInstance.payloadLength !== 'number') {
        logger.error('Session.addChunk: payloadInstance.payload or payloadInstance.payloadLength is invalid.');
        this.emit('error', new Error('Malformed payloadInstance in Session.addChunk.'));
        return;
    }
    
    this.receivedSize += payloadInstance.payloadLength;

    if (payloadInstance.opCode === MessagePayloadOpCode.Finished) {
      this.count = payloadInstance.seqId + 1;
      this.finishChunk = payloadInstance;
    }

    // Validate chunk payload length against the actual buffer length in the payload
    if (payloadInstance.payload.byteLength !== payloadInstance.payloadLength) {
      DEBUG &&
        logger.error(
          `Session ${this.id}-${this.type}: receive chunk data length error, expect ${payloadInstance.payloadLength} but got ${payloadInstance.payload.byteLength}`,
        );
      this.emit(
        'error',
        new Error(
          `Chunk data length error for session ${this.id}-${this.type}: expected ${payloadInstance.payloadLength}, got ${payloadInstance.payload.byteLength}`,
        ),
      );
      return;
    }

    this.chunks.push(payloadInstance);
    this.checkIfReceiveAllChunks();
  }

  checkIfReceiveAllChunks() {
    if (this.count === -1 || !this.finishChunk) {
      // Not all info is available yet (Finished chunk hasn't arrived)
      return;
    }

    if (this.count !== this.chunks.length) {
      // Still waiting for more chunks
      return;
    }

    if (this.size !== this.receivedSize) {
      // Total received size does not match expected total size from the first chunk's totalLength
      DEBUG &&
        logger.error(
          `Session ${this.id}-${this.type}: total received size mismatch. Expected ${this.size}, but got ${this.receivedSize}.`,
        );
      this.emit(
        'error',
        new Error(
          `Total received size mismatch for session ${this.id}-${this.type}. Expected ${this.size}, got ${this.receivedSize}.`,
        ),
      );
      this.releaseBuf(); // Clean up to prevent further issues
      return;
    }
    
    this.chunks.sort((a, b) => a.seqId - b.seqId);

    let concatenatedPayloadBuffer;
    try {
      const bufferList = [];
      for (let i = 0; i < this.count; i++) {
        const chunk = this.chunks[i];
        if (!chunk || chunk.seqId !== i) {
          logger.error(`Session ${this.id}-${this.type}: receive data error, chunk sequence broken at index ${i}.`);
          this.emit('error', new Error(`Data sequence error for session ${this.id}-${this.type}.`));
          this.releaseBuf();
          return;
        }
        bufferList.push(chunk.payload); // chunk.payload is already a Buffer
      }
      concatenatedPayloadBuffer = Buffer.concat(bufferList);
    } catch (e) {
      logger.error(`Session ${this.id}-${this.type}: Error concatenating chunks: ${e.message}`);
      this.emit('error', new Error(`Chunk concatenation error for session ${this.id}-${this.type}: ${e.message}`));
      this.releaseBuf();
      return;
    }


    // The finishChunk still holds metadata. We update its payload and payloadLength.
    // Or, create a new Payload object for the assembled data.
    // For now, let's update finishChunk as it seems to be the pattern from the original code.
    this.finishChunk.payload = concatenatedPayloadBuffer;
    this.finishChunk.payloadLength = concatenatedPayloadBuffer.byteLength;

    // Final validation: totalLength in the header of the (now assembled) finishChunk
    // should match the actual length of the assembled data.
    if (this.finishChunk.totalLength !== this.finishChunk.payloadLength) {
      DEBUG &&
        logger.error(
          `Session ${this.id}-${this.type}: receive full data length error, expect ${this.finishChunk.totalLength} but ${this.finishChunk.payloadLength}`,
        );
      this.emit(
        'error',
        new Error(
          `Full data length error for session ${this.id}-${this.type}: expected ${this.finishChunk.totalLength}, got ${this.finishChunk.payloadLength}`,
        ),
      );
      this.releaseBuf();
      return;
    }

    DEBUG && logger.log(`Session ${this.id}-${this.type}: All chunks received and assembled. Emitting data.`);
    this.emit('data', this.finishChunk); // Emit the modified finishChunk which now contains the full payload
    // Note: After emitting 'data', the session is usually destroyed by the manager.
    // If not, call this.releaseBuf() here or ensure the manager does.
  }

  releaseBuf() {
    DEBUG && logger.log(`Session ${this.id}-${this.type}: Releasing buffer and resetting state.`);
    this.chunks = [];
    this.finishChunk = null;
    this.count = -1;
    // this.size should remain as it was initially set, for potential re-use or logging,
    // but receivedSize should be reset.
    this.receivedSize = 0;
    // No need to reset id, type, ctx as they define the session itself.
  }
}

class SessionManager {
  constructor() {
    this.sessions = new Map();
    DEBUG && logger.log('SessionManager initialized.');
  }

  _getKey(id, type) {
    return `${id}:${type}`;
  }

  newSession(id, type, size, ctx) {
    const key = this._getKey(id, type);
    if (this.sessions.has(key)) {
      logger.warn(`SessionManager: Session with key ${key} already exists. Overwriting.`);
      // Potentially destroy existing session first
      // this.destroy(this.sessions.get(key)); 
    }
    const newSession = new Session(id, type, size, ctx);
    this.sessions.set(key, newSession);
    DEBUG && logger.log(`SessionManager: New session created with key ${key}.`);
    return newSession;
  }

  destroy(sessionOrId, typeIfId) {
    let key;
    let sessionToDestroy;

    if (sessionOrId instanceof Session) {
      key = this._getKey(sessionOrId.id, sessionOrId.type);
      sessionToDestroy = sessionOrId;
    } else if (typeIfId !== undefined) {
      key = this._getKey(sessionOrId, typeIfId);
      sessionToDestroy = this.sessions.get(key);
    } else {
      logger.error("SessionManager.destroy: Invalid arguments. Provide a Session instance or (id, type).");
      return;
    }

    if (sessionToDestroy) {
      sessionToDestroy.releaseBuf();
      this.sessions.delete(key);
      DEBUG && logger.log(`SessionManager: Session ${key} destroyed.`);
    } else {
      logger.warn(`SessionManager: Attempted to destroy non-existent session with key ${key}.`);
    }
  }

  has(id, type) {
    const key = this._getKey(id, type);
    return this.sessions.has(key);
  }

  getById(id, type) {
    const key = this._getKey(id, type);
    return this.sessions.get(key);
  }

  clear() {
    DEBUG && logger.log('SessionManager: Clearing all sessions.');
    for (const session of this.sessions.values()) {
      session.releaseBuf();
    }
    this.sessions.clear();
  }
}

export { Session, SessionManager };
