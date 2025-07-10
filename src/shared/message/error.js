// src/shared/message/error.js

/**
 * Custom Error class for messaging related errors.
 */
class MessageError extends Error {
  /**
   * @param {number} code - The error code.
   * @param {string} message - The error message.
   */
  constructor(code, message) {
    super(message);
    this.code = code;
    this.reason = message; // Storing the message in 'reason' as well for consistency if used elsewhere.
    this.name = 'MessageError'; // Overriding the default 'Error' name.

    // Ensuring the stack trace is captured correctly in V8 environments (e.g., Node.js)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Defines standard error codes for the messaging system.
 */
const MessageErrorCode = {
  SUCCESS: 0, // Operation was successful
  SHAKE_TIME_OUT: 1, // Handshake/shake operation timed out
  BLE_CLOSE: 2, // BLE connection closed or disconnected
  APP_CLOSE: 3, // Application or side service closed or not running
  REQUEST_TIME_OUT: 4, // A specific request timed out waiting for a response
  
  // Additional common error codes
  SERIALIZATION_ERROR: 5, // Failed to serialize a message or payload
  DESERIALIZATION_ERROR: 6, // Failed to deserialize a message or payload
  INVALID_PAYLOAD: 7, // Payload structure or content is invalid
  NOT_CONNECTED: 8, // Operation requires a connection, but not connected
  SEND_FAILED: 9, // Generic send operation failure
  
  INTERNAL_ERROR: 100, // An unexpected internal error occurred
  UNKNOWN_ERROR: 101, // An error of unknown type occurred
};

export { MessageError, MessageErrorCode };
