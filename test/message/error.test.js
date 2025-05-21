// test/message/error.test.js
import {
  MessageError,
  MessageErrorCode,
} from '../../src/shared/message/error.js';

// --- Basic Assertion Helpers (copied for now) ---
const testResults_error = [];
function _log_error(message, isError = false) {
  if (isError) console.error(message); else console.log(message);
}

function assertEquals_error(actual, expected, message) {
  if (actual !== expected) {
    _log_error(`FAIL: ${message}. Expected "${expected}", but got "${actual}"`, true);
    testResults_error.push({ name: message, passed: false, actual, expected });
    throw new Error(`Assertion failed: ${message}. Expected "${expected}", but got "${actual}"`);
  }
  _log_error(`PASS: ${message}`);
  testResults_error.push({ name: message, passed: true });
}

function assertInstanceOf_error(obj, expectedClass, message) {
  if (!(obj instanceof expectedClass)) {
    _log_error(`FAIL: ${message}. Expected object to be instance of ${expectedClass.name}, but it was not.`, true);
    testResults_error.push({ name: message, passed: false, actual: obj ? obj.constructor.name : 'null', expected: expectedClass.name });
    throw new Error(`Assertion failed: ${message}. Not an instance of ${expectedClass.name}.`);
  }
  _log_error(`PASS: ${message}`);
  testResults_error.push({ name: message, passed: true });
}

// --- Test Suites ---

function runMessageErrorTests() {
  _log_error("--- Running MessageError Tests ---");

  const testCode = MessageErrorCode.REQUEST_TIMEOUT;
  const testMessage = "The request operation timed out.";
  const errorInstance = new MessageError(testCode, testMessage);

  assertEquals_error(errorInstance.code, testCode, "Error code should match input code");
  assertEquals_error(errorInstance.message, testMessage, "Error message should match input message");
  assertEquals_error(errorInstance.reason, testMessage, "Error reason should match input message");
  assertEquals_error(errorInstance.name, 'MessageError', "Error name should be 'MessageError'");
  
  assertInstanceOf_error(errorInstance, Error, "MessageError should be an instance of Error");
  assertInstanceOf_error(errorInstance, MessageError, "MessageError should be an instance of MessageError");

  // Test with a different code and message
  const anotherCode = MessageErrorCode.BLE_CLOSE;
  const anotherMessage = "BLE connection closed unexpectedly.";
  const anotherError = new MessageError(anotherCode, anotherMessage);
  assertEquals_error(anotherError.code, anotherCode, "Another error code check");
  assertEquals_error(anotherError.message, anotherMessage, "Another error message check");

  _log_error("MessageError Tests Completed.");
}

function runMessageErrorCodeTests() {
  _log_error("--- Running MessageErrorCode Tests ---");

  assertEquals_error(MessageErrorCode.SUCCESS, 0, "SUCCESS code should be 0");
  assertEquals_error(MessageErrorCode.SHAKE_TIME_OUT, 1, "SHAKE_TIME_OUT code should be 1");
  assertEquals_error(MessageErrorCode.BLE_CLOSE, 2, "BLE_CLOSE code should be 2");
  assertEquals_error(MessageErrorCode.APP_CLOSE, 3, "APP_CLOSE code should be 3");
  assertEquals_error(MessageErrorCode.REQUEST_TIME_OUT, 4, "REQUEST_TIME_OUT code should be 4");
  assertEquals_error(MessageErrorCode.SERIALIZATION_ERROR, 5, "SERIALIZATION_ERROR code should be 5");
  assertEquals_error(MessageErrorCode.DESERIALIZATION_ERROR, 6, "DESERIALIZATION_ERROR code should be 6");
  assertEquals_error(MessageErrorCode.INVALID_PAYLOAD, 7, "INVALID_PAYLOAD code should be 7");
  assertEquals_error(MessageErrorCode.NOT_CONNECTED, 8, "NOT_CONNECTED code should be 8");
  assertEquals_error(MessageErrorCode.SEND_FAILED, 9, "SEND_FAILED code should be 9");
  assertEquals_error(MessageErrorCode.INTERNAL_ERROR, 100, "INTERNAL_ERROR code should be 100");
  assertEquals_error(MessageErrorCode.UNKNOWN_ERROR, 101, "UNKNOWN_ERROR code should be 101");
  
  // Check if a few known codes are numbers
  assertEquals_error(typeof MessageErrorCode.SUCCESS, 'number', "Error codes should be numbers");
  assertEquals_error(typeof MessageErrorCode.INTERNAL_ERROR, 'number', "Error codes should be numbers");


  _log_error("MessageErrorCode Tests Completed.");
}

function runAllErrorTests() {
  runMessageErrorTests();
  _log_error("\n");
  runMessageErrorCodeTests();
  _log_error("\n--- All error.test.js tests completed ---");
  _log_error(`Summary: ${testResults_error.filter(r => r.passed).length} passed, ${testResults_error.filter(r => !r.passed).length} failed.`);
  
  if (testResults_error.some(r => !r.passed)) {
    console.error("ERROR TESTS FAILED. See details above.");
  }
}

runAllErrorTests();

export { runAllErrorTests, testResults_error as errorTestResults };
