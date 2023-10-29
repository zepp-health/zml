import { BasePage } from '@zeppos/zml/base-page'
import { log as Logger } from '@zos/utils'
import { layout } from 'zosLoader:./index.[pf].layout.js'
import { HeartRate } from '@zos/sensor'

const logger = Logger.getLogger('sync-data.page')
const heartRate = new HeartRate()

Page(
  BasePage({
    name: 'sync-data.page',
    state: {},
    build() {
      logger.log('page build invoked')
      layout.render(this)
    },

    onInit() {
      const callback = () => {
        layout.updateTxtUploading()

        const d = heartRate.getCurrent()
        this.syncData(d)
      }

      heartRate.onCurrentChange(callback)
      logger.log('page onInit invoked')
    },

    syncData(data) {
      return this.httpRequest({
        method: 'post',
        url: 'your Service',
        body: {
          data
        },
      })
        .then((result) => {
          layout.updateTxtSuccess()
          logger.log('result=>%j', result)
        })
        .catch((error) => {
          layout.updateTxtError()
          logger.error('error=>%j', error)
        })
    },

    onDestroy() {
      logger.log('page onDestroy invoked')
    },
  }),
)
