import { BasePage } from '@zeppos/zml/base-page'
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
      this.log('page onInit invoked')
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
      this.log('page onDestroy invoked')
    },
  }
  ),
)
