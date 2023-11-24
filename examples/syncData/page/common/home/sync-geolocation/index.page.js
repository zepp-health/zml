import { BasePage } from '@zeppos/zml/base-page'
import { layout } from 'zosLoader:./index.[pf].layout.js'
import { Geolocation } from '@zos/sensor'
import { url } from '../const'

const geolocation = new Geolocation()

Page(
  BasePage({
    name: 'sync-data-geolocation.page',
    state: {},
    build() {
      this.log('page build invoked')
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

      this.log('page onInit invoked')
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
