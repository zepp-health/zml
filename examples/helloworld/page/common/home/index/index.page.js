import { BasePage } from '@zeppos/zml/base-page'
import { log as Logger } from '@zos/utils'
import { layout } from 'zosLoader:./index.[pf].layout.js'
import { setLaunchAppTimeout, push, exit } from '@zos/router'
import { Time } from '@zos/sensor'
import { getPackageInfo } from '@zos/app'

const time = new Time()

const logger = Logger.getLogger('index.page')

Page(
  BasePage(
  {
    name: 'index.page',
    state: {
      a: 1
    },
    build() {
      layout.render(this)
    },

    onInit() {
      logger.log('page onInit invoked')
    },

    goBlePage() {
      push({
        url: 'page/common/home/ble-data-send/index.page',
      })
    },

    goBleHttp() {
      push({
        url: 'page/common/home/ble-http-proxy/index.page',
      })
    },

    goFilePage() {
      push({
        url: 'page/common/home/ble-file-transfer/index.page',
      })
    },

    onDestroy() {
      logger.log('page onDestroy invoked')
    },
  }
  ),
)
