import { BaseApp } from '@zeppos/zml/base-app'
import { log } from '@zos/utils'
const logger = log.getLogger('sync-data-1.0')

App(
  BaseApp({
    globalData: {
    },
    onCreate() {
      logger.log('app on create invoke')
    },
    onDestroy(opts) {
      logger.log('app on destroy invoke')
    },
  }),
)
