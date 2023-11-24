import { settings } from './side-settings'

export function settingsPlugin() {
	return {
		onInit() {
			this.settings = settings
      this._onSettingsChange = this.onSettingsChange?.bind(this)
      settings.onChange(this._onSettingsChange)

			if (typeof sideService !== 'undefined') {
        if (sideService.launchReasons.settingsChanged) {
          this._onSettingsChange(sideService.launchArgs)
        }
			}
		},
		onDestroy() {
			if (this._onSettingsChange) {
        settings.offChange(this._onSettingsChange)
      }
		}
	}
}

export const API_LEVEL = __API_LEVEL__