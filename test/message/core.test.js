// test/message/core.test.js
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
  HM_MESSAGE_PROTO_HEADER,
  MESSAGE_HEADER
} from '../../src/shared/message/core.js';
import { Buffer } from '../../src/shared/buffer.js';
import { getTimestamp } from '../../src/shared/message/util.js'; // For default timestamp in serializePayload

// --- Basic Assertion Helpers ---
const testResults = [];
function _log(message, isError = false) {
  // In a real test runner, this would go to the console or a test report.
  // For now, collecting results in an array.
  if (isError) console.error(message); else console.log(message);
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    _log(`FAIL: ${message}. Expected "${expected}", but got "${actual}"`, true);
    testResults.push({ name: message, passed: false, actual, expected });
    throw new Error(`Assertion failed: ${message}. Expected "${expected}", but got "${actual}"`);
  }
  _log(`PASS: ${message}`);
  testResults.push({ name: message, passed: true });
}

function assertDeepEquals(actual, expected, message) {
  // Simple JSON stringify comparison, not robust for all cases (e.g. undefined, functions)
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    _log(`FAIL: ${message}. Expected ${expectedJson}, but got ${actualJson}`, true);
    testResults.push({ name: message, passed: false, actual: actualJson, expected: expectedJson });
    throw new Error(`Assertion failed: ${message}. Expected ${expectedJson}, but got ${actualJson}`);
  }
   _log(`PASS: ${message}`);
  testResults.push({ name: message, passed: true });
}

function assertArrayEquals(actual, expected, message) {
  if (!actual || !expected || actual.length !== expected.length) {
    _log(`FAIL: ${message}. Length mismatch. Expected length ${expected ? expected.length : 'N/A'}, got ${actual ? actual.length : 'N/A'}`, true);
    testResults.push({ name: message, passed: false, actual: `length ${actual ? actual.length : 'N/A'}`, expected: `length ${expected ? expected.length : 'N/A'}` });
    throw new Error(`Assertion failed: ${message}. Length mismatch.`);
  }
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) {
      _log(`FAIL: ${message}. Element at index ${i} mismatch. Expected ${expected[i]}, got ${actual[i]}`, true);
      testResults.push({ name: message, passed: false, actual: `element ${i}: ${actual[i]}`, expected: `element ${i}: ${expected[i]}` });
      throw new Error(`Assertion failed: ${message}. Element at index ${i} mismatch.`);
    }
  }
  _log(`PASS: ${message}`);
  testResults.push({ name: message, passed: true });
}

function assertThrows(fn, expectedErrorCodeOrMessage, message) {
  let caughtError = null;
  try {
    fn();
  } catch (e) {
    caughtError = e;
  }
  if (!caughtError) {
    _log(`FAIL: ${message}. Expected function to throw an error, but it did not.`, true);
    testResults.push({ name: message, passed: false, reason: 'No error thrown' });
    throw new Error(`Assertion failed: ${message}. No error thrown.`);
  }
  if (expectedErrorCodeOrMessage) {
    if (typeof expectedErrorCodeOrMessage === 'number' && caughtError.code !== expectedErrorCodeOrMessage) {
      _log(`FAIL: ${message}. Expected error code ${expectedErrorCodeOrMessage}, but got ${caughtError.code}. Message: ${caughtError.message}`, true);
      testResults.push({ name: message, passed: false, actual: `code ${caughtError.code}`, expected: `code ${expectedErrorCodeOrMessage}` });
      throw new Error(`Assertion failed: ${message}. Incorrect error code.`);
    } else if (typeof expectedErrorCodeOrMessage === 'string' && !caughtError.message.includes(expectedErrorCodeOrMessage)) {
      _log(`FAIL: ${message}. Expected error message to include "${expectedErrorCodeOrMessage}", but got "${caughtError.message}"`, true);
      testResults.push({ name: message, passed: false, actual: caughtError.message, expected: `to include ${expectedErrorCodeOrMessage}` });
      throw new Error(`Assertion failed: ${message}. Incorrect error message.`);
    }
  }
  _log(`PASS: ${message}`);
  testResults.push({ name: message, passed: true });
}

