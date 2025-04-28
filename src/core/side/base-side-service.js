import { merge } from '../common/merge.js'
import { pluginService } from '../common/plugin-service.js'
import { loggerPlugin } from './logger/logger-plugin.js'
import { settingsPlugin } from './settings/settings-plugin.js'

function BaseSideService({
  state = {},
  onInit,
  onRun,
  onDestroy,
  ...other
} = {}) {
  const opts = {
    state,
    ...other,
    onInit(opts) {
      for (let i = 0; i <= BaseSideService.mixins.length - 1; i++) {
        const m = BaseSideService.mixins[i]
        m && m.handler.onInit?.apply(this, opts)
      }
      onInit?.apply(this, opts)
    },
    onRun(opts) {
      for (let i = 0; i <= BaseSideService.mixins.length - 1; i++) {
        const m = BaseSideService.mixins[i]
        m && m.handler.onRun?.apply(this, opts)
      }
      onRun?.apply(this, opts)
    },
    onDestroy(opts) {
      onDestroy?.apply(this, opts)

      for (let i = BaseSideService.mixins.length - 1; i >= 0; i--) {
        const m = BaseSideService.mixins[i]
        m && m.handler.onDestroy?.apply(this, opts)
      }
    },
  }

  BaseSideService.handle(opts)

  return opts
}

merge(BaseSideService, pluginService)

BaseSideService.init()

BaseSideService.use(loggerPlugin)
BaseSideService.use(settingsPlugin)

export { BaseSideService, merge }
