import { BasePage } from '@zeppos/zml/base-page'
import { log as logger } from '@zos/utils'
import { layout } from 'zosLoader:./index.[pf].layout.js'
import { push } from '@zos/router'

Page(
  BasePage(
  {
    name: 'index.page',
    state: {
    },
    build() {
      layout.render(this)
    },

    onInit() {
      logger.log('page onInit invoked')
    },

    goHrPage() {
      push({
        url: 'page/common/home/sync-hr/index.page',
      })
    },

    goGeolocationPage() {
      push({
        url: 'page/common/home/sync-geolocation/index.page',
      })
    },

    onDestroy() {
      logger.log('page onDestroy invoked')
    },
  }
  ),
)
