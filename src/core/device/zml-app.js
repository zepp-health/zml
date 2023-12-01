import { BaseApp } from './base-app.js'
import { appPlugin as globalPlugin } from './global/app-plugin.js'
import { appPlugin as disposablePlugin } from './disposable/app-plugin.js'
import { loggerPlugin } from './logger/logger-plugin.js'
import { appPlugin as messagingPlugin } from './messaging/app-plugin.js'
import { appPlugin as fileTransferPlugin } from './file-transfer/fileTransfer-plugin.js'

BaseApp
  .use(globalPlugin)
  .use(disposablePlugin)
  .use(loggerPlugin)
  .use(messagingPlugin)
  .use(fileTransferPlugin)

export { BaseApp }
