import { fileTransferLib } from './device-file-transfer.js'

export function appPlugin(opts) {
  return {
    onCreate() {
      this.globalData.fileTransferLib = fileTransferLib
      fileTransferLib.onFile(this.onReceivedFile?.bind(this))
    },
    onDestroy() {
      fileTransferLib.offFile()
    },
    sendFile(path, opts) {
      return fileTransferLib.sendFile(path, opts)
    },
  }
}

export const API_LEVEL = __API_LEVEL__
