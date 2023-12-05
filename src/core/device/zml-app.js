import { BaseApp } from './base-app.js'
import { loggerPlugin } from './logger/logger-plugin.js'
import { appPlugin as messagingPlugin } from './messaging/app-plugin.js'
import { appPlugin as fileTransferPlugin } from './file-transfer/fileTransfer-plugin.js'

BaseApp
  .use(loggerPlugin)
  .use(messagingPlugin)
  .use(fileTransferPlugin)

export { BaseApp }
