import { BasePage } from '@zeppos/zml/base-page'
import { layout } from 'zosLoader:./index.[pf].layout.js'

Page(
  BasePage({
    name: 'ble-fileTransfer.page',
    state: {
      file: '',
    },
    build() {
      this.log('page build invoked')
      layout.render(this)
    },

    onInit() {
      this.log('page onInit invoked')
      // this.log('transferFile =>', typeof ble.transferFile)
    },

    onDestroy() {
      this.log('page onDestroy invoked')
    },

    fileToSide() {
      const file = this.sendFile('data://download/logo.png')
      this.state.file = file

      file.on('progress', (progress) => {
        this.log('progress=> %j', progress)
        layout.updateProgress({
          fileName: file.fileName,
          progress: Math.round(
            (progress.data.loadedSize / progress.data.fileSize) * 100,
          ),
        })
      })
      return file
    },

    cancelFile() {
      if (this.state.file) {
        this.state.file.cancel()
        this.state.file = null
      }
    },

    onReceivedFile(file) {
      this.log('file received %s', file.toString())
      this.state.file = file

      file.on('progress', (progress) => {
        this.log('file progress => %j', {
          totalSize: progress.data.fileSize,
          loadedSize: progress.data.loadedSize,
        })

        layout.updateProgress({
          fileName: file.fileName,
          progress: Math.round(
            (progress.data.loadedSize / progress.data.fileSize) * 100,
          ),
        })
      })

      file.on('change', (event) => {
        this.log('file status =>', event.data.readyState)
        if (event.data.readyState === 'transferred') {
          layout.updateTxtSuccess(JSON.stringify(file))
          const userData = file.params
          if (userData.type === 'image') {
            layout.updateImgSrc(file.filePath)
          }
        }
      })
    },
  }),
)
