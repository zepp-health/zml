import { BaseApp } from './base-app'
import { loggerPlugin } from './logger/logger-plugin'
import { appPlugin as messagingPlugin } from './messaging/app-plugin'
import { appPlugin as fileTransferApp } from './file-transfer/fileTransfer-plugin'
import { appPlugin as bgServicePlugin } from './bg-service/bg-service-plugin'

BaseApp.use(loggerPlugin).use(messagingPlugin).use(fileTransferApp).use(bgServicePlugin)

export { BaseApp }
