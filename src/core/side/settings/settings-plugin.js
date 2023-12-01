import { settingsLib } from './side-settings.js'

export function settingsPlugin() {
	return {
		onInit() {
			this.settings = settingsLib
      this._onSettingsChange = this.onSettingsChange?.bind(this)
      settingsLib.onChange(this._onSettingsChange)

			if (typeof sideService !== 'undefined') {
        if (sideService.launchReasons.settingsChanged) {
          this._onSettingsChange(sideService.launchArgs)
        }
			}
		},
		onDestroy() {
			if (this._onSettingsChange) {
        settingsLib.offChange(this._onSettingsChange)
      }
		}
	}
}

export {
	settingsLib
}

export const API_LEVEL = __API_LEVEL__