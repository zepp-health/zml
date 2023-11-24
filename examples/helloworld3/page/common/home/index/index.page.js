import { BasePage } from '@zeppos/zml/base-page'
import { layout } from 'zosLoader:./index.[pf].layout.js'
import { push } from '@zos/router'

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
    },
  }
  ),
)
