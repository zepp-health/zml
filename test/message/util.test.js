// test/message/util.test.js
import {
  genTraceId,
  genSpanId,
  getTimestamp,
  getDataType,
  json2buf,
  buf2json,
  str2buf,
  buf2str,
  bin2hex,
} from '../../src/shared/message/util.js';
import {
  MessagePayloadDataTypeOp,
  DataType
} from '../../src/shared/message/core.js';
import { Buffer } from '../../src/shared/buffer.js';

// --- Basic Assertion Helpers (copied from core.test.js for now) ---
const testResults_util = []; // Separate results array
function _log_util(message, isError = false) {
  if (isError) console.error(message); else console.log(message);
}

function assertEquals_util(actual, expected, message) {
  if (actual !== expected) {
    _log_util(`FAIL: ${message}. Expected "${expected}", but got "${actual}"`, true);
    testResults_util.push({ name: message, passed: false, actual, expected });
    throw new Error(`Assertion failed: ${message}. Expected "${expected}", but got "${actual}"`);
  }
  _log_util(`PASS: ${message}`);
  testResults_util.push({ name: message, passed: true });
}

function assertDeepEquals_util(actual, expected, message) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    _log_util(`FAIL: ${message}. Expected ${expectedJson}, but got ${actualJson}`, true);
    testResults_util.push({ name: message, passed: false, actual: actualJson, expected: expectedJson });
    throw new Error(`Assertion failed: ${message}. Expected ${expectedJson}, but got ${actualJson}`);
  }
  _log_util(`PASS: ${message}`);
  testResults_util.push({ name: message, passed: true });
}

function assertArrayEquals_util(actual, expected, message) {
    if (!actual || !expected || actual.length !== expected.length) {
    _log_util(`FAIL: ${message}. Length mismatch. Expected length ${expected ? expected.length : 'N/A'}, got ${actual ? actual.length : 'N/A'}`, true);
    testResults_util.push({ name: message, passed: false, actual: `length ${actual ? actual.length : 'N/A'}`, expected: `length ${expected ? expected.length : 'N/A'}` });
    throw new Error(`Assertion failed: ${message}. Length mismatch.`);
  }
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) {
      _log_util(`FAIL: ${message}. Element at index ${i} mismatch. Expected ${expected[i]}, got ${actual[i]}`, true);
      testResults_util.push({ name: message, passed: false, actual: `element ${i}: ${actual[i]}`, expected: `element ${i}: ${expected[i]}` });
      throw new Error(`Assertion failed: ${message}. Element at index ${i} mismatch.`);
    }
  }
  _log_util(`PASS: ${message}`);
  testResults_util.push({ name: message, passed: true });
}


// --- Test Suites ---

function runIdGeneratorTests() {
  _log_util("--- Running ID Generator Tests ---");
  const id1 = genTraceId();
  const id2 = genTraceId();
  assertEquals_util(id2 > id1, true, "genTraceId should return incrementing IDs");

  const span1 = genSpanId();
  const span2 = genSpanId();
  assertEquals_util(span2 > span1, true, "genSpanId should return incrementing IDs");
  assertEquals_util(typeof id1, 'number', "genTraceId returns a number");
  assertEquals_util(typeof span1, 'number', "genSpanId returns a number");
  _log_util("ID Generator Tests Completed.");
}

function runGetTimestampTests() {
  _log_util("--- Running getTimestamp Tests ---");
  const ts = getTimestamp();
  assertEquals_util(typeof ts, 'number', "getTimestamp returns a number");
  // Test modulo logic (hard to test precisely without mocking Date.now, but check general behavior)
  const dateNow = Date.now();
  assertEquals_util(getTimestamp(dateNow), dateNow % 10000000, "getTimestamp applies modulo correctly");
  _log_util("getTimestamp Tests Completed.");
}

