import { BasePage } from '@zeppos/zml/base-page'
import { layout } from 'zosLoader:./index.[pf].layout.js'

Page(
  BasePage({
    name: 'index.page',
    state: {},
    build() {
      layout.render(this)
    },

    onInit() {
      this.log('page onInit invoked')
    },

    getDataFromNetwork() {
      this.httpRequest({
        method: 'get',
        url: 'https://bible-api.com/john%203:16',
      }).then((result) => {
        this.log('result.status=>', JSON.stringify(result.status))
        this.log('result.statusText=>', JSON.stringify(result.statusText))
        this.log('result.headers=>', JSON.stringify(result.headers))
        this.log('result.body=>', JSON.stringify(result.body))
      })
    },

    onDestroy() {
      this.log('page onDestroy invoked')
    },
  }),
)
