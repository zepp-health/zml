import { BasePage } from './base-page.js'
import { pagePlugin as globalPlugin } from './global/page-plugin.js'
import { pagePlugin as messagingPlugin } from './messaging/page-plugin.js'
import { pagePlugin as fileTransferPlugin } from './file-transfer/page-plugin.js'

BasePage.use(globalPlugin).use(messagingPlugin).use(fileTransferPlugin)

export { BasePage }
