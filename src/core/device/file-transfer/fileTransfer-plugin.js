import { fileTransferLib } from './device-file-transfer'

export function appPlugin(opts) {
	return {
		onCreate() {
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

export function pagePlugin(opts) {
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