function runGetDataTypeTests() {
  _log_util("--- Running getDataType Tests ---");
  assertEquals_util(getDataType('json'), MessagePayloadDataTypeOp.JSON, "getDataType('json')");
  assertEquals_util(getDataType('text'), MessagePayloadDataTypeOp.TEXT, "getDataType('text')");
  assertEquals_util(getDataType('bin'), MessagePayloadDataTypeOp.BIN, "getDataType('bin')");
  assertEquals_util(getDataType('empty'), MessagePayloadDataTypeOp.EMPTY, "getDataType('empty')");
  assertEquals_util(getDataType('JSON'), MessagePayloadDataTypeOp.JSON, "getDataType('JSON') (uppercase)");
  assertEquals_util(getDataType('TeXt'), MessagePayloadDataTypeOp.TEXT, "getDataType('TeXt') (mixed case)");
  assertEquals_util(getDataType('unknown'), MessagePayloadDataTypeOp.BIN, "getDataType('unknown') defaults to BIN");
  assertEquals_util(getDataType(undefined), MessagePayloadDataTypeOp.BIN, "getDataType(undefined) defaults to BIN");
  assertEquals_util(getDataType(null), MessagePayloadDataTypeOp.BIN, "getDataType(null) defaults to BIN");
  assertEquals_util(getDataType(123), MessagePayloadDataTypeOp.BIN, "getDataType(number) defaults to BIN");
  _log_util("getDataType Tests Completed.");
}

function runDataConversionTests() {
  _log_util("--- Running Data Conversion Tests ---");

  // json2buf and buf2json
  const jsonObj = { name: "ZeppOS", version: 3.0, features: ["BT", "App"] };
  let jsonBuffer;
  try {
    jsonBuffer = json2buf(jsonObj);
    _log_util("json2buf executed.");
  } catch (e) {
    _log_util(`FAIL: json2buf test. Error: ${e.message}`, true);
    testResults_util.push({ name: "json2buf test", passed: false, reason: e.message });
    return;
  }
  
  let parsedJson;
  try {
    parsedJson = buf2json(jsonBuffer);
    _log_util("buf2json executed.");
  } catch (e) {
    _log_util(`FAIL: buf2json test. Error: ${e.message}`, true);
    testResults_util.push({ name: "buf2json test", passed: false, reason: e.message });
    return;
  }
  assertDeepEquals_util(parsedJson, jsonObj, "JSON to Buffer and back to JSON");

  // str2buf and buf2str
  const testString = "Hello, 世界!";
  let strBuffer;
  try {
    strBuffer = str2buf(testString);
     _log_util("str2buf executed.");
  } catch (e) {
    _log_util(`FAIL: str2buf test. Error: ${e.message}`, true);
    testResults_util.push({ name: "str2buf test", passed: false, reason: e.message });
    return;
  }

  let parsedStr;
  try {
    parsedStr = buf2str(strBuffer);
    _log_util("buf2str executed.");
  } catch (e) {
    _log_util(`FAIL: buf2str test. Error: ${e.message}`, true);
    testResults_util.push({ name: "buf2str test", passed: false, reason: e.message });
    return;
  }
  assertEquals_util(parsedStr, testString, "String to Buffer and back to String");

  // bin2hex
  const binData = Buffer.from([0xDE, 0xAD, 0xBE, 0xEF]);
  const hexExpected = "deadbeef";
  let hexActual;
  try {
    hexActual = bin2hex(binData);
    _log_util("bin2hex executed.");
  } catch (e) {
     _log_util(`FAIL: bin2hex test. Error: ${e.message}`, true);
    testResults_util.push({ name: "bin2hex test", passed: false, reason: e.message });
    return;
  }
  assertEquals_util(hexActual, hexExpected, "Buffer to Hex String");
  
  const emptyBuf = Buffer.alloc(0);
  assertEquals_util(bin2hex(emptyBuf), "", "bin2hex with empty buffer");

  _log_util("Data Conversion Tests Completed.");
}


function runAllUtilTests() {
  runIdGeneratorTests();
  _log_util("\n");
  runGetTimestampTests();
  _log_util("\n");
  runGetDataTypeTests();
  _log_util("\n");
  runDataConversionTests();
  _log_util("\n--- All util.test.js tests completed ---");
  _log_util(`Summary: ${testResults_util.filter(r => r.passed).length} passed, ${testResults_util.filter(r => !r.passed).length} failed.`);

  if (testResults_util.some(r => !r.passed)) {
    console.error("UTIL TESTS FAILED. See details above.");
  }
}

runAllUtilTests();

export { runAllUtilTests, testResults_util as utilTestResults };
