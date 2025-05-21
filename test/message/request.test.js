// test/message/request.test.js
import { RequestHandler } from '../../src/shared/message/request.js';
import { MessageError, MessageErrorCode } from '../../src/shared/message/error.js'; // Assuming error.js is created
import { genTraceId, getDataType, json2buf, buf2str, str2buf, buf2json } from '../../src/shared/message/util.js'; // Assuming util.js is created
import {
  MessagePayloadType,
  MessagePayloadDataTypeOp,
  Payload, // For constructing response payloads
  DataType, // For getDataType usage if still local in request.js
} from '../../src/shared/message/core.js';
import { Buffer } from '../../src/shared/buffer.js';
import { Deferred } from '../../src/shared/defer.js'; // Used by RequestHandler, useful for test setup
import { setTimeout, clearTimeout } from '../../src/shared/setTimeout.js';


// --- Basic Assertion Helpers ---
const testResults_request = [];
function _log_request(message, isError = false) {
  if (isError) console.error(message); else console.log(message);
}

function assertEquals_request(actual, expected, message) {
  if (actual !== expected) {
    _log_request(`FAIL: ${message}. Expected "${expected}", but got "${actual}"`, true);
    testResults_request.push({ name: message, passed: false, actual, expected });
    throw new Error(`Assertion failed: ${message}. Expected "${expected}", but got "${actual}"`);
  }
  _log_request(`PASS: ${message}`);
  testResults_request.push({ name: message, passed: true });
}
function assertDeepEquals_request(actual, expected, message) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    _log_request(`FAIL: ${message}. Expected ${expectedJson}, but got ${actualJson}`, true);
    testResults_request.push({ name: message, passed: false, actual: actualJson, expected: expectedJson });
    throw new Error(`Assertion failed: ${message}. Expected ${expectedJson}, but got ${actualJson}`);
  }
  _log_request(`PASS: ${message}`);
  testResults_request.push({ name: message, passed: true });
}
function assertTrue_request(value, message) {
  if (value !== true) {
    _log_request(`FAIL: ${message}. Expected true, but got ${value}`, true);
    testResults_request.push({ name: message, passed: false, actual: value, expected: true });
    throw new Error(`Assertion failed: ${message}. Expected true, but got ${value}`);
  }
  _log_request(`PASS: ${message}`);
  testResults_request.push({ name: message, passed: true });
}
function assertNotNull_request(value, message) {
  if (value === null || value === undefined) {
    _log_request(`FAIL: ${message}. Expected not null/undefined, but got ${value}`, true);
    testResults_request.push({ name: message, passed: false, actual: value, expected: 'Not null/undefined' });
    throw new Error(`Assertion failed: ${message}. Expected not null/undefined`);
  }
  _log_request(`PASS: ${message}`);
  testResults_request.push({ name: message, passed: true });
}


// --- Mock MessageBuilder ---
let lastSentPayloadParams = null;
const mockMessageBuilder = {
  sendPayload: (params) => {
    lastSentPayloadParams = params;
    // Simulate async operation or direct action
    _log_request(`MockMessageBuilder.sendPayload called with requestId: ${params.requestId}`);
  },
  // Add any other methods RequestHandler might call on MessageBuilder
};

