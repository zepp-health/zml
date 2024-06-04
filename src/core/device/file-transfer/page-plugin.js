function getFileTransferLib() {
  const { fileTransferLib } = getApp()._options.globalData
  return fileTransferLib
}

export function pagePlugin(opts) {
  const fileTransferLib = getFileTransferLib()
  return {
    onInit() {
      this._onReceivedFile = this.onReceivedFile?.bind(this)
      fileTransferLib.onFile(this._onReceivedFile)
    },
    onDestroy() {
      if (this._onReceivedFile) {
        fileTransferLib.offFile(this._onReceivedFile)
      }
    },
    sendFile(path, opts) {
      return fileTransferLib.sendFile(path, opts)
    },
  }
}

export const API_LEVEL = __API_LEVEL__
