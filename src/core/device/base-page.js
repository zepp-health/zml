import { merge } from '../common/merge.js'
import { pluginService } from '../common/plugin-service.js'
import { loggerPlugin } from './logger/logger-plugin.js'

function BasePage({
  state = {},
  onInit,
  onResume,
  onPause,
  build,
  onDestroy,
  ...other
} = {}) {
  const opts = {
    state,
    ...other,
    globalData: getApp()._options.globalData,
    onInit(...opts) {
      for (let i = 0; i <= BasePage.mixins.length - 1; i++) {
        const m = BasePage.mixins[i]
        m & m.handler.onInit?.apply(this, opts)
      }
      onInit?.apply(this, opts)
    },
    onResume(...opts) {
      for (let i = 0; i <= BasePage.mixins.length - 1; i++) {
        const m = BasePage.mixins[i]
        m & m.handler.onResume?.apply(this, opts)
      }
      onResume?.apply(this, opts)
    },
    onPause(...opts) {
      onPause?.apply(this, opts)
      for (let i = BasePage.mixins.length - 1; i >= 0; i--) {
        const m = BasePage.mixins[i]
        m & m.handler.onPause?.apply(this, opts)
      }
    },
    build(...opts) {
      for (let i = 0; i <= BasePage.mixins.length - 1; i++) {
        const m = BasePage.mixins[i]
        m & m.handler.build?.apply(this, opts)
      }
      build?.apply(this, opts)
    },
    onDestroy(...opts) {
      onDestroy?.apply(this, opts)

      for (let i = BasePage.mixins.length - 1; i >= 0; i--) {
        const m = BasePage.mixins[i]
        m & m.handler.onDestroy?.apply(this, opts)
      }
    },
  }

  BasePage.handle(opts)
  return opts
}

merge(BasePage, pluginService)

BasePage.init()

BasePage.use(loggerPlugin)

export { BasePage, merge }
