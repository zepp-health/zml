import { BasePage } from '@zeppos/zml/base-page'
import { layout } from 'zosLoader:./index.[pf].layout.js'
import { HeartRate } from '@zos/sensor'
import { url } from '../const'

const heartRate = new HeartRate()

Page(
  BasePage({
    name: 'sync-data-hr.page',
    state: {},
    build() {
      this.log('page build invoked')
      layout.render(this)
    },

    onInit() {
      const callback = () => {
        const d = heartRate.getCurrent()
        this.syncData({
          hr: d
        })
      }

      heartRate.onCurrentChange(callback)
      this.log('page onInit invoked')
    },

    syncData(data) {
      layout.updateTxtUploading()

      this.httpRequest({
        method: 'post',
        url: `${url}/hr`,
        body: data,
      })
        .then((result) => {
          layout.updateTxtSuccess()
          this.log('result=>%j', result)
        })
        .catch((error) => {
          layout.updateTxtError()
          this.error('error=>%j', error)
        })
    },

    onDestroy() {
      this.log('page onDestroy invoked')
    },
  }),
)