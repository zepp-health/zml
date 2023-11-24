import { Logger } from "../../../shared/logger"

export function loggerPlugin() {
	return {
		onInit() {
			this.logger = Logger.getLogger(this.name || "Page")
			this.log = (...args) => {
				this.logger.log(...args)
			}
			this.error = (...args) => {
				this.logger.error(...args)
			}
			this.debug = (...args) => {
				this.logger.debug(...args)
			}
		},
		onCreate() {
			this.logger =Logger.getLogger(this.name || "app.js")
			this.log = (...args) => {
				this.logger.log(...args)
			}
			this.error = (...args) => {
				this.logger.error(...args)
			}
			this.debug = (...args) => {
				this.logger.debug(...args)
			}
		},
	}
}

export const API_LEVEL = __API_LEVEL__