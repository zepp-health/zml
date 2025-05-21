import { Buffer } from '../../buffer.js'; // Adjusted path
import { getTimestamp } from './util.js'; // For serializePayload

// Definitions for Message and Payload structures/classes
class Message {
  constructor({
    flag,
    version,
    type,
    port1,
    port2,
    appId,
    extra,
    payload,
  } = {}) {
    this.flag = flag;
    this.version = version;
    this.type = type;
    this.port1 = port1;
    this.port2 = port2;
    this.appId = appId;
    this.extra = extra;
    this.payload = payload; // This will be a Buffer or an instance of Payload
  }
}

class Payload {
  constructor({
    traceId,
    parentId,
    spanId,
    seqId,
    totalLength,
    payloadLength,
    payloadType,
    opCode,
    contentType,
    dataType,
    timestamp1,
    timestamp2,
    timestamp3,
    timestamp4,
    timestamp5,
    timestamp6,
    timestamp7,
    extra1,
    extra2,
    extra3,
    payload, // This will be a Buffer
  } = {}) {
    this.traceId = traceId;
    this.parentId = parentId;
    this.spanId = spanId;
    this.seqId = seqId;
    this.totalLength = totalLength;
    this.payloadLength = payloadLength;
    this.payloadType = payloadType;
    this.opCode = opCode;
    this.contentType = contentType;
    this.dataType = dataType;
    this.timestamp1 = timestamp1;
    this.timestamp2 = timestamp2;
    this.timestamp3 = timestamp3;
    this.timestamp4 = timestamp4;
    this.timestamp5 = timestamp5;
    this.timestamp6 = timestamp6;
    this.timestamp7 = timestamp7;
    this.extra1 = extra1;
    this.extra2 = extra2;
    this.extra3 = extra3;
    this.payload = payload;
  }
}

// Implementation of serialization/deserialization functions

/**
 * Serializes a Message object into a Buffer.
 * Based on the original `buildBin` method.
 * @param {Message} messageObj - The Message object to serialize.
 * @returns {Buffer} The serialized message.
 */
function serializeMessage(messageObj) {
  if (!messageObj || !messageObj.payload || !Buffer.isBuffer(messageObj.payload)) {
    throw new Error('serializeMessage: messageObj and messageObj.payload (Buffer) are required.');
  }

  // MESSAGE_HEADER is 16 bytes
  const size = MESSAGE_HEADER + messageObj.payload.byteLength;
  let buf = Buffer.alloc(size);
  let offset = 0;

  buf.writeUInt8(messageObj.flag, offset);
  offset += 1;

  buf.writeUInt8(messageObj.version, offset);
  offset += 1;

  buf.writeUInt16LE(messageObj.type, offset);
  offset += 2;

  buf.writeUInt16LE(messageObj.port1, offset);
  offset += 2;

  buf.writeUInt16LE(messageObj.port2, offset);
  offset += 2;

  buf.writeUInt32LE(messageObj.appId, offset);
  offset += 4;

  buf.writeUInt32LE(messageObj.extra, offset);
  offset += 4;

  // Original buildBin used fill: buf.fill(data.payload, offset, data.payload.byteLength + offset)
  // Using copy is generally safer if messageObj.payload is a slice from a larger buffer.
  messageObj.payload.copy(buf, offset);

  return buf;
}

/**
 * Deserializes a Buffer into a Message object.
 * Based on the original `readBin` method.
 * @param {ArrayBuffer | Buffer} arrayBuf - The buffer to deserialize.
 * @returns {Message} The deserialized Message object.
 */
