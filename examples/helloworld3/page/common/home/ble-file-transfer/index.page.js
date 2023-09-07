import { BasePage } from '@zeppos/zml/base-page'
import { log as Logger } from '@zos/utils'
import { layout } from 'zosLoader:./index.[pf].layout.js'
import * as media from '@zos/media'
// import { __getNativeModules } from '@zos/unsafe'
// const [ble] = __getNativeModules('hmBle')

const logger = Logger.getLogger('ble-fileTransfer.page')

function createPlayer(path) {
  const player = media.create(media.id.PLAYER)
  player.setSource(player.source.FILE, { file: path })

  player.addEventListener(player.event.PREPARE, function (result) {
    if (result) {
      logger.log('=== prepare succeed ===', player.getTitle())
      logger.log(
        '=== player info === %s %s',
        player.getTitle(),
        player.getArtist(),
      )
      player.start()
    } else {
      console.log('=== prepare fail ===')
      player.release()
    }
  })

  player.prepare()
  return player
}

Page(
  BasePage({
    name: 'ble.page',
    state: {
      file: '',
    },
    build() {
      logger.log('page build invoked')
      layout.render(this)
    },

    onInit() {
      logger.log('page onInit invoked')
      // logger.log('transferFile =>', typeof ble.transferFile)
    },

    onDestroy() {
      logger.log('page onDestroy invoked')
    },

    fileToSide() {
      const file = this.sendFile('data://download/logo.png')
      this.state.file = file

      file.on('progress', (progress) => {
        logger.log('progress=> %j', progress)
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
      logger.log('file received %s', file.toString())
      this.state.file = file

      file.on('progress', (progress) => {
        logger.log('file progress => %j', {
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
        logger.log('file status =>', event.data.readyState)
        if (event.data.readyState === 'transferred') {
          layout.updateTxtSuccess(JSON.stringify(file))
          const userData = file.params
          if (userData.type === 'image') {
            layout.updateImgSrc(file.filePath)
          } else if (userData.type === 'mp3') {
            createPlayer(file.filePath)
          }
        }
      })
    },
  }),
)
