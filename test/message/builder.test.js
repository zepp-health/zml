// test/message/builder.test.js
import { MessageBuilder, ShakeStatus, MessageShakeTimeOut } from '../../src/shared/message/builder.js';
import {
  Message, Payload, MessageType, MessagePayloadType, MessageFlag, MessageVersion,
  MessagePayloadDataTypeOp, MessagePayloadOpCode,
  serializeMessage, deserializeMessage, // Will be used by mock transport if needed
  serializePayload, deserializePayload,
} from '../../src/shared/message/core.js';
import { MessageError, MessageErrorCode } from '../../src/shared/message/error.js';
import { Buffer } from '../../src/shared/buffer.js';
import { setTimeout, clearTimeout } from '../../src/shared/setTimeout.js';
import { Deferred } from '../../src/shared/defer.js'; // For shakeTask
import { isZeppOS as mockIsZeppOS, resetPlatform, setPlatformDevice, setPlatformSide } from '../../src/shared/platform.js'; // Mock platform

// --- Mocks ---

// Mock Transport base class
class MockTransport {
  constructor(config) {
    this.config = config;
    this.listeners = new Map();
    this.sendCalledWith = null;
    this.connectCalled = false;
    this.disconnectCalled = false;
    this._isConnected = false; // Internal state for mock
  }
  on(event, callback) { this.listeners.set(event, callback); }
  emit(event, data) { if (this.listeners.has(event)) this.listeners.get(event)(data); }
  send(data) { this.sendCalledWith = data; }
  connect(cb) { this.connectCalled = true; this._isConnected = true; if (cb) cb(); this.emit('connect');}
  disconnect(cb) { this.disconnectCalled = true; this._isConnected = false; if (cb) cb(); this.emit('disconnect');}
  isConnected() { return this._isConnected; } // Mock method
}

let lastBleTransportInstance = null;
let lastSideTransportInstance = null;

const mockBleTransportModule = {
  BleTransport: class extends MockTransport {
    constructor(ble, config) {
      super(config);
      this.bleMock = ble;
      lastBleTransportInstance = this;
      _log_builder("MockBleTransport instantiated");
    }
  }
};
const mockSideTransportModule = {
  SideTransport: class extends MockTransport {
    constructor(messaging, config) {
      super(config);
      this.messagingMock = messaging;
      lastSideTransportInstance = this;
      _log_builder("MockSideTransport instantiated");
    }
  }
};

// Mock nativeBle and messaging (peerSocket)
const mockNativeBle = { createConnect: () => {}, send: () => {}, disConnect: () => {}, connectStatus: () => true };
const mockPeerSocket = { addListener: () => {}, removeListener: () => {}, send: () => {} };
const mockMessaging = { peerSocket: mockPeerSocket };


// --- Assertion Helpers ---
const testResults_builder = [];
function _log_builder(message, isError = false) { if (isError) console.error(message); else console.log(message); }
function assertEquals_builder(actual, expected, message) {
  if (actual !== expected) {
    _log_builder(`FAIL: ${message}. Expected "${expected}", but got "${actual}"`, true);
    testResults_builder.push({ name: message, passed: false, actual, expected });
    throw new Error(`Assertion failed: ${message}. Expected "${expected}", but got "${actual}"`);
  }
  _log_builder(`PASS: ${message}`);
  testResults_builder.push({ name: message, passed: true });
}
function assertTrue_builder(value, message) { assertEquals_builder(value, true, message); }
function assertNotNull_builder(value, message) {
  if (value === null || value === undefined) {
    _log_builder(`FAIL: ${message}. Expected not null/undefined`, true);
    testResults_builder.push({ name: message, passed: false });
    throw new Error(`Assertion failed: ${message}.`);
  }
  _log_builder(`PASS: ${message}`);
  testResults_builder.push({ name: message, passed: true });
}