function deserializeMessage(arrayBuf) {
  const buf = Buffer.isBuffer(arrayBuf) ? arrayBuf : Buffer.from(arrayBuf);
  let offset = 0;

  const flag = buf.readUInt8(offset);
  offset += 1;

  const version = buf.readUInt8(offset);
  offset += 1;

  const type = buf.readUInt16LE(offset);
  offset += 2;

  const port1 = buf.readUInt16LE(offset);
  offset += 2;

  const port2 = buf.readUInt16LE(offset);
  offset += 2;

  const appId = buf.readUInt32LE(offset);
  offset += 4;

  const extra = buf.readUInt32LE(offset);
  offset += 4;

  const payload = buf.subarray(offset);

  return new Message({
    flag,
    version,
    type,
    port1,
    port2,
    appId,
    extra,
    payload,
  });
}

/**
 * Serializes a Payload object into a Buffer.
 * Based on the original `buildPayload` method.
 * @param {Payload} payloadObj - The Payload object to serialize.
 * @returns {Buffer} The serialized payload.
 */
function serializePayload(payloadObj) {
  if (!payloadObj || !payloadObj.payload || !Buffer.isBuffer(payloadObj.payload)) {
    throw new Error('serializePayload: payloadObj and payloadObj.payload (Buffer) are required.');
  }
  // HM_MESSAGE_PROTO_HEADER is 66 bytes
  const size = HM_MESSAGE_PROTO_HEADER + payloadObj.payload.byteLength;
  let buf = Buffer.alloc(size);
  let offset = 0;

  // Header
  buf.writeUInt32LE(payloadObj.traceId || 0, offset); // Ensure default for safety
  offset += 4;

  buf.writeUInt32LE(payloadObj.parentId || 0, offset); // parentId in original was always 0
  offset += 4;

  buf.writeUInt32LE(payloadObj.spanId || 0, offset);
  offset += 4;

  buf.writeUInt32LE(payloadObj.seqId || 0, offset);
  offset += 4;

  buf.writeUInt32LE(payloadObj.totalLength || 0, offset);
  offset += 4;

  buf.writeUInt32LE(payloadObj.payloadLength || 0, offset); // This is current chunk's payload length
  offset += 4;

  buf.writeUInt8(payloadObj.payloadType || 0, offset);
  offset += 1;

  buf.writeUInt8(payloadObj.opCode || 0, offset);
  offset += 1;

  // Timestamps - original used this.now() for timestamp1, others 0
  buf.writeUInt32LE(payloadObj.timestamp1 || getTimestamp(), offset);
  offset += 4;
  buf.writeUInt32LE(payloadObj.timestamp2 || 0, offset);
  offset += 4;
  buf.writeUInt32LE(payloadObj.timestamp3 || 0, offset);
  offset += 4;
  buf.writeUInt32LE(payloadObj.timestamp4 || 0, offset);
  offset += 4;
  buf.writeUInt32LE(payloadObj.timestamp5 || 0, offset);
  offset += 4;
  buf.writeUInt32LE(payloadObj.timestamp6 || 0, offset);
  offset += 4;
  buf.writeUInt32LE(payloadObj.timestamp7 || 0, offset);
  offset += 4;

  buf.writeUInt8(payloadObj.contentType || 0, offset);
  offset += 1;

  buf.writeUInt8(payloadObj.dataType || 0, offset);
  offset += 1;

  buf.writeUInt16LE(payloadObj.extra1 || 0, offset); // Original was 0
  offset += 2;

  buf.writeUInt32LE(payloadObj.extra2 || 0, offset); // Original was 0
  offset += 4;

  buf.writeUInt32LE(payloadObj.extra3 || 0, offset); // Original was 0, not present in readPayload, but in buildPayload
  offset += 4;
  
  // Payload data
  payloadObj.payload.copy(buf, offset);

  return buf;
}

/**
 * Deserializes a Buffer into a Payload object.
 * Based on the original `readPayload` method.
 * @param {ArrayBuffer | Buffer} arrayBuf - The buffer to deserialize.
 * @returns {Payload} The deserialized Payload object.
 */
