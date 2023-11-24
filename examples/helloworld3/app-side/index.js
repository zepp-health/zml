import { BaseSideService } from '@zeppos/zml/base-side'
import { fileDownloadModule } from './file-download-module'
import { fileTransferModule } from './file-transfer-module'
import { fetchModule } from './fetch-module'
import { settingsModule } from './settings-module'
import { imageConvertModule } from './image-convert-module'

const state = {}

AppSideService(
  BaseSideService({
    ...settingsModule,
    ...fetchModule,
    ...fileDownloadModule,
    ...imageConvertModule,
    ...fileTransferModule,
    onInit() {
      this.log('app side service invoke onInit')
    },
    onRun() {
      this.log('app side service invoke onRun')
    },
    onDestroy() {
      this.log('app side service invoke onDestroy')
    },
    onReceivedFile(file) {
      this.log('received file:=> %j', file)
    },
    onRequest(req, res) {
      const [module, action] = req.method.split('.')

      switch (action) {
        case 'read': {
          this.testGetHtml2().then(
            (result) => {
              res(null, {
                status: 'success',
                data: result,
              })
            },
            (e) => {
              res(e)
            },
          )
          break
        }
        default: {
          res({
            status: 'error',
            message: 'unknown action',
          })
        }
      }
    },
    onSettingsChange({ key, newValue, oldValue }) {
      this.log(key, newValue, oldValue)
      this.log(
        'app side service invoke onSettingsChange',
        key,
        newValue,
        oldValue,
      )
      switch (key) {
        case 'data:clear': {
          this.settings.clear()
          break
        }
        case 'downloadFile:start': {
          state.task1 = this.testDownloadFile1()
          state.task2 = this.testDownloadFile2()
          break
        }
        case 'downloadFile:stop': {
          state.task1.cancel()
          state.task2.cancel()
          break
        }
        case 'convertImage:start': {
          this.testConvertImage1()
          this.testConvertImage2()
          break
        }
        case 'sideTransfer:start': {
          state.fileTransferTask1 = this.testTransferFile1()
          state.fileTransferTask2 = this.testTransferFile2()
          break
        }
        case 'sideTransfer:stop': {
          state.fileTransferTask1.cancel()
          state.fileTransferTask2.cancel()
          break
        }
        default: {
          this.error('not implemented', key, newValue, oldValue)
        }
      }
    },
  }),
)
