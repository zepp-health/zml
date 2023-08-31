import { BaseSideService } from '@zeppos/zml/base-side'
import { settingsLib } from '@zeppos/zml/base-side'

import { fileDownloadModule } from './file-download-module'
import { fileTransferModule } from './file-transfer-module'
import { fetchModule } from './fetch-module'
import { settingsModule } from './settings-module'
import { imageConvertModule } from './image-convert-module'

const logger = Logger.getLogger('test-message-app-side')

const state = {}

AppSideService(
  BaseSideService({
    state: {},
    ...settingsModule,
    ...fetchModule,
    ...fileDownloadModule,
    ...imageConvertModule,
    ...fileTransferModule,
    onInit() {
      logger.log('app side service invoke onInit')
    },
    onRun() {
      logger.log('app side service invoke onRun')
    },
    onDestroy() {
      logger.log('app side service invoke onDestroy')
    },
    onReceivedFile(file) {
      logger.log('received file:=> %j', file)

      fs.read(file.fileName).then(result => {
        logger.log('read file content', Buffer.from(result).toString('hex'))
      }).then(() => {
        return fs.remove(file.fileName)
      }).then(() => {
        logger.log('remove file ok')
      }).then(() => {
        return fs.read(file.fileName).then(res => {
          logger.log('read file content again', res)
        }).catch((e) => {
          logger.log('read again file error', e)
        })
      }).then(() => {
        return fs.remove(file.fileName).then(() => {
          logger.log('remove again file ok')
        }).catch(e => {
          logger.log('remove again file error', e)
        })
      })
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
      logger.log(key, newValue, oldValue)
      logger.log(
        'app side service invoke onSettingsChange',
        key,
        newValue,
        oldValue,
      )
      switch (key) {
        case 'data:clear': {
          settingsLib.clear()
          break
        }
        case 'downloadFile:start': {
          state.task1 = this.testDownloadFile1()
          state.task2 = this.testDownloadFile2()
          state.task3 = this.testDownloadFile3()
          break
        }
        case 'downloadFile:stop': {
          state.task1.cancel()
          state.task2.cancel()
          state.task3.cancel()
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
          state.fileTransferTask3 = this.testTransferFile3()
          break
        }
        case 'sideTransfer:stop': {
          state.fileTransferTask1.cancel()
          state.fileTransferTask2.cancel()
          state.fileTransferTask3.cancel()
          break
        }
        case 'app:start': {
          system.openDeviceAppPage({
            // path: 'page/common/home/index/index.page',
            index: 0,
            params: 'test=1'
          })
          break
        }
        default: {
          logger.error('not implemented', key, newValue, oldValue)
        }
      }
    },
  }),
)
