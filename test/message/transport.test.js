// test/message/transport.test.js
import { BleTransport, SideTransport } from '../../src/shared/message/transport.js';
import { Message } from '../../src/shared/message/core.js'; // For creating message instances
import { Buffer } from '../../src/shared/buffer.js';

// --- Mocks ---
// Mock core.js serialization functions
let mockSerializedBuffer = Buffer.from([1,2,3,4,5]);
let mockDeserializedMessage = { mock: true, data: "deserialized_message" };
const mockCore = {
  serializeMessage: (msgObj) => {
    mockCore.serializeMessage.calledWith = msgObj;
    return mockSerializedBuffer;
  },
  deserializeMessage: (buffer) => {
    mockCore.deserializeMessage.calledWith = buffer;
    return mockDeserializedMessage;
  },
};
mockCore.serializeMessage.calledWith = null; // To track calls
mockCore.deserializeMessage.calledWith = null;

// --- Assertion Helpers (copied for now) ---
const testResults_transport = [];
function _log_transport(message, isError = false) {
  if (isError) console.error(message); else console.log(message);
}

function assertEquals_transport(actual, expected, message) {
  if (actual !== expected) {
    _log_transport(`FAIL: ${message}. Expected "${expected}", but got "${actual}"`, true);
    testResults_transport.push({ name: message, passed: false, actual, expected });
    throw new Error(`Assertion failed: ${message}. Expected "${expected}", but got "${actual}"`);
  }
  _log_transport(`PASS: ${message}`);
  testResults_transport.push({ name: message, passed: true });
}

function assertDeepEquals_transport(actual, expected, message) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    _log_transport(`FAIL: ${message}. Expected ${expectedJson}, but got ${actualJson}`, true);
    testResults_transport.push({ name: message, passed: false, actual: actualJson, expected: expectedJson });
    throw new Error(`Assertion failed: ${message}. Expected ${expectedJson}, but got ${actualJson}`);
  }
  _log_transport(`PASS: ${message}`);
  testResults_transport.push({ name: message, passed: true });
}

function assertNotNull_transport(actual, message) {
  if (actual === null || actual === undefined) {
    _log_transport(`FAIL: ${message}. Expected not null/undefined, but got ${actual}`, true);
    testResults_transport.push({ name: message, passed: false, actual, expected: "Not null/undefined" });
    throw new Error(`Assertion failed: ${message}. Expected not null/undefined.`);
  }
  _log_transport(`PASS: ${message}`);
  testResults_transport.push({ name: message, passed: true });
}

function assertTrue_transport(actual, message) {
    assertEquals_transport(actual, true, message);
}


// --- Test Suites ---

function runBleTransportTests() {
  _log_transport("--- Running BleTransport Tests ---");

  const mockBle = {
    createConnect: (cb) => {
      mockBle.createConnect.called = true;
      mockBle.createConnect.callback = cb; // Store callback to simulate data arrival
    },
    disConnect: () => {
      mockBle.disConnect.called = true;
    },
    send: (buffer, length) => {
      mockBle.send.calledWith = { buffer, length };
      return true; // Simulate successful send
    },
    connectStatus: () => true, // Assume connected for tests that need it
  };
  mockBle.createConnect.called = false;
  mockBle.disConnect.called = false;
  mockBle.send.calledWith = null;

  const messageConfig = { appDevicePort: 20, appSidePort: 30, appId: 123 };
  
  // Temporarily replace original core functions with mocks for this test suite
  const originalSerializeMessage = BleTransport.prototype.send.__globals?.serializeMessage; // Attempt to get it if possible
  const originalDeserializeMessage = BleTransport.prototype.connect.__globals?.deserializeMessage;
  
  BleTransport.__Rewire__('serializeMessage', mockCore.serializeMessage);
  BleTransport.__Rewire__('deserializeMessage', mockCore.deserializeMessage);


  const bleTransport = new BleTransport(mockBle, messageConfig);

  // Test connect
  let connectCbCalled = false;
  bleTransport.connect(() => { connectCbCalled = true; });
  assertTrue_transport(mockBle.createConnect.called, "ble.createConnect should be called on transport.connect()");
  assertEquals_transport(connectCbCalled, true, "Connect callback should be called");

  // Test data reception
  let receivedDataEvent = null;
  bleTransport.on('data', (data) => {
    receivedDataEvent = data;
  });
  const incomingRawBuffer = Buffer.from([10,20,30]);
  if (mockBle.createConnect.callback) {
    mockBle.createConnect.callback(0, incomingRawBuffer.buffer, incomingRawBuffer.byteLength); // Simulate BLE data
  } else {
    _log_transport("FAIL: BleTransport connect callback not set up by mockBle.", true);
    return;
  }
  assertNotNull_transport(mockCore.deserializeMessage.calledWith, "deserializeMessage should be called with raw buffer");
  assertDeepEquals_transport(receivedDataEvent, mockDeserializedMessage, "Transport should emit 'data' with deserialized message");

  // Test send
  const messageToSend = new Message({ payload: Buffer.from("test") }); // Simple message
  bleTransport.send(messageToSend);
  assertDeepEquals_transport(mockCore.serializeMessage.calledWith, messageToSend, "serializeMessage should be called with message object");
  assertNotNull_transport(mockBle.send.calledWith, "ble.send should be called");
  assertEquals_transport(mockBle.send.calledWith.buffer, mockSerializedBuffer.buffer, "ble.send called with correct buffer");
  assertEquals_transport(mockBle.send.calledWith.length, mockSerializedBuffer.byteLength, "ble.send called with correct length");
  
  // Test disconnect
  bleTransport.disconnect();
  assertTrue_transport(mockBle.disConnect.called, "ble.disConnect should be called on transport.disconnect()");

  // Restore original functions if they were captured (basic __Rewire__ might not support this well without framework)
  BleTransport.__ResetDependency__('serializeMessage');
  BleTransport.__ResetDependency__('deserializeMessage');

  _log_transport("BleTransport Tests Completed.");
}