// --- Test Suites ---

function runMessageSerializationTests() {
  _log("--- Running Message Serialization/Deserialization Tests ---");

  const originalMsg = new Message({
    flag: MessageFlag.App,
    version: MessageVersion.Version1,
    type: MessageType.Data,
    port1: 100,
    port2: 200,
    appId: 12345,
    extra: 0,
    payload: Buffer.from([1, 2, 3, 4]),
  });

  let serialized;
  try {
    serialized = serializeMessage(originalMsg);
    _log("Message serialized successfully.");
  } catch (e) {
    _log(`FAIL: Basic Message Serialization. Error: ${e.message}`, true);
    testResults.push({ name: "Basic Message Serialization", passed: false, reason: e.message });
    return; // Stop this suite if basic serialization fails
  }
  
  assertEquals(serialized.byteLength, MESSAGE_HEADER + originalMsg.payload.byteLength, "Serialized message length");

  let deserializedMsg;
  try {
    deserializedMsg = deserializeMessage(serialized);
     _log("Message deserialized successfully.");
  } catch (e) {
    _log(`FAIL: Basic Message Deserialization. Error: ${e.message}`, true);
    testResults.push({ name: "Basic Message Deserialization", passed: false, reason: e.message });
    return;
  }

  assertEquals(deserializedMsg.flag, originalMsg.flag, "Deserialized flag matches");
  assertEquals(deserializedMsg.version, originalMsg.version, "Deserialized version matches");
  assertEquals(deserializedMsg.type, originalMsg.type, "Deserialized type matches");
  assertEquals(deserializedMsg.port1, originalMsg.port1, "Deserialized port1 matches");
  assertEquals(deserializedMsg.port2, originalMsg.port2, "Deserialized port2 matches");
  assertEquals(deserializedMsg.appId, originalMsg.appId, "Deserialized appId matches");
  assertEquals(deserializedMsg.extra, originalMsg.extra, "Deserialized extra matches");
  assertArrayEquals(deserializedMsg.payload, originalMsg.payload, "Deserialized payload matches");

  // Test with zero-length payload
  const zeroPayloadMsg = new Message({
    flag: MessageFlag.Runtime,
    version: MessageVersion.Version1,
    type: MessageType.Shake,
    port1: 1, port2: 2, appId: 10, extra: 1,
    payload: Buffer.alloc(0),
  });
  const serializedZero = serializeMessage(zeroPayloadMsg);
  assertEquals(serializedZero.byteLength, MESSAGE_HEADER, "Serialized zero-payload message length");
  const deserializedZero = deserializeMessage(serializedZero);
  assertDeepEquals(deserializedZero.payload, zeroPayloadMsg.payload, "Deserialized zero-payload matches");
  assertEquals(deserializedZero.flag, zeroPayloadMsg.flag, "Deserialized zero-payload flag matches");

  _log("Message Serialization/Deserialization Tests Completed.");
}


