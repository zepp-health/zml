import { Logger } from '../../shared/logger.js'
import { isZeppOS } from '../../shared/platform.js'
import { MessagePayloadDataTypeOp } from '../../shared/message.js'
import { buf2str, buf2json, buf2bin } from '../../shared/data.js'
import { isPlainObject } from '../../shared/utils.js'
import { CallbackSet } from './callback-set.js'

const logger = Logger.getLogger('message-builder')

const shakeTimeout = 5000
const requestTimeout = 60000

const DEBUG = __DEBUG__

const HM_RPC = 'hmrpcv1'

const onCalls = new CallbackSet()
const onRequests = new CallbackSet()
const onBleChanges = new CallbackSet()

export function wrapperMessage(messageBuilder) {
  return {
    shakeTimeout,
    requestTimeout,
    transport: messageBuilder,
    onCall(cb) {
      if (!cb) return this
      DEBUG && logger.debug('register call handler=>%s', cb.toString())
      onCalls.add(cb)
      return this
    },
    offOnCall(cb) {
      onCalls.remove(cb)
      DEBUG &&
        logger.debug(
          'unregister call handler=>%s',
          (cb ?? 'undefined').toString(),
        )
      return this
    },
    call(data) {
      isZeppOS() && messageBuilder.fork(this.shakeTimeout)
      data = isPlainObject(data)
        ? data.contentType
          ? data
          : {
              jsonrpc: HM_RPC,
              ...data,
            }
        : data
      return messageBuilder.call(data)
    },
    onRequest(cb) {
      if (!cb) return this
      onRequests.add(cb)
      return this
    },
    initOnCall() {
      messageBuilder.on('call', ({ contentType, payload }) => {
        switch (contentType) {
          case MessagePayloadDataTypeOp.JSON:
            payload = buf2json(payload)
            break
          case MessagePayloadDataTypeOp.TEXT:
            payload = buf2str(payload)
            break
          case MessagePayloadDataTypeOp.BIN:
          default:
            payload = buf2bin(payload)
            break
        }

        DEBUG && logger.debug('onCall data=>%s', payload)
        onCalls.runAll(payload)
      })
    },
    initOnRequest() {
      messageBuilder.on('request', (ctx) => {
        let payload = ctx.request.payload

        switch (ctx.request.contentType) {
          case MessagePayloadDataTypeOp.JSON:
            payload = buf2json(payload)
            break
          case MessagePayloadDataTypeOp.TEXT:
            payload = buf2str(payload)
            break
          case MessagePayloadDataTypeOp.BIN:
          default:
            payload = buf2bin(payload)
            break
        }

        DEBUG && logger.debug('request data=>%s', payload)
        onRequests.runAll(payload, (error, data, opts = {}) => {
          if (
            ctx.request.contentType === MessagePayloadDataTypeOp.JSON &&
            payload?.jsonrpc === HM_RPC
          ) {
            if (error) {
              return ctx.response({
                data: {
                  jsonrpc: HM_RPC,
                  error,
                },
              })
            }

            return ctx.response({
              data: {
                jsonrpc: HM_RPC,
                result: data,
              },
            })
          }

          return ctx.response({
            data,
            ...opts,
          })
        })
      })
    },
    cancelAllRequest() {
      messageBuilder.off('response')
      return this
    },
    offOnRequest(cb) {
      onRequests.remove(cb)
      return this
    },
    request(data, opts = {}) {
      isZeppOS() && messageBuilder.fork(this.shakeTimeout)
      DEBUG &&
        logger.debug(
          'current request count=>%d',
          messageBuilder.getRequestCount(),
        )

      data = isPlainObject(data)
        ? opts.contentType
          ? data
          : {
              jsonrpc: HM_RPC,
              ...data,
            }
        : data

      return messageBuilder
        .request(data, {
          timeout: this.requestTimeout,
          ...opts,
        })
        .then((payload) => {
          if (!isPlainObject(payload) || payload.jsonrpc !== HM_RPC) {
            return payload
          }

          // hmrpc
          const { error, result } = payload
          if (error) {
            throw error
          }

          return result
        })
    },
    // 设备接口
    connect() {
      messageBuilder.connect(() => {
        DEBUG &&
          logger.debug('DeviceApp messageBuilder connect with SideService')

        this.initOnCall()
        this.initOnRequest()
        this.initOnBleChanged()
      })
    },
    initOnBleChanged() {
      messageBuilder.on('bleStatusChanged', (status) => {
        onBleChanges.runAll(status)
      })
      return this
    },
    onBleChanged(cb) {
      if (!cb) return this
      onBleChanges.add(cb)
      return this
    },
    offOnBleChanged(cb) {
      onBleChanges.remove(cb)
      return this
    },
    disConnect() {
      this.cancelAllRequest()
      this.offOnRequest()
      this.offOnCall()
      this.offOnBleChanged()
      messageBuilder.disConnect(() => {
        DEBUG && logger.debug('DeviceApp messageBuilder disconnect SideService')
      })
      return this
    },
    // 伴生服务接口
    start() {
      messageBuilder.listen(() => {
        DEBUG &&
          logger.debug(
            'SideService messageBuilder start to listen to DeviceApp',
          )
        this.initOnCall()
        this.initOnRequest()
      })
      return this
    },
    stop() {
      this.cancelAllRequest()
      this.offOnRequest()
      this.offOnCall()
      messageBuilder.disConnect(() => {
        DEBUG &&
          logger.debug('SideService messageBuilder stop to listen to DeviceApp')
      })
      return this
    },
  }
}
