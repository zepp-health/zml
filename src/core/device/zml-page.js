import { BasePage } from './base-page'
import { loggerPlugin } from './logger/logger-plugin'
import { pagePlugin as messagingPlugin } from './messaging/page-plugin'
import { pagePlugin as fileTransferPlugin } from './file-transfer/fileTransfer-plugin'

BasePage.use(loggerPlugin).use(messagingPlugin).use(fileTransferPlugin)

export { BasePage }