// --- Test Suites ---
async function runMessageBuilderTests() {
  _log_builder("--- Running MessageBuilder Tests ---");
  
  // To mock dependencies of MessageBuilder, we'd ideally use Jest or rewire.
  // For now, we assume MessageBuilder correctly imports its dependencies.
  // We will test its behavior by interacting with its public API and observing emitted events or returned values.

  // Test 1: Constructor - Device context
  _log_builder("Test 1: Constructor - Device Context");
  setPlatformDevice(); // platform.js mock
  let builderDevice = new MessageBuilder({ appId: 1, appDevicePort: 22, ble: mockNativeBle });
  assertNotNull_builder(builderDevice.transport, "Device builder should have transport");
  assertTrue_builder(builderDevice.isDevice, "builder.isDevice should be true for device context");
  // In a real test with module mocking, we'd check if BleTransport was called.
  // For now, we assume if transport exists, it's the right type.

  // Test 2: Constructor - Side context
  _log_builder("Test 2: Constructor - Side Context");
  setPlatformSide(); // platform.js mock
  let builderSide = new MessageBuilder({ appId: 1, appSidePort: 33, messagingInstance: mockMessaging });
  assertNotNull_builder(builderSide.transport, "Side builder should have transport");
  assertTrue_builder(builderSide.isSide, "builder.isSide should be true for side context");

  // Test 3: Device Shake Handshake
  _log_builder("Test 3: Device Shake Handshake");
  setPlatformDevice();
  const deviceAppId = 1001;
  builderDevice = new MessageBuilder({ appId: deviceAppId, appDevicePort: 25, ble: mockNativeBle });
  const mockDeviceTransport = builderDevice.transport; // Get the actual transport instance

  let shakePromise = builderDevice.fork();
  assertTrue_builder(builderDevice.shakeStatus === ShakeStatus.pending, "Shake status should be pending");
  assertNotNull_builder(mockDeviceTransport.sendCalledWith, "Transport.send should be called for shake");
  
  // Simulate shake response from side
  const shakeResponseFromSide = new Message({
    flag: MessageFlag.App, version: MessageVersion.Version1, type: MessageType.Shake,
    port1: 3030, // Side's device port (doesn't matter much for this test)
    port2: 4040, // Side's actual port, builder should capture this
    appId: deviceAppId, payload: Buffer.from([deviceAppId])
  });
  // The transport would normally deserialize this. We simulate the transport emitting the deserialized Message.
  mockDeviceTransport.emit('data', shakeResponseFromSide);

  try {
    await shakePromise;
    assertEquals_builder(builderDevice.shakeStatus, ShakeStatus.success, "Shake status should be success after response");
    assertEquals_builder(builderDevice.config.appSidePort, 4040, "appSidePort should be updated from shake response");
  } catch (e) {
    _log_builder(`FAIL: Device shake promise rejected: ${e.message}`, true);
    testResults_builder.push({ name: "Device Shake Success", passed: false, reason: e.message });
  }

  // Test 4: Shake Timeout
  _log_builder("Test 4: Shake Timeout");
  setPlatformDevice();
  builderDevice = new MessageBuilder({ appId: 1002, appDevicePort: 26, ble: mockNativeBle });
  let shakeTimeoutPromise = builderDevice.fork(50); // 50ms timeout
  let timeoutError = null;
  try {
    await shakeTimeoutPromise;
  } catch (e) {
    timeoutError = e;
  }
  assertNotNull_builder(timeoutError, "Shake should timeout and promise reject");
  if(timeoutError) assertEquals_builder(timeoutError.code, MessageErrorCode.SHAKE_TIME_OUT, "Error code should be SHAKE_TIME_OUT");
  assertEquals_builder(builderDevice.shakeStatus, ShakeStatus.failure, "Shake status should be failure on timeout");


  // Test 5: Basic request (after successful shake)
  _log_builder("Test 5: Basic request after successful shake");
  setPlatformDevice();
  builderDevice = new MessageBuilder({ appId: 1003, appDevicePort: 27, ble: mockNativeBle });
  const deviceTransportForReq = builderDevice.transport;
  
  // Manual successful shake:
  builderDevice.shakeStatus = ShakeStatus.success;
  builderDevice.config.appSidePort = 5050; // Assume shake set this
  builderDevice.waitingShakePromise = Promise.resolve();


  const requestData = { command: "getData" };
  const requestPromise = builderDevice.request(requestData, { dataType: 'json' });

  assertNotNull_builder(deviceTransportForReq.sendCalledWith, "Transport.send should be called for request");
  // Further checks would involve inspecting sendCalledWith to see if it's a Message
  // containing a Payload with the requestData, which is complex without deeper mocking.

  // Simulate response for the request
  // Need to know the traceId. The RequestHandler generates it.
  // This part is hard to test without access to the RequestHandler's internals or more events.
  // For now, we've tested that transport.send was called.
  // A full E2E test would be better here.
  
  // To resolve the request, we'd need to simulate the transport receiving a response Message,
  // which then goes through onRawMessage, onHmProtoPayload, SessionManager, and finally RequestHandler.
  // This is too complex for this unit test without extensive mocking of those components.
  // We'll assume RequestHandler tests cover the response logic.

  _log_builder("MessageBuilder Basic Request test (send part) completed.");
  // Cleanup for pending promises if any (not straightforward here)
  // For robust tests, especially for request/response, we'd need to mock RequestHandler's behavior
  // or have a more integrated test.

  _log_builder("MessageBuilder Tests Completed (partially, focus on constructor and shake).");
}


async function runAllBuilderTests() {
  resetPlatform(); // Reset platform to default (side) before each run might be good
  await runMessageBuilderTests();
  _log_builder("\n--- All builder.test.js tests completed ---");
  _log_builder(`Summary: ${testResults_builder.filter(r => r.passed).length} passed, ${testResults_builder.filter(r => !r.passed).length} failed.`);
  
  if (testResults_builder.some(r => !r.passed)) {
    console.error("BUILDER TESTS FAILED. See details above.");
  }
}

// Run tests
new Promise(resolve => resolve(runAllBuilderTests())).catch(e => {
    _log_builder(`Unhandled error during builder test execution: ${e.message}`, true);
});

export { runAllBuilderTests, testResults_builder as builderTestResults };
