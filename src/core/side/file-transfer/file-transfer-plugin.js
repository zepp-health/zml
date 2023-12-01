import { fileTransferLib } from './side-file-transfer.js'

export function fileTransferPlugin () {
	return {
		onInit(){
			this._onReceivedFile = this.onReceivedFile?.bind(this)
      fileTransferLib.onSideServiceFileFinished(this._onReceivedFile)

			if (typeof sideService !== 'undefined') {
        if (sideService.launchReasons.fileTransfer) {
          fileTransferLib.emitFile()
        }
      }
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