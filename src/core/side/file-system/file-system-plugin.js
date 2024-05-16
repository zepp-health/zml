import { fileSystem } from './file-system'

export function fileSystemPlugin() {
  return {
    onInit() {
      // app-setting select file event
      this._onInputFile = this.onInputFile?.bind(this)

      if (typeof sideService !== 'undefined') {
        if (sideService.launchReasons.inputFile) {
          this._onInputFile(sideService.launchArgs)
        }
      }

      if (typeof fs !== 'undefined') {
				fileSystem.onInputFile(this._onInputFile)
      }
    },
    onDestroy() {
      if (typeof fs !== 'undefined') {
        if (this._onInputFile) {
					fileSystem.offInputFile(this._onInputFile)
          this._onInputFile = null
        }
      }
    },
  }
}

export const API_LEVEL = __API_LEVEL__
