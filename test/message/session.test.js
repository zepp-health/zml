// test/message/session.test.js
import { Session, SessionManager } from '../../src/shared/message/session.js';
import { Payload, MessagePayloadOpCode, MessagePayloadType } from '../../src/shared/message/core.js';
import { Buffer } from '../../src/shared/buffer.js';

// --- Basic Assertion Helpers ---
const testResults_session = [];
function _log_session(message, isError = false) {
  if (isError) console.error(message); else console.log(message);
}

function assertEquals_session(actual, expected, message) {
  if (actual !== expected) {
    _log_session(`FAIL: ${message}. Expected "${expected}", but got "${actual}"`, true);
    testResults_session.push({ name: message, passed: false, actual, expected });
    throw new Error(`Assertion failed: ${message}. Expected "${expected}", but got "${actual}"`);
  }
  _log_session(`PASS: ${message}`);
  testResults_session.push({ name: message, passed: true });
}

function assertArrayEquals_session(actual, expected, message) {
    if (!actual || !expected || actual.length !== expected.length) {
    _log_session(`FAIL: ${message}. Length mismatch. Expected length ${expected ? expected.length : 'N/A'}, got ${actual ? actual.length : 'N/A'}`, true);
    testResults_session.push({ name: message, passed: false, actual: `length ${actual ? actual.length : 'N/A'}`, expected: `length ${expected ? expected.length : 'N/A'}` });
    throw new Error(`Assertion failed: ${message}. Length mismatch.`);
  }
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) {
      _log_session(`FAIL: ${message}. Element at index ${i} mismatch. Expected ${expected[i]}, got ${actual[i]}`, true);
      testResults_session.push({ name: message, passed: false, actual: `element ${i}: ${actual[i]}`, expected: `element ${i}: ${expected[i]}` });
      throw new Error(`Assertion failed: ${message}. Element at index ${i} mismatch.`);
    }
  }
  _log_session(`PASS: ${message}`);
  testResults_session.push({ name: message, passed: true });
}

function assertTrue_session(value, message) {
  if (value !== true) {
    _log_session(`FAIL: ${message}. Expected true, but got ${value}`, true);
    testResults_session.push({ name: message, passed: false, actual: value, expected: true });
    throw new Error(`Assertion failed: ${message}. Expected true, but got ${value}`);
  }
  _log_session(`PASS: ${message}`);
  testResults_session.push({ name: message, passed: true });
}

// --- Test Suites ---

function runSessionTests() {
  _log_session("--- Running Session Tests ---");

  const sessionId = 123;
  const sessionType = MessagePayloadType.Request;
  const totalDataSize = 10; // e.g. 2 chunks of 5 bytes
  const mockCtx = {}; // Mock context if needed by session event handlers

  // Test 1: Successful reassembly of chunks in order
  let session = new Session(sessionId, sessionType, totalDataSize, mockCtx);
  let receivedFullPayload = null;
  let sessionError = null;

  session.on('data', (data) => { receivedFullPayload = data; });
  session.on('error', (err) => { sessionError = err; });

  const chunk1Data = Buffer.from([1, 2, 3, 4, 5]);
  const chunk1 = new Payload({
    traceId: sessionId, payloadType: sessionType, totalLength: totalDataSize,
    seqId: 0, opCode: MessagePayloadOpCode.Continued,
    payload: chunk1Data, payloadLength: chunk1Data.byteLength,
  });
  session.addChunk(chunk1);

  const chunk2Data = Buffer.from([6, 7, 8, 9, 10]);
  const chunk2 = new Payload({
    traceId: sessionId, payloadType: sessionType, totalLength: totalDataSize,
    seqId: 1, opCode: MessagePayloadOpCode.Finished, // Last chunk
    payload: chunk2Data, payloadLength: chunk2Data.byteLength,
  });
  session.addChunk(chunk2);

  assertTrue_session(receivedFullPayload !== null, "Session should emit 'data' event on full reassembly");
  assertEquals_session(sessionError, null, "Session should not emit 'error' on successful reassembly");
  if (receivedFullPayload) {
    assertEquals_session(receivedFullPayload.payload.byteLength, totalDataSize, "Assembled payload should have correct total length");
    const expectedFullData = Buffer.concat([chunk1Data, chunk2Data]);
    assertArrayEquals_session(receivedFullPayload.payload, expectedFullData, "Assembled payload data should be correct");
    assertEquals_session(receivedFullPayload.opCode, MessagePayloadOpCode.Finished, "Assembled payload should have Finished opCode");
  }
  
  // Test 2: Reassembly with out-of-order chunks
  session = new Session(sessionId + 1, sessionType, totalDataSize, mockCtx);
  receivedFullPayload = null;
  sessionError = null;
  session.on('data', (data) => { receivedFullPayload = data; });
  session.on('error', (err) => { sessionError = err; });

  session.addChunk(chunk2); // Add chunk2 (seqId 1, Finished) first
  session.addChunk(chunk1); // Add chunk1 (seqId 0, Continued) second

  assertTrue_session(receivedFullPayload !== null, "Session should emit 'data' (out-of-order chunks)");
  assertEquals_session(sessionError, null, "Session should not emit 'error' (out-of-order chunks)");
   if (receivedFullPayload) {
    assertEquals_session(receivedFullPayload.payload.byteLength, totalDataSize, "Assembled payload length (out-of-order)");
  }

  // Test 3: Error on payloadLength mismatch
  session = new Session(sessionId + 2, sessionType, 5, mockCtx);
  sessionError = null;
  session.on('error', (err) => { sessionError = err; });
  const badChunk = new Payload({
    traceId: sessionId + 2, payloadType: sessionType, totalLength: 5,
    seqId: 0, opCode: MessagePayloadOpCode.Finished,
    payload: Buffer.from([1,2,3]), payloadLength: 5, // Actual data is 3 bytes, header says 5
  });
  session.addChunk(badChunk);
  assertTrue_session(sessionError !== null, "Session should emit 'error' on payloadLength mismatch");
  if(sessionError) assertEquals_session(sessionError.message.includes('Chunk data length error'), true, "Error message for payloadLength mismatch");

  // Test 4: Error on totalLength mismatch (finishChunk.totalLength vs assembled payloadLength)
  // This specific check (finishChunk.totalLength !== this.finishChunk.payloadLength)
  // might be tricky if totalLength in Payload refers to the entire multi-chunk message,
  // and payloadLength is for the specific chunk. The test in core.js for Payload serialization uses
  // totalLength for the full message and payloadLength for the chunk. Session reassembles it.
  // The check `this.finishChunk.totalLength !== this.finishChunk.payloadLength` in Session.js
  // implies that after assembly, the `payloadLength` of the `finishChunk` (now holding the full buffer)
  // should match its `totalLength` field.

  session = new Session(sessionId + 3, sessionType, 10, mockCtx); // Expect 10 bytes
  receivedFullPayload = null;
  sessionError = null;
  session.on('data', (data) => { receivedFullPayload = data; });
  session.on('error', (err) => { sessionError = err; });

  const c1 = new Payload({
    traceId: sessionId + 3, payloadType: sessionType, totalLength: 10, // Correct totalLength
    seqId: 0, opCode: MessagePayloadOpCode.Continued,
    payload: Buffer.from([1,2,3,4,5]), payloadLength: 5
  });
  const c2_bad_total = new Payload({ // This chunk is 'Finished', its totalLength will be used for final check
    traceId: sessionId + 3, payloadType: sessionType, totalLength: 9, // INCORRECT totalLength
    seqId: 1, opCode: MessagePayloadOpCode.Finished,
    payload: Buffer.from([6,7,8,9,10]), payloadLength: 5
  });
  session.addChunk(c1);
  session.addChunk(c2_bad_total);
  assertTrue_session(sessionError !== null, "Session should emit 'error' on final totalLength mismatch");
  if(sessionError) assertTrue_session(sessionError.message.includes('Full data length error'), "Error message for final totalLength mismatch");
  assertEquals_session(receivedFullPayload, null, "Session should not emit 'data' on final totalLength mismatch");


  // Test 5: Release buffer
  session = new Session(sessionId + 4, sessionType, totalDataSize, mockCtx);
  session.addChunk(chunk1);
  session.releaseBuf();
  assertEquals_session(session.chunks.length, 0, "releaseBuf should clear chunks");
  assertEquals_session(session.finishChunk, null, "releaseBuf should clear finishChunk");
  assertEquals_session(session.count, -1, "releaseBuf should reset count"); // original code resets to 0, my impl to -1
  assertEquals_session(session.receivedSize, 0, "releaseBuf should reset receivedSize");


  _log_session("Session Tests Completed.");
}

