import { createDeviceMessage } from './device-message.js'
import { httpRequest } from './httpRequest.js'
import { zosApp } from '../../common/common.js'
import { Deferred } from '../../../shared/defer.js'

export function generateRandom12() {
  let result = ''
  for (let i = 0; i < 12; i++) {
    if (i === 0) {
      // 确保第一位不为0
      result += Math.floor(Math.random() * 9) + 1
    } else {
      result += Math.floor(Math.random() * 10)
    }
  }
  return result
}

export function appPlugin(opts) {
  const messaging = createDeviceMessage()
  return {
    onCreate() {
      this.messaging = this.globalData.messaging = messaging
      this._onCall = this.onCall?.bind(this)
      this._onRequest = this.onRequest?.bind(this)
      this._onBleChanged = this.onBleChanged?.bind(this)
      this.messaging
        .onCall(this._onCall)
        .onRequest(this._onRequest)
        .onBleChanged(this._onBleChanged)
        .connect()
    },
    onDestroy() {
      this.messaging.offOnCall().offOnRequest().offOnBleChanged().disConnect()
    },
    request(data, opts = {}) {
      const defer = Deferred()

      const id = generateRandom12()
      const eventResult = 'response:result:' + id
      const eventError = 'response:error:' + id

      function resolve(e, ...args) {
        defer.resolve(...args)
      }

      function reject(e, ...args) {
        defer.reject(...args)
      }

      zosApp.onMessage(eventResult, resolve)
      zosApp.onMessage(eventError, reject)

      this.messaging
        .request(data, opts)
        .then((r) => {
          zosApp.postMessage(eventResult, r)
        })
        .catch((e) => {
          zosApp.postMessage(eventError, e)
        })
        .finally(() => {
          zosApp.offMessage(eventResult)
          zosApp.offMessage(eventError)
        })

      return defer.promise
    },
    call(data) {
      return this.messaging.call(data)
    },
    httpRequest,
  }
}

export const API_LEVEL = __API_LEVEL__
