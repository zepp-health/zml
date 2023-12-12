import { BaseSideService } from './base-side-service.js'
import { messagingPlugin } from './messaging/messaging-plugin.js'
import { fileTransferPlugin } from './file-transfer/file-transfer-plugin.js'
import { downloadPlugin } from './download/download-plugin.js'
import { convertPlugin, convertLib } from './convert-image/convert-image-plugin.js'
import { settingsLib } from './settings/settings-plugin.js'

BaseSideService
  .use(messagingPlugin)
  .use(fileTransferPlugin)
  .use(downloadPlugin)
  .use(convertPlugin)

export { BaseSideService, convertLib, settingsLib }
