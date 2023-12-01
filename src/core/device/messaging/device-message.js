import { MessageBuilder } from '../../../shared/message.js'
import { wrapperMessage } from '../../common/message.js'
import { getPackageInfo } from '../../common/common.js'

const appDevicePort = 20
const appSidePort = 0

export function createDeviceMessage() {
  const messageBuilder = new MessageBuilder({
    appId: getPackageInfo().appId,
    appDevicePort,
    appSidePort,
  })

  return wrapperMessage(messageBuilder)
}


