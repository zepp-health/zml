export function loggerPlugin() {
	return {
		onInit() {
		  this.logger = Logger.getLogger(sideService.appInfo.app.appName)
			this.logger.scope = sideService.appInfo.app.appName
			this.logger.name = "side-service"
			this.log = (...args) => {
				this.logger.log(...args)
			}
			this.error = (...args) => {
				if (args[0] instanceof Error) {
					this.logger.error(...args)
				} else {
					this.logger.error({}, ...args)
				}
			}
			this.debug = (...args) => {
				this.logger.debug(...args)
			}
		},
	}
}

export const API_LEVEL = __API_LEVEL__