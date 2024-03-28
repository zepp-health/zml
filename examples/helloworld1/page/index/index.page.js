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

    downloadYourFile() {
      return this.download('https://www.example.com/fileName.mp3')
        .then((result) => {
          console.log('file downloaded successfully')
        })
        .catch((error) => {
          console.error('Error while downloading file=>', error)
        })
    },

    receiveYourFile() {
      return this.receiveFile('data://download/fileName.mp3', {
        type: 'mp3',
        name: 'data://download/fileName.mp3'
      })
        .then((result) => {
          console.log('file transferred successfully')
        })
        .catch((error) => {
          console.error('Error while transferring file=>', error)
        })
    },

    downloadAndTransferYourFile() {
      return this.download('data://download/fileName.mp3', {
        transfer: {
          path: 'data://download/fileName.mp3',
          opts: {
            type: 'mp3',
            name: 'data://download/fileName.mp3'
          }
        }
      })
        .then((result) => {
          console.log('file downloaded and transferred successfully')
        })
        .catch((error) => {
          console.error('Error while downloading/transferring file=>', error)
        })
    },

    getSettings() {
      return this.getSettings(['setting1', 'setting2'])
        .then((result) => {
          console.log('settings received successfully')
          const settings1 = result.settings1
          const settings2 = result.settings2
        })
        .catch((error) => {
          console.error('Error while retrieving settings=>', error)
        })
    },
    onDestroy() {
      this.log('page onDestroy invoked')
    },
  }),
)