function runSideTransportTests() {
  _log_transport("--- Running SideTransport Tests ---");

  const mockMessaging = {
    addListener: (event, cb) => {
      if (event === 'message') {
        mockMessaging.addListener.called = true;
        mockMessaging.addListener.callback = cb;
      }
    },
    removeListener: (event, cb) => {
       if (event === 'message') {
        mockMessaging.removeListener.called = true;
      }
    },
    send: (buffer) => {
      mockMessaging.send.calledWith = buffer;
    },
  };
  mockMessaging.addListener.called = false;
  mockMessaging.removeListener.called = false;
  mockMessaging.send.calledWith = null;
  
  const messageConfig = { appDevicePort: 20, appSidePort: 30, appId: 123 };

  SideTransport.__Rewire__('serializeMessage', mockCore.serializeMessage);
  SideTransport.__Rewire__('deserializeMessage', mockCore.deserializeMessage);

  const sideTransport = new SideTransport(mockMessaging, messageConfig);

  // Test connect
  let connectCbCalledSide = false;
  sideTransport.connect(() => { connectCbCalledSide = true; });
  assertTrue_transport(mockMessaging.addListener.called, "messaging.addListener should be called on transport.connect()");
  assertEquals_transport(connectCbCalledSide, true, "Connect callback should be called for SideTransport");

  // Test data reception
  let receivedDataEventSide = null;
  sideTransport.on('data', (data) => {
    receivedDataEventSide = data;
  });
  const incomingRawBufferSide = Buffer.from([40,50,60]);
   if (mockMessaging.addListener.callback) {
    mockMessaging.addListener.callback(incomingRawBufferSide.buffer); // Simulate messaging data
  } else {
    _log_transport("FAIL: SideTransport connect callback not set up by mockMessaging.", true);
    return;
  }
  assertNotNull_transport(mockCore.deserializeMessage.calledWith, "deserializeMessage should be called (Side)");
  assertDeepEquals_transport(receivedDataEventSide, mockDeserializedMessage, "SideTransport should emit 'data' with deserialized message");

  // Test send
  const messageToSendSide = new Message({ payload: Buffer.from("side_test") });
  sideTransport.send(messageToSendSide);
  assertDeepEquals_transport(mockCore.serializeMessage.calledWith, messageToSendSide, "serializeMessage should be called (Side)");
  assertEquals_transport(mockMessaging.send.calledWith, mockSerializedBuffer.buffer, "messaging.send called with correct buffer");
  
  // Test disconnect
  sideTransport.disconnect();
  assertTrue_transport(mockMessaging.removeListener.called, "messaging.removeListener should be called on transport.disconnect()");
  
  SideTransport.__ResetDependency__('serializeMessage');
  SideTransport.__ResetDependency__('deserializeMessage');

  _log_transport("SideTransport Tests Completed.");
}


function runAllTransportTests() {
  // Note: __Rewire__ and __ResetDependency__ are placeholders for a proper DI/mocking tool like 'babel-plugin-rewire' or Jest mocks.
  // These tests might fail without such a tool, as JavaScript modules cache exports.
  // A simple workaround for testing might involve directly setting the functions if they are exposed for testing,
  // or structuring the code to allow easier injection.
  // For now, we assume a rewire-like capability or that the functions are globally replaceable for test.
  _log_transport("WARNING: Transport tests rely on a module rewiring mechanism (like babel-plugin-rewire or Jest mocks) to mock dependencies from core.js. If not set up, these tests may not mock correctly.");

  runBleTransportTests();
  _log_transport("\n");
  runSideTransportTests();
  _log_transport("\n--- All transport.test.js tests completed ---");
  _log_transport(`Summary: ${testResults_transport.filter(r => r.passed).length} passed, ${testResults_transport.filter(r => !r.passed).length} failed.`);
  
  if (testResults_transport.some(r => !r.passed)) {
    console.error("TRANSPORT TESTS FAILED. See details above.");
  }
}

runAllTransportTests();

export { runAllTransportTests, testResults_transport as transportTestResults };