// --- Test Suites ---
async function runRequestHandlerTests() {
  _log_request("--- Running RequestHandler Tests ---");
  const requestHandler = new RequestHandler(mockMessageBuilder);
  lastSentPayloadParams = null; // Reset

  // Test 1: Basic request and response (JSON)
  _log_request("Test 1: Basic JSON request and response");
  const jsonData = { query: "test" };
  const expectedJsonResponse = { result: "success" };
  let p1 = requestHandler.request(jsonData, { dataType: DataType.json });

  const p1_requestId = lastSentPayloadParams.requestId;
  assertNotNull_request(p1_requestId, "Request ID should be generated for p1");
  assertEquals_request(lastSentPayloadParams.payloadType, MessagePayloadType.Request, "p1: payloadType should be Request");
  assertEquals_request(lastSentPayloadParams.contentType, MessagePayloadDataTypeOp.JSON, "p1: contentType should be JSON");
  assertEquals_request(lastSentPayloadParams.responseDataType, MessagePayloadDataTypeOp.JSON, "p1: responseDataType should be JSON");

  // Simulate response for p1
  const responsePayloadP1 = new Payload({
    traceId: p1_requestId,
    dataType: MessagePayloadDataTypeOp.JSON,
    payload: json2buf(expectedJsonResponse),
    // Other fields like payloadType: MessagePayloadType.Response, opCode: MessagePayloadOpCode.Finished etc.
  });
  requestHandler.onResponse(responsePayloadP1);

  try {
    const resultP1 = await p1;
    assertDeepEquals_request(resultP1, expectedJsonResponse, "p1: Resolved data should match expected JSON response");
  } catch (e) {
    _log_request(`FAIL: p1 promise rejected unexpectedly. ${e.message}`, true);
    testResults_request.push({ name: "p1: JSON request success", passed: false, reason: e.message });
  }

  // Test 2: Text request and response
  _log_request("Test 2: Text request and response");
  const textData = "Hello";
  const expectedTextResponse = "World";
  let p2 = requestHandler.request(textData, { dataType: DataType.text });
  const p2_requestId = lastSentPayloadParams.requestId;
  assertEquals_request(lastSentPayloadParams.contentType, MessagePayloadDataTypeOp.TEXT, "p2: contentType should be TEXT");

  const responsePayloadP2 = new Payload({
    traceId: p2_requestId, dataType: MessagePayloadDataTypeOp.TEXT, payload: str2buf(expectedTextResponse)
  });
  requestHandler.onResponse(responsePayloadP2);
  try {
    const resultP2 = await p2;
    assertEquals_request(resultP2, expectedTextResponse, "p2: Resolved data should match expected text response");
  } catch (e) {
    _log_request(`FAIL: p2 promise rejected unexpectedly. ${e.message}`, true);
    testResults_request.push({ name: "p2: Text request success", passed: false, reason: e.message });
  }

  // Test 3: Binary request and response
   _log_request("Test 3: Binary request and response");
  const binData = Buffer.from([1,2,3]);
  const expectedBinResponse = Buffer.from([4,5,6]);
  let p3 = requestHandler.request(binData, { dataType: DataType.bin });
  const p3_requestId = lastSentPayloadParams.requestId;
  assertEquals_request(lastSentPayloadParams.contentType, MessagePayloadDataTypeOp.BIN, "p3: contentType should be BIN");

  const responsePayloadP3 = new Payload({
    traceId: p3_requestId, dataType: MessagePayloadDataTypeOp.BIN, payload: expectedBinResponse
  });
  requestHandler.onResponse(responsePayloadP3);
  try {
    const resultP3 = await p3;
    assertTrue_request(Buffer.isBuffer(resultP3), "p3: Result should be a Buffer");
    assertDeepEquals_request(resultP3, expectedBinResponse, "p3: Resolved data should match expected binary response");
  } catch (e) {
    _log_request(`FAIL: p3 promise rejected unexpectedly. ${e.message}`, true);
    testResults_request.push({ name: "p3: Binary request success", passed: false, reason: e.message });
  }


  // Test 4: Request timeout
  _log_request("Test 4: Request timeout");
  let p4_timeout = requestHandler.request({ data: "timeout_test" }, { timeout: 50 }); // Short timeout
  const p4_requestId = lastSentPayloadParams.requestId;
  let p4_error = null;
  try {
    await p4_timeout;
  } catch (e) {
    p4_error = e;
  }
  assertNotNull_request(p4_error, "p4: Promise should reject on timeout");
  if(p4_error) assertEquals_request(p4_error.code, MessageErrorCode.REQUEST_TIMEOUT, "p4: Error code should be REQUEST_TIMEOUT");
  
  // Ensure timed out request is cleaned up
  assertEquals_request(requestHandler._requests.has(p4_requestId), false, "p4: Timed out request should be removed from map");


  // Test 5: handleError
  _log_request("Test 5: handleError");
  let p5_handleError1 = requestHandler.request({ data: "p5_1" });
  const p5_reqId1 = lastSentPayloadParams.requestId;
  let p5_handleError2 = requestHandler.request({ data: "p5_2" });
  const p5_reqId2 = lastSentPayloadParams.requestId;
  
  assertTrue_request(requestHandler._requests.has(p5_reqId1), "p5_1 should be in requests map before handleError");
  assertTrue_request(requestHandler._requests.has(p5_reqId2), "p5_2 should be in requests map before handleError");

  const testError = new MessageError(MessageErrorCode.INTERNAL_ERROR, "Test global error");
  requestHandler.handleError(testError);

  assertEquals_request(requestHandler._requests.size, 0, "All requests should be cleared after handleError");
  
  let p5_e1 = null, p5_e2 = null;
  try { await p5_handleError1; } catch (e) { p5_e1 = e; }
  try { await p5_handleError2; } catch (e) { p5_e2 = e; }

  assertNotNull_request(p5_e1, "p5_1 should be rejected by handleError");
  if(p5_e1) assertEquals_request(p5_e1.message, testError.message, "p5_1 rejection error message should match");
  assertNotNull_request(p5_e2, "p5_2 should be rejected by handleError");
  if(p5_e2) assertEquals_request(p5_e2.message, testError.message, "p5_2 rejection error message should match");


  _log_request("RequestHandler Tests Completed.");
}


async function runAllRequestTests() {
  // Need to run async tests sequentially or manage promises
  await runRequestHandlerTests();
  _log_request("\n--- All request.test.js tests completed ---");
  _log_request(`Summary: ${testResults_request.filter(r => r.passed).length} passed, ${testResults_request.filter(r => !r.passed).length} failed.`);
  
  if (testResults_request.some(r => !r.passed)) {
    console.error("REQUEST TESTS FAILED. See details above.");
  }
}

// Run tests
// Wrapping in a promise to handle async nature in a simple runner
new Promise(resolve => resolve(runAllRequestTests())).catch(e => {
    _log_request(`Unhandled error during test execution: ${e.message}`, true);
});


export { runAllRequestTests, testResults_request as requestTestResults };