function runPayloadSerializationTests() {
  _log("--- Running Payload Serialization/Deserialization Tests ---");

  const ts = getTimestamp(); // Use a fixed timestamp for reproducibility in test
  const originalPayload = new Payload({
    traceId: 789,
    parentId: 0,
    spanId: 101,
    seqId: 0,
    totalLength: 5, // Length of actual user data [10,20,30,40,50]
    payloadLength: 5, // Length of this chunk's user data
    payloadType: MessagePayloadType.Request,
    opCode: MessagePayloadOpCode.Finished,
    contentType: MessagePayloadDataTypeOp.BIN,
    dataType: MessagePayloadDataTypeOp.JSON, // Expecting JSON response
    timestamp1: ts,
    timestamp2: 0, timestamp3: 0, timestamp4: 0, timestamp5: 0, timestamp6: 0, timestamp7: 0,
    extra1: 0, extra2: 0, extra3: 0,
    payload: Buffer.from([10, 20, 30, 40, 50]),
  });

  let serialized;
  try {
    serialized = serializePayload(originalPayload);
     _log("Payload serialized successfully.");
  } catch (e) {
    _log(`FAIL: Basic Payload Serialization. Error: ${e.message}`, true);
    testResults.push({ name: "Basic Payload Serialization", passed: false, reason: e.message });
    return;
  }

  assertEquals(serialized.byteLength, HM_MESSAGE_PROTO_HEADER + originalPayload.payload.byteLength, "Serialized payload length");
  
  let deserializedPayload;
  try {
    deserializedPayload = deserializePayload(serialized);
    _log("Payload deserialized successfully.");
  } catch (e) {
    _log(`FAIL: Basic Payload Deserialization. Error: ${e.message}`, true);
    testResults.push({ name: "Basic Payload Deserialization", passed: false, reason: e.message });
    return;
  }

  assertEquals(deserializedPayload.traceId, originalPayload.traceId, "Deserialized payload traceId");
  assertEquals(deserializedPayload.spanId, originalPayload.spanId, "Deserialized payload spanId");
  assertEquals(deserializedPayload.seqId, originalPayload.seqId, "Deserialized payload seqId");
  assertEquals(deserializedPayload.totalLength, originalPayload.totalLength, "Deserialized payload totalLength");
  assertEquals(deserializedPayload.payloadLength, originalPayload.payloadLength, "Deserialized payload payloadLength for chunk");
  assertEquals(deserializedPayload.payloadType, originalPayload.payloadType, "Deserialized payload payloadType");
  assertEquals(deserializedPayload.opCode, originalPayload.opCode, "Deserialized payload opCode");
  assertEquals(deserializedPayload.contentType, originalPayload.contentType, "Deserialized payload contentType");
  assertEquals(deserializedPayload.dataType, originalPayload.dataType, "Deserialized payload dataType");
  assertEquals(deserializedPayload.timestamp1, originalPayload.timestamp1, "Deserialized payload timestamp1");
  assertArrayEquals(deserializedPayload.payload, originalPayload.payload, "Deserialized payload data matches");

  // Test with text data
  const textData = "Hello ZeppOS";
  const textPayload = new Payload({
    traceId: 111, spanId: 222, seqId: 1, totalLength: textData.length, payloadLength: textData.length,
    payloadType: MessagePayloadType.Notify, opCode: MessagePayloadOpCode.Finished,
    contentType: MessagePayloadDataTypeOp.TEXT, dataType: MessagePayloadDataTypeOp.EMPTY,
    timestamp1: getTimestamp(), payload: Buffer.from(textData, 'utf8')
  });
  const serializedText = serializePayload(textPayload);
  const deserializedText = deserializePayload(serializedText);
  assertEquals(deserializedText.contentType, MessagePayloadDataTypeOp.TEXT, "Text payload contentType");
  assertEquals(deserializedText.payload.toString('utf8'), textData, "Text payload data matches");
  
  _log("Payload Serialization/Deserialization Tests Completed.");
}

function runAllCoreTests() {
  runMessageSerializationTests();
  _log("\n"); // Spacer
  runPayloadSerializationTests();
  _log("\n--- All core.test.js tests completed ---");
  _log(`Summary: ${testResults.filter(r => r.passed).length} passed, ${testResults.filter(r => !r.passed).length} failed.`);
  
  if (testResults.some(r => !r.passed)) {
    console.error("CORE TESTS FAILED. See details above.");
    // In a real CI environment, this would exit with a non-zero code
    // For now, just logging prominently.
  }
}

// Run tests (in a real framework, the framework CLI would do this)
runAllCoreTests();

// Export a function to run tests if this file is imported elsewhere (e.g. a main test runner)
export { runAllCoreTests, testResults as coreTestResults };
