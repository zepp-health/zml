import { MessageBuilder } from './builder.js';
import { MessageError, MessageErrorCode } from './error.js';
import {
  Message,
  Payload,
  MessageType,
  DataType, // The enum-like object for string types
  MessagePayloadType,
  MessagePayloadDataTypeOp, // The enum-like object for op codes
  MessagePayloadOpCode,
  MessageFlag,
  MessageVersion,
  // Constants for sizes are generally for internal use by builder/core,
  // so not exporting them unless specifically needed by consumers.
  // MESSAGE_HEADER, MESSAGE_PAYLOAD, HM_MESSAGE_PROTO_PAYLOAD
} from './core.js';
import {
  genTraceId, // May be useful for advanced scenarios or testing
  genSpanId,  // May be useful for advanced scenarios or testing
  getTimestamp,
  getDataType, // The function to convert string to op code
  json2buf,
  buf2json,
  str2buf,
  buf2str,
  bin2hex,
} from './util.js';

// Primary export
export { MessageBuilder };

// Export errors
export { MessageError, MessageErrorCode };

// Export core enums, types, and classes
export {
  Message,
  Payload,
  MessageType,
  DataType,
  MessagePayloadType,
  MessagePayloadDataTypeOp,
  MessagePayloadOpCode,
  MessageFlag,
  MessageVersion,
};

// Export utility functions
export {
  genTraceId,
  genSpanId,
  getTimestamp,
  getDataType,
  json2buf,
  buf2json,
  str2buf,
  buf2str,
  bin2hex,
};

// It's also possible to re-export everything as a single block:
// export {
//   MessageBuilder,
//   MessageError, MessageErrorCode,
//   Message, Payload, MessageType, DataType, MessagePayloadType, MessagePayloadDataTypeOp, MessagePayloadOpCode, MessageFlag, MessageVersion,
//   genTraceId, genSpanId, getTimestamp, getDataType,
//   json2buf, buf2json, str2buf, buf2str, bin2hex,
// };
