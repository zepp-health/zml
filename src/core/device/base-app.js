import { merge } from '../common/merge'
import { pluginService } from '../common/plugin-service'

function BaseApp({ globalData = {}, onCreate, onDestroy, ...other } = {}) {
  const opts = {
    globalData,
    ...other,
    onCreate(...opts) {
      for (let i = 0; i <= BaseApp.mixins.length - 1; i++) {
        const m = BaseApp.mixins[i]
        m & m.handler.onCreate?.apply(this, opts)
      }
      onCreate?.apply(this, opts)
    },
    onDestroy(...opts) {
      onDestroy?.apply(this, opts)
      for (let i = BaseApp.mixins.length - 1; i >= 0; i--) {
        const m = BaseApp.mixins[i]
        m & m.handler.onDestroy?.apply(this, opts)
      }
    },
  }

  BaseApp.handle(opts)
  return opts
}

merge(BaseApp, pluginService)
BaseApp.init()

export { BaseApp, merge }
