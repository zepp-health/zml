// src/shared/message/util.js

import { MessagePayloadDataTypeOp, DataType } from './core.js';
import {
  json2buf as _json2buf,
  buf2json as _buf2json,
  str2buf as _str2buf,
  buf2str as _buf2str,
  bin2hex as _bin2hex
} from '../data.js';

let traceIdCounter = 10000;
/**
 * Generates a unique trace ID.
 * @returns {number}
 */
function genTraceId() {
  return traceIdCounter++;
}

let spanIdCounter = 1000;
/**
 * Generates a unique span ID.
 * @returns {number}
 */
function genSpanId() {
  return spanIdCounter++;
}

/**
 * Gets a timestamp, modulo 10,000,000.
 * @param {number} [t=Date.now()] - Optional timestamp input.
 * @returns {number}
 */
function getTimestamp(t = Date.now()) {
  return t % 10000000;
}

/**
 * Converts a string data type to its corresponding MessagePayloadDataTypeOp enum value.
 * @param {string} type - The string representation of the data type (e.g., 'json', 'text', 'bin').
 * @returns {MessagePayloadDataTypeOp}
 */
function getDataType(type) {
  if (typeof type !== 'string') {
    // Default to BIN if type is not a string or is undefined/null
    return MessagePayloadDataTypeOp.BIN;
  }
  switch (type.toLowerCase()) {
    case DataType.json:
      return MessagePayloadDataTypeOp.JSON;
    case DataType.text:
      return MessagePayloadDataTypeOp.TEXT;
    case DataType.bin:
      return MessagePayloadDataTypeOp.BIN;
    case DataType.empty:
      return MessagePayloadDataTypeOp.EMPTY;
    default:
      return MessagePayloadDataTypeOp.BIN;
  }
}

// Re-export data conversion functions
const json2buf = _json2buf;
const buf2json = _buf2json;
const str2buf = _str2buf;
const buf2str = _buf2str;
const bin2hex = _bin2hex;

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