function runSessionManagerTests() {
  _log_session("--- Running SessionManager Tests ---");
  const manager = new SessionManager();
  const sessionId = 1, sessionType = 1, sessionSize = 100, sessionCtx = {};

  // Test newSession & getById
  const session1 = manager.newSession(sessionId, sessionType, sessionSize, sessionCtx);
  assertTrue_session(session1 instanceof Session, "newSession should return a Session instance");
  const retrievedSession = manager.getById(sessionId, sessionType);
  assertEquals_session(retrievedSession, session1, "getById should retrieve the correct session");

  // Test has
  assertTrue_session(manager.has(sessionId, sessionType), "has should return true for existing session");
  assertTrue_session(!manager.has(sessionId + 1, sessionType), "has should return false for non-existent session");

  // Test destroy
  let session1Released = false;
  session1.releaseBuf = () => { session1Released = true; }; // Mock releaseBuf
  manager.destroy(session1);
  assertTrue_session(session1Released, "destroy should call releaseBuf on session");
  assertTrue_session(!manager.has(sessionId, sessionType), "session should be removed after destroy");

  // Test destroy by id/type
  const session2 = manager.newSession(sessionId + 1, sessionType, sessionSize, sessionCtx);
  let session2Released = false;
  session2.releaseBuf = () => { session2Released = true; };
  manager.destroy(sessionId + 1, sessionType);
  assertTrue_session(session2Released, "destroy by id/type should call releaseBuf");
  assertTrue_session(!manager.has(sessionId+1, sessionType), "session should be removed after destroy by id/type");


  // Test clear
  const s3 = manager.newSession(3,1,10, {});
  const s4 = manager.newSession(4,1,10, {});
  let s3Released = false; let s4Released = false;
  s3.releaseBuf = () => { s3Released = true; };
  s4.releaseBuf = () => { s4Released = true; };
  manager.clear();
  assertTrue_session(s3Released && s4Released, "clear should call releaseBuf on all sessions");
  assertTrue_session(!manager.has(3,1) && !manager.has(4,1), "all sessions should be removed after clear");
  assertEquals_session(manager.sessions.size, 0, "sessions map should be empty after clear");


  _log_session("SessionManager Tests Completed.");
}


function runAllSessionTests() {
  runSessionTests();
  _log_session("\n");
  runSessionManagerTests();
  _log_session("\n--- All session.test.js tests completed ---");
  _log_session(`Summary: ${testResults_session.filter(r => r.passed).length} passed, ${testResults_session.filter(r => !r.passed).length} failed.`);

  if (testResults_session.some(r => !r.passed)) {
    console.error("SESSION TESTS FAILED. See details above.");
  }
}

runAllSessionTests();

export { runAllSessionTests, testResults_session as sessionTestResults };
