import { httpRequest } from './httpRequest.js'

function getDeviceMessage() {
  const { messaging } = getApp()._options.globalData
  return messaging
}

export function pagePlugin(opts) {
  const messaging = getDeviceMessage()
  return {
    onInit() {
      this.messaging = this.state.messaging = messaging
      this._onCall = this.onCall?.bind(this)
      this._onRequest = this.onRequest?.bind(this)
      this.messaging.onCall(this._onCall).onRequest(this._onRequest)
    },
    onDestroy() {
      if (this._onCall) {
        this.messaging.offOnCall(this._onCall)
      }

      if (this._onRequest) {
        this.messaging.offOnRequest(this._onRequest)
      }
    },
    request(data, opts = {}) {
      return this.messaging.request(data, opts)
    },
    call(data) {
      return this.messaging.call(data)
    },
		httpRequest
  }
}

export const API_LEVEL = __API_LEVEL__
