import { createDeviceMessage } from './device-message'
import { fileTransferLib } from './device-file-transfer'
import { merge } from '../common/merge'
import { pluginService } from '../common/plugin-service'
import { httpRequestPlugin } from './httpRequest'

function BaseApp({ globalData = {}, onCreate, onDestroy, ...other } = {}) {
  const opts = {
    globalData,
    ...other,
    onCreate(...opts) {
      this.messaging = this.globalData.messaging = createDeviceMessage()
      this.messaging
        .onCall(this.onCall?.bind(this))
        .onRequest(this.onRequest?.bind(this))
        .connect()

      fileTransferLib.onFile(this.onReceivedFile?.bind(this))

      BaseApp.mixins.forEach((m) => {
        m & m.handler.onCreate?.apply(this, opts)
      })
      onCreate?.apply(this, opts)
    },
    onDestroy(...opts) {
      onDestroy?.apply(this, opts)

      BaseApp.mixins.forEach((m) => {
        m & m.handler.onDestroy?.apply(this, opts)
      })

      this.messaging.offOnCall().offOnRequest().disConnect()
      fileTransferLib.offFile()
    },
  }

  BaseApp.handle(opts)

  return opts
}

merge(BaseApp, pluginService)

BaseApp.init()
BaseApp.use(httpRequestPlugin)

export { BaseApp, merge }
