import { BasePage } from '@zeppos/zml/base-page'
import { layout } from 'zosLoader:./index.[pf].layout.js'


Page(
  BasePage({
    name: 'ble-sendData.page',
    state: {},
    build() {
      this.log('page build invoked')
      layout.render(this)
    },

    onInit() {
      this.log('page onInit invoked')
    },

    readAsync() {
      return this.request({
        method: 'test.read',
        params: {
          start: 1,
        },
      })
        .then((result) => {
          layout.updateTxtSuccess(result.data)
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
