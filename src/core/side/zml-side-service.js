import { BaseSideService } from './base-side-service'
import { loggerPlugin } from './logger/logger-plugin'
import { messagingPlugin } from './messaging/messaging-plugin'
import { fileTransferPlugin } from './file-transfer/file-transfer-plugin'
import { downloadPlugin } from './download/download-plugin'
import { convertPlugin } from './convert-image/convert-image-plugin'
import { settingsPlugin } from './settings/settings-plugin'

BaseSideService.use(loggerPlugin)
  .use(settingsPlugin)
  .use(messagingPlugin)
  .use(fileTransferPlugin)
  .use(downloadPlugin)
  .use(convertPlugin)

export { BaseSideService }
