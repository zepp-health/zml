import { BasePage } from './base-page.js'
import { pagePlugin as globalPlugin } from './global/page-plugin.js'
import { loggerPlugin } from './logger/logger-plugin.js'
import { pagePlugin as messagingPlugin } from './messaging/page-plugin.js'
import { pagePlugin as fileTransferPlugin } from './file-transfer/fileTransfer-plugin.js'

BasePage
  .use(globalPlugin)
  .use(loggerPlugin)
  .use(messagingPlugin)
  .use(fileTransferPlugin)

export { BasePage }