function deserializePayload(arrayBuf) {
  const buf = Buffer.isBuffer(arrayBuf) ? arrayBuf : Buffer.from(arrayBuf);
  let offset = 0;

  const traceId = buf.readUInt32LE(offset);
  offset += 4;

  const parentId = buf.readUInt32LE(offset);
  offset += 4;

  const spanId = buf.readUInt32LE(offset);
  offset += 4;

  const seqId = buf.readUInt32LE(offset);
  offset += 4;

  const totalLength = buf.readUInt32LE(offset);
  offset += 4;

  const payloadLength = buf.readUInt32LE(offset);
  offset += 4;

  const payloadType = buf.readUInt8(offset);
  offset += 1;

  const opCode = buf.readUInt8(offset);
  offset += 1;

  const timestamp1 = buf.readUInt32LE(offset);
  offset += 4;
  const timestamp2 = buf.readUInt32LE(offset);
  offset += 4;
  const timestamp3 = buf.readUInt32LE(offset);
  offset += 4;
  const timestamp4 = buf.readUInt32LE(offset);
  offset += 4;
  const timestamp5 = buf.readUInt32LE(offset);
  offset += 4;
  const timestamp6 = buf.readUInt32LE(offset);
  offset += 4;
  const timestamp7 = buf.readUInt32LE(offset);
  offset += 4;

  const contentType = buf.readUInt8(offset);
  offset += 1;

  const dataType = buf.readUInt8(offset);
  offset += 1;

  const extra1 = buf.readUInt16LE(offset); // extra1 in readPayload
  offset += 2;

  const extra2 = buf.readUInt32LE(offset); // extra2 in readPayload (was extra1 in buildPayload)
  offset += 4;
  
  const extra3 = buf.readUInt32LE(offset); // extra3 in readPayload (was extra2 in buildPayload)
  offset += 4;

  const payload = buf.subarray(offset);

  return new Payload({
    traceId,
    parentId,
    spanId,
    seqId,
    totalLength,
    payloadLength,
    payloadType,
    opCode,
    contentType,
    dataType,
    timestamp1,
    timestamp2,
    timestamp3,
    timestamp4,
    timestamp5,
    timestamp6,
    timestamp7,
    extra1,
    extra2,
    extra3,
    payload,
  });
}

// Relevant constants
const MESSAGE_SIZE = 3600; // From original message.js
const MESSAGE_HEADER = 16;
const MESSAGE_PAYLOAD = MESSAGE_SIZE - MESSAGE_HEADER;
const HM_MESSAGE_PROTO_HEADER = 66;
const HM_MESSAGE_PROTO_PAYLOAD =
  MESSAGE_PAYLOAD - HM_MESSAGE_PROTO_HEADER;

const MessageFlag = {
  Runtime: 0x0,
  App: 0x1,
};

const MessageType = {
  Shake: 0x1,
  Close: 0x2,
  Heart: 0x3,
  Data: 0x4,
  DataWithSystemTool: 0x5,
  Log: 0x6,
};

const MessageVersion = {
  Version1: 0x1,
};

const MessagePayloadType = {
  Request: 0x1,
  Response: 0x2,
  Notify: 0x3,
};

const DataType = {
  empty: 'empty',
  json: 'json',
  text: 'text',
  bin: 'bin',
};

const MessagePayloadDataTypeOp = {
  EMPTY: 0x0,
  TEXT: 0x1,
  JSON: 0x2,
  BIN: 0x3,
};

const MessagePayloadOpCode = {
  Continued: 0x0,
  Finished: 0x1,
};

export {
  Message,
  Payload,
  serializeMessage,
  deserializeMessage,
  serializePayload,
  deserializePayload,
  MESSAGE_SIZE,
  MESSAGE_HEADER,
  MESSAGE_PAYLOAD,
  HM_MESSAGE_PROTO_HEADER,
  HM_MESSAGE_PROTO_PAYLOAD,
  MessageFlag,
  MessageType,
  MessageVersion,
  MessagePayloadType,
  DataType,
  MessagePayloadDataTypeOp,
  MessagePayloadOpCode,
};
