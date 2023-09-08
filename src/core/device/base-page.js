import { getDeviceMessage } from './device-message'
import { fileTransferLib } from './device-file-transfer'
import { merge } from '../common/merge'
import { pluginService } from '../common/extend-plugin'

function BasePage({ state = {}, onInit, onDestroy, ...other } = {}) {
  const messaging = getDeviceMessage()

  const opts = {
    state,
    ...other,
    onInit(...opts) {
      this._onCall = this.onCall?.bind(this)
      this._onRequest = this.onRequest?.bind(this)
      messaging.onCall(this._onCall).onRequest(this._onRequest)

      if (this.onReceivedFile) {
        this._onReceivedFile = this.onReceivedFile?.bind(this)
        fileTransferLib.onFile(this._onReceivedFile)
      }

      onInit?.apply(this, opts)
    },
    onDestroy(...opts) {
      if (this._onCall) {
        messaging.offOnCall(this._onCall)
      }

      if (this._onRequest) {
        messaging.offOnRequest(this._onRequest)
      }

      if (this._onReceivedFile) {
        fileTransferLib.offFile(this._onReceivedFile)
      }

      onDestroy?.apply(this, opts)
    },
    request(data) {
      return messaging.request(data)
    },
    httpRequest(data) {
      return messaging.request({
        method: 'http.request',
        params: data,
      })
    },
    call(data) {
      return messaging.call(data)
    },
    sendFile(path, opts) {
      return fileTransferLib.sendFile(path, opts)
    },
  }

  BasePage.handle(opts)

  return opts
}

merge(BasePage, pluginService)

BasePage.init()

export {
  BasePage
}