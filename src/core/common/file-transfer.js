export function getFileTransfer(fileTransfer) {
  /**
   *     start(newfile)------------finished(file)
   *     device supported newfile and file
   *     side supported file
   */
  return {
    canUseFileTransfer() {
      if (typeof fileTransfer === 'undefined') {
        console.log('WARNING: FileTransfer require API_LEVEL 3.0')
        return false
      }
      return true
    },
    onFile(cb) {
      if (!cb) {
        return this
      }

      if (!this.canUseFileTransfer()) {
        return this
      }

      // at file task start
      fileTransfer.inbox.on('newfile', function () {
        const file = fileTransfer.inbox.getNextFile()
        cb && cb(file)
      })

      return this
    },
    onSideServiceFileFinished(cb) {
      if (!cb) {
        return this
      }

      if (!this.canUseFileTransfer()) {
        return this
      }

      // at file task finished
      fileTransfer.inbox.on('file', function () {
        const file = fileTransfer.inbox.getNextFile()
        cb && cb(file)
      })
      return this
    },
    emitFile() {
      fileTransfer.inbox.emit('file')
      return this
    },
    offFile() {
      if (!this.canUseFileTransfer()) {
        return this
      }

      fileTransfer.inbox.off('newfile')
      fileTransfer.inbox.off('file')
      return this
    },
    getFile() {
      if (!this.canUseFileTransfer()) {
        return null
      }

      return fileTransfer.inbox.getNextFile()
    },
    sendFile(path, opts) {
      if (!this.canUseFileTransfer()) {
        throw new Error('fileTransfer is not available')
      }

      return fileTransfer.outbox.enqueueFile(path, opts)
    },
  }
}
