import { BasePage } from '@zeppos/zml/base-page'
import { layout } from 'zosLoader:./index.[pf].layout.js'

Page(
  BasePage({
    name: 'ble-http-proxy.page',
    state: {},
    build() {
      this.log('page build invoked')
      layout.render(this)
    },

    onInit() {
      this.log('page onInit invoked')
    },

    readAsync() {
      return this.httpRequest({
        method: 'get',
        url: 'https://bible-api.com/john%203:16',
      })
        .then((result) => {
          layout.updateTxtSuccess(result.body.text)
          this.log('result=>%j', result)
        })
        .catch((error) => {
          layout.updateTxtError(error.message)
          this.error('error=>%j', error)
        })
    },

    onDestroy() {
      this.log('page onDestroy invoked')
    },
  }),
)
