import { MessageBuilder } from '../../../shared/message.js'
import { wrapperMessage } from '../../common/message.js'

const messageBuilder = new MessageBuilder()

export const messaging = wrapperMessage(messageBuilder)
