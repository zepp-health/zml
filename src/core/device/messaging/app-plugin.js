import { createDeviceMessage } from './device-message'
import { httpRequest } from './httpRequest'

export function appPlugin(opts) {
	const messaging = createDeviceMessage()
  return {
    onCreate() {
      this.messaging = this.globalData.messaging = messaging
			this._onCall = this.onCall?.bind(this)
      this._onRequest = this.onRequest?.bind(this)
      this.messaging
        .onCall(this._onCall)
        .onRequest(this._onRequest)
        .connect()
    },
    onDestroy() {
      this.messaging.offOnCall().offOnRequest().disConnect()
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
