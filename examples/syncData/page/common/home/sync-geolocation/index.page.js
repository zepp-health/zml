import { BasePage } from '@zeppos/zml/base-page'
import { log as Logger } from '@zos/utils'
import { layout } from 'zosLoader:./index.[pf].layout.js'
import { Geolocation } from '@zos/sensor'
import { url } from '../const'

const logger = Logger.getLogger('sync-data-geolocation.page')
const geolocation = new Geolocation()

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
        console.log('pos_status', geolocation.getStatus())

        const lat = geolocation.getLatitude()
        const long = geolocation.getLongitude()

        this.syncData({
          lat,
          long
        })
      }

      geolocation.start()
      geolocation.onChange(callback)

      logger.log('page onInit invoked')
    },

    syncData(data) {
      layout.updateTxtUploading()
      return this.httpRequest({
        method: 'post',
        url: `${url}/pos`,
        body: data,
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
