import { BaseSideService } from './base-side-service.js'
import { loggerPlugin } from './logger/logger-plugin.js'
import { messagingPlugin } from './messaging/messaging-plugin.js'
import { fileTransferPlugin } from './file-transfer/file-transfer-plugin.js'
import { downloadPlugin } from './download/download-plugin.js'
import { convertPlugin, convertLib } from './convert-image/convert-image-plugin.js'
import { settingsPlugin, settingsLib } from './settings/settings-plugin.js'

BaseSideService.use(loggerPlugin)
  .use(settingsPlugin)
  .use(messagingPlugin)
  .use(fileTransferPlugin)
  .use(downloadPlugin)
  .use(convertPlugin)

export { BaseSideService, convertLib, settingsLib }
