import { Logger } from './logger.js'
import { EventBus } from './event.js'
import { Deferred } from './defer.js'
import { nativeBle } from './ble.js'
import { json2buf, buf2json, bin2hex, buf2str, str2buf } from './data.js'
import { isZeppOS } from '../core/common/common.js'
import { setTimeout, clearTimeout } from './setTimeout.js'
import { Promise } from './promise.js'
import { Buffer } from './buffer.js'
import { isPlainObject } from './utils.js'

const logger = isZeppOS()
  ? Logger.getLogger('device-message')
  : Logger.getLogger('side-message')

const DEBUG = __DEBUG__

export const MESSAGE_SIZE = 3600
export const MESSAGE_HEADER = 16
export const MESSAGE_PAYLOAD = MESSAGE_SIZE - MESSAGE_HEADER
export const HM_MESSAGE_PROTO_HEADER = 66
export const HM_MESSAGE_PROTO_PAYLOAD =
  MESSAGE_PAYLOAD - HM_MESSAGE_PROTO_HEADER

export const MessageFlag = {
  Runtime: 0x0,
  App: 0x1,
}

export const MessageType = {
  Shake: 0x1,
  Close: 0x2,
  Heart: 0x3,
  Data: 0x4,
  DataWithSystemTool: 0x5,
  Log: 0x6,
}

export const MessageRuntimeType = {
  Invoke: 0x1,
}
export const MessageVersion = {
  Version1: 0x1,
}

export const MessagePayloadType = {
  Request: 0x1,
  Response: 0x2,
  Notify: 0x3,
}

export const DataType = {
  empty: 'empty',
  json: 'json',
  text: 'text',
  bin: 'bin',
}

export const MessagePayloadDataTypeOp = {
  EMPTY: 0x0,
  TEXT: 0x1,
  JSON: 0x2,
  BIN: 0x3,
}

export function getDataType(type) {
  switch (type.toLowerCase()) {
    case DataType.json:
      return MessagePayloadDataTypeOp.JSON
    case DataType.text:
      return MessagePayloadDataTypeOp.TEXT
    case DataType.bin:
      return MessagePayloadDataTypeOp.BIN
    case DataType.empty:
      return MessagePayloadDataTypeOp.EMPTY
    default:
      return MessagePayloadDataTypeOp.BIN
  }
}

// 中续，结束
export const MessagePayloadOpCode = {
  Continued: 0x0,
  Finished: 0x1,
}

let traceId = 10000
export function genTraceId() {
  const r = traceId++
  DEBUG && logger.debug('get requestId %d', r)
  return r
}

let spanId = 1000
export function genSpanId() {
  return spanId++
}

export function getTimestamp(t = Date.now()) {
  return t % 10000000
}

class Session extends EventBus {
  constructor(id, type, ctx) {
    super()
    this.id = id
    this.type = type // payloadType
    this.ctx = ctx
    this.chunks = []
    this.count = -1
    this.finishChunk = null
  }

  addChunk(payload) {
    if (payload.opCode === MessagePayloadOpCode.Finished) {
      this.count = payload.seqId + 1
      this.finishChunk = payload
    }

    if (payload.payloadLength !== payload.payload.byteLength) {
      DEBUG &&
        logger.error(
          'receive chunk data length error, expect %d but %d',
          payload.payloadLength,
          payload.payload.byteLength,
        )
      this.emit(
        'error',
        Error(
          `receive chunk data length error, expect ${payload.payloadLength} but ${payload.payload.byteLength}`,
        ),
      )
      return
    }

    this.chunks.push(payload)
    this.checkIfReceiveAllChunks()
  }

  checkIfReceiveAllChunks() {
    if (this.count !== this.chunks.length) return
    if (!this.finishChunk) return

    let bufList = []

    for (let i = 0; i < this.count; i++) {
      const chunk = this.chunks[i]

      if (!chunk || chunk.seqId !== i) {
        bufList = null
        this.releaseBuf()
        this.emit('error', Error('receive data error'))
        return
      }

      bufList.push(chunk.payload)
    }

    this.chunks = []
    this.finishChunk.payload = Buffer.concat(bufList)
    bufList = null

    this.finishChunk.payloadLength = this.finishChunk.payload.byteLength

    if (this.finishChunk.totalLength !== this.finishChunk.payloadLength) {
      DEBUG &&
        logger.error(
          'receive full data length error, expect %d but %d',
          this.finishChunk.payloadLength,
          this.finishChunk.payload.byteLength,
        )
      this.emit(
        'error',
        Error(
          `receive full data length error, expect ${this.finishChunk.payloadLength} but ${this.finishChunk.payload.byteLength}`,
        ),
      )
      return
    }

    this.emit('data', this.finishChunk)
  }

  releaseBuf() {
    this.chunks = []
    this.finishChunk = null
    this.count = 0
  }
}

class SessionMgr {
  constructor() {
    this.sessions = new Map()
  }

  key(session) {
    return `${session.id}:${session.type}`
  }

  newSession(id, type, ctx) {
    const newSession = new Session(id, type, ctx)
    this.sessions.set(this.key(newSession), newSession)
    return newSession
  }

  destroy(session) {
    session.releaseBuf()
    this.sessions.delete(this.key(session))
  }

  has(id, type) {
    return this.sessions.has(
      this.key({
        id,
        type,
      }),
    )
  }

  getById(id, type) {
    return this.sessions.get(
      this.key({
        id,
        type,
      }),
    )
  }

  clear() {
    this.sessions.clear()
  }
}

export const MessageErrorCode = {
  SUCCESS: 0,
  SHAKE_TIME_OUT: 1,
  BLE_CLOSE: 2,
  APP_CLOSE: 3,
  REQUEST_TIME_OUT: 4,
}

export const MessageShakeTimeOut = 5000

export class MessageError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
    this.reason = message
  }
}

export const ShakeStatus = {
  start: 1,
  pending: 2,
  success: 3,
  failure: 4,
}
export class MessageBuilder extends EventBus {
  constructor(
    {
      appId = 0,
      appDevicePort = 20,
      appSidePort = 0,
      ble = isZeppOS() ? nativeBle : undefined,
    } = {
      appId: 0,
      appDevicePort: 20,
      appSidePort: 0,
      ble: isZeppOS() ? nativeBle : undefined,
    },
  ) {
    super()
    this.isDevice = isZeppOS()
    this.isSide = !this.isDevice

    this.appId = appId
    this.appDevicePort = appDevicePort
    this.appSidePort = appSidePort
    this.ble = ble
    this.sendMsg = this.getSafeSend()
    this.chunkSize = MESSAGE_PAYLOAD
    this.handlers = new Map()

    this.shakeTask = null
    this.waitingShakePromise = null
    this.shakeStatus = ShakeStatus.start
    this.shakeTimer = 0

    this.sessionMgr = new SessionMgr()

    // 控制 response 的响应
    this.on('response', (resp) => {
      this.onResponse(resp)
    })

    ble?.addListener((status) => {
      DEBUG && logger.debug('ble change to=>', status)

      if (!status) {
        logger.error('ble disconnect')
        if (this.shakeTask) {
          this.shakeTask.reject(
            new MessageError(MessageErrorCode.BLE_CLOSE, 'ble disconnect'),
          )
          this.shakeStatus = ShakeStatus.failure
        }
      }
    })
  }

  fork(timeout = MessageShakeTimeOut) {
    if (this.shakeStatus === ShakeStatus.pending) {
      return this.waitingShakePromise
    }

    this.shakeTask = Deferred()
    this.waitingShakePromise = this.shakeTask.promise
    this.shakeStatus = ShakeStatus.start
    this.clearShakeTimer()

    this.shakeTimer = setTimeout(() => {
      this.shakeStatus = ShakeStatus.failure
      this.shakeTask.reject(
        new MessageError(MessageErrorCode.SHAKE_TIME_OUT, 'shake timeout'),
      )
    }, timeout)

    try {
      this.errorIfBleDisconnect()
    } catch (error) {
      logger.error('error ble disconnect %j', error)
      this.shakeTask.reject(
        new MessageError(MessageErrorCode.BLE_CLOSE, 'ble disconnect'),
      )
      this.shakeStatus = ShakeStatus.failure
      return this.waitingShakePromise
    }

    this.shakeStatus = ShakeStatus.pending
    this.sendShake()

    return this.waitingShakePromise
  }

  clearShakeTimer() {
    if (this.shakeTimer) {
      clearTimeout(this.shakeTimer)
    }

    this.shakeTimer = 0
  }

  getMessageSize() {
    return MESSAGE_SIZE
  }

  getMessagePayloadSize() {
    return MESSAGE_PAYLOAD
  }

  getMessageHeaderSize() {
    return MESSAGE_HEADER
  }

  buf2Json(buf) {
    return buf2json(buf)
  }

  json2Buf(json) {
    return json2buf(json)
  }

  now(t = Date.now()) {
    return getTimestamp(t)
  }

  connect(cb) {
    this.on('message', (message) => {
      this.onMessage(message)
    })

    this.ble &&
      this.ble.createConnect((index, data, size) => {
        DEBUG &&
          logger.warn(
            '[RAW] [R] receive index=>%d size=>%d bin=>%s',
            index,
            size,
            bin2hex(data),
          )
        this.onFragmentData(data)
      })

    cb && cb(this)
  }

  disConnect(cb) {
    DEBUG && logger.debug('app ble disconnect')
    this.sendClose()
    this.off('message')
    this.handlers.clear()
    this.ble && this.ble.disConnect()

    cb && cb(this)
  }

  listen(cb) {
    this.appSidePort = globalThis.getApp().port2
    messaging &&
      messaging.peerSocket.addListener('message', (message) => {
        DEBUG &&
          logger.warn(
            '[RAW] [R] receive size=>%d bin=>%s',
            message.byteLength,
            bin2hex(message),
          )
        this.onMessage(message)
      })

    this.waitingShakePromise = Promise.resolve()
    cb && cb(this)
  }

  buildBin(data) {
    if (data.payload.byteLength > this.chunkSize) {
      throw new Error(
        `${data.payload.byteLength} greater than max size of ${this.chunkSize}`,
      )
    }

    const size = this.getMessageHeaderSize() + data.payload.byteLength
    let buf = Buffer.alloc(size)
    let offset = 0

    buf.writeUInt8(data.flag, offset)
    offset += 1

    buf.writeUInt8(data.version, offset)
    offset += 1

    buf.writeUInt16LE(data.type, offset)
    offset += 2

    buf.writeUInt16LE(data.port1, offset)
    offset += 2

    buf.writeUInt16LE(data.port2, offset)
    offset += 2

    buf.writeUInt32LE(data.appId, offset)
    offset += 4

    buf.writeUInt32LE(data.extra, offset)
    offset += 4

    buf.fill(data.payload, offset, data.payload.byteLength + offset)

    return buf
  }

  buildShake() {
    return this.buildBin({
      flag: MessageFlag.App,
      version: MessageVersion.Version1,
      type: MessageType.Shake,
      port1: this.appDevicePort,
      port2: this.appSidePort,
      appId: this.appId,
      extra: 0,
      payload: Buffer.from([this.appId]),
    })
  }

  sendShake() {
    logger.info('shake send')
    const shake = this.buildShake()
    this.sendMsg(shake)
  }

  buildClose() {
    return this.buildBin({
      flag: MessageFlag.App,
      version: MessageVersion.Version1,
      type: MessageType.Close,
      port1: this.appDevicePort,
      port2: this.appSidePort,
      appId: this.appId,
      extra: 0,
      payload: Buffer.from([this.appId]),
    })
  }

  sendClose() {
    DEBUG && logger.info('close send')
    const close = this.buildClose()
    this.sendMsg(close)
  }

  readBin(arrayBuf) {
    const buf = Buffer.from(arrayBuf)
    let offset = 0

    const flag = buf.readUInt8(offset)
    offset += 1

    const version = buf.readUInt8(offset)
    offset += 1

    const type = buf.readUInt16LE(offset)
    offset += 2

    const port1 = buf.readUInt16LE(offset)
    offset += 2

    const port2 = buf.readUInt16LE(offset)
    offset += 2

    const appId = buf.readUInt32LE(offset)
    offset += 4

    const extra = buf.readUInt32LE(offset)
    offset += 4

    const payload = buf.subarray(offset)

    return {
      flag,
      version,
      type,
      port1,
      port2,
      appId,
      extra,
      payload,
    }
  }

  // opts 覆盖头部选项
  buildData(payload, opts = {}) {
    return this.buildBin({
      flag: MessageFlag.App,
      version: MessageVersion.Version1,
      type: MessageType.Data,
      port1: this.appDevicePort,
      port2: this.appSidePort,
      appId: this.appId,
      extra: 0,
      ...opts,
      payload,
    })
  }

  sendBin(buf, debug = DEBUG) {
    // ble 发送消息
    debug &&
      logger.warn(
        '[RAW] [S] send size=%d bin=%s',
        buf.byteLength,
        bin2hex(buf.buffer),
      )
    const result = this.ble.send(buf.buffer, buf.byteLength)

    if (!result) {
      throw Error('send message error')
    }
  }

  sendBinBySide(buf, debug = DEBUG) {
    // side 发送消息
    debug &&
      logger.warn(
        '[RAW] [S] send size=%d bin=%s',
        buf.byteLength,
        bin2hex(buf.buffer),
      )
    messaging.peerSocket.send(buf.buffer)
  }

  // 通用获取逻辑
  getSafeSend() {
    if (this.isDevice) {
      return this.sendBin.bind(this)
    } else {
      return this.sendBinBySide.bind(this)
    }
  }

  // 大数据的复杂头部分包协议
  sendHmProtocol(
    { requestId, dataBin, type, contentType, dataType },
    { messageType = MessageType.Data } = {},
  ) {
    const headerSize = 0
    const hmDataSize = HM_MESSAGE_PROTO_PAYLOAD
    const userDataLength = dataBin.byteLength

    let offset = 0
    const _buf = Buffer.alloc(hmDataSize)
    const traceId = requestId ? requestId : genTraceId()
    const spanId = genSpanId()
    let seqId = 0

    const count = Math.ceil(userDataLength / hmDataSize)

    function genSeqId() {
      return seqId++
    }

    for (let i = 1; i <= count; i++) {
      this.errorIfBleDisconnect()
      if (i === count) {
        // last
        const tailSize = userDataLength - offset
        const tailBuf = Buffer.alloc(headerSize + tailSize)

        dataBin.copy(tailBuf, headerSize, offset, offset + tailSize)
        offset += tailSize
        this.sendDataWithSession(
          {
            traceId,
            spanId: spanId,
            seqId: genSeqId(),
            payload: tailBuf,
            type,
            opCode: MessagePayloadOpCode.Finished,
            totalLength: userDataLength,
            contentType,
            dataType,
          },
          {
            messageType,
          },
        )

        break
      }

      dataBin.copy(_buf, headerSize, offset, offset + hmDataSize)
      offset += hmDataSize

      this.sendDataWithSession(
        {
          traceId,
          spanId: spanId,
          seqId: genSeqId(),
          payload: _buf,
          type,
          opCode: MessagePayloadOpCode.Continued,
          totalLength: userDataLength,
          contentType,
          dataType,
        },
        {
          messageType,
        },
      )
    }

    if (offset === userDataLength) {
      DEBUG &&
        logger.debug(
          'HmProtocol send ok msgSize=> %d dataSize=> %d',
          offset,
          userDataLength,
        )
    } else {
      DEBUG &&
        logger.error(
          'HmProtocol send error msgSize=> %d dataSize=> %d',
          offset,
          userDataLength,
        )
    }
  }

  sendJson({
    requestId = 0,
    json,
    type = MessagePayloadType.Request,
    contentType,
    dataType,
  }) {
    const packageBin = json2buf(json)
    const traceId = requestId ? requestId : genTraceId()

    this.sendHmProtocol({
      requestId: traceId,
      dataBin: packageBin,
      type,
      contentType,
      dataType,
    })
  }

  sendBuf({
    requestId = 0,
    buf,
    type = MessagePayloadType.Request,
    contentType,
    dataType,
  }) {
    const traceId = requestId ? requestId : genTraceId()

    return this.sendHmProtocol({
      requestId: traceId,
      dataBin: buf,
      type,
      contentType,
      dataType,
    })
  }

  sendText({
    requestId = 0,
    text,
    type = MessagePayloadType.Request,
    contentType,
    dataType,
  }) {
    const packageBin = str2buf(text)
    const traceId = requestId ? requestId : genTraceId()

    return this.sendHmProtocol({
      requestId: traceId,
      dataBin: packageBin,
      type,
      contentType,
      dataType,
    })
  }

  sendDataWithSession(
    {
      traceId,
      spanId,
      seqId,
      payload,
      type,
      opCode,
      totalLength,
      contentType,
      dataType,
    },
    { messageType },
  ) {
    const payloadBin = this.buildPayload({
      traceId,
      spanId,
      seqId,
      totalLength,
      type,
      opCode,
      payload,
      contentType,
      dataType,
    })

    let data = this.isDevice
      ? this.buildData(payloadBin, {
          type: messageType,
        })
      : payloadBin

    this.sendMsg(data)
  }

  buildPayload(data) {
    const size = HM_MESSAGE_PROTO_HEADER + data.payload.byteLength
    let buf = Buffer.alloc(size)
    let offset = 0

    // header
    // traceId
    buf.writeUInt32LE(data.traceId, offset)
    offset += 4

    // parentId
    buf.writeUInt32LE(0, offset)
    offset += 4

    // spanId
    buf.writeUInt32LE(data.spanId, offset)
    offset += 4

    // seqId // 顺序 id,消息部分顺序序列号
    buf.writeUInt32LE(data.seqId, offset)
    offset += 4

    // message total length
    buf.writeUInt32LE(data.totalLength, offset)
    offset += 4

    // payload length 当前
    buf.writeUInt32LE(data.payload.byteLength, offset)
    offset += 4

    // payload type
    buf.writeUInt8(data.type, offset)
    offset += 1

    // opCode
    buf.writeUInt8(data.opCode, offset)
    offset += 1

    // timestamp1
    buf.writeUInt32LE(this.now(), offset)
    offset += 4

    // timestamp2
    buf.writeUInt32LE(0, offset)
    offset += 4

    // timestamp3
    buf.writeUInt32LE(0, offset)
    offset += 4

    // timestamp4
    buf.writeUInt32LE(0, offset)
    offset += 4

    // timestamp5
    buf.writeUInt32LE(0, offset)
    offset += 4

    // timestamp6
    buf.writeUInt32LE(0, offset)
    offset += 4

    // timestamp7
    buf.writeUInt32LE(0, offset)
    offset += 4

    // request content data type
    buf.writeUInt8(data.contentType, offset)
    offset += 1

    // response data type
    buf.writeUInt8(data.dataType, offset)
    offset += 1

    buf.writeUInt16LE(0, offset)
    offset += 2

    // extra1
    buf.writeUInt32LE(0, offset)
    offset += 4

    // extra2
    buf.writeUInt32LE(0, offset)
    offset += 4

    // payload
    buf.fill(data.payload, offset, data.payload.byteLength + offset)

    return buf
  }

  readPayload(arrayBuf) {
    const buf = Buffer.from(arrayBuf)
    let offset = 0

    const traceId = buf.readUInt32LE(offset)
    offset += 4

    const parentId = buf.readUInt32LE(offset)
    offset += 4

    const spanId = buf.readUInt32LE(offset)
    offset += 4

    const seqId = buf.readUInt32LE(offset)
    offset += 4

    const totalLength = buf.readUInt32LE(offset)
    offset += 4

    const payloadLength = buf.readUInt32LE(offset)
    offset += 4

    const payloadType = buf.readUInt8(offset)
    offset += 1

    const opCode = buf.readUInt8(offset)
    offset += 1

    const timestamp1 = buf.readUInt32LE(offset)
    offset += 4

    const timestamp2 = buf.readUInt32LE(offset)
    offset += 4

    const timestamp3 = buf.readUInt32LE(offset)
    offset += 4

    const timestamp4 = buf.readUInt32LE(offset)
    offset += 4

    const timestamp5 = buf.readUInt32LE(offset)
    offset += 4

    const timestamp6 = buf.readUInt32LE(offset)
    offset += 4

    const timestamp7 = buf.readUInt32LE(offset)
    offset += 4

    // request data type
    const contentType = buf.readUInt8(offset)
    offset += 1

    // response data type
    const dataType = buf.readUInt8(offset)
    offset += 1

    const extra1 = buf.readUInt16LE(offset)
    offset += 2

    const extra2 = buf.readUInt32LE(offset)
    offset += 4

    const extra3 = buf.readUInt32LE(offset)
    offset += 4

    const payload = buf.subarray(offset)

    return {
      traceId,
      parentId,
      spanId,
      seqId,
      totalLength,
      payloadLength,
      payloadType,
      opCode,
      contentType,
      dataType,
      timestamp1,
      timestamp2,
      timestamp3,
      timestamp4,
      timestamp5,
      timestamp6,
      timestamp7,
      extra1,
      extra2,
      extra3,
      payload,
    }
  }

  onFragmentData(bin) {
    const data = this.readBin(bin)
    this.emit('raw', bin)

    DEBUG && logger.debug('receive data=>', JSON.stringify(data))
    if (data.flag === MessageFlag.App && data.type === MessageType.Shake) {
      this.appSidePort = data.port2
      logger.info('shake success appSidePort=>', data.port2)
      this.emit('shake:response', data)
      this.clearShakeTimer()
      this.shakeTask.resolve()
      this.shakeStatus = ShakeStatus.success
    } else if (
      data.flag === MessageFlag.App &&
      data.type === MessageType.Data
    ) {
      this.emit('message', data.payload)
      this.emit('read', data)
    } else if (
      data.flag === MessageFlag.App &&
      data.type === MessageType.DataWithSystemTool
    ) {
      this.emit('message', data.payload)
      this.emit('read', data)
    } else if (data.flag === MessageFlag.App && data.type === MessageType.Log) {
      this.emit('log', data.payload)
    } else if (data.flag === MessageFlag.Runtime) {
      DEBUG &&
        logger.debug('receive runtime => flag %d type %d', data.flag, data.type)
    } else if (
      data.flag === MessageFlag.App &&
      data.type === MessageType.Close
    ) {
      this.appSidePort = 0
      DEBUG && logger.debug('receive close =>', this.appSidePort)
    } else {
      DEBUG &&
        logger.error('error appSidePort=>%d data=>%j', this.appSidePort, data)
    }
  }

  errorIfBleDisconnect() {
    if (!isZeppOS()) {
      return
    }

    const isBleConnected = this.ble.connectStatus()
    DEBUG && logger.debug('isBleConnected=>', isBleConnected)

    if (!isBleConnected) {
      throw new MessageError(MessageErrorCode.BLE_CLOSE, 'ble disconnect')
    }
  }

  errorIfSideServiceDisconnect() {
    if (!isZeppOS()) {
      return
    }

    if (!this.appSidePort) {
      throw new MessageError(
        MessageErrorCode.APP_CLOSE,
        'side service is not running',
      )
    }
  }

  getRequestCount() {
    return this.handlers.size
  }

  onResponse(fullPayload) {
    const handler = this.handlers.get(fullPayload.traceId)
    handler && handler(fullPayload)
  }

  onMessage(messagePayload) {
    const payload = this.readPayload(messagePayload)
    let session = this.sessionMgr.getById(payload.traceId, payload.payloadType)

    if (!session) {
      session = this.sessionMgr.newSession(
        payload.traceId,
        payload.payloadType,
        this,
      )

      // TODO: 需要考虑缓冲，监听回调要放到启动之前，或者没有增加监听就缓存请求
      session.on('data', (fullPayload) => {
        if (fullPayload.opCode === MessagePayloadOpCode.Finished) {
          if (fullPayload.payloadType === MessagePayloadType.Request) {
            this.emit('request', {
              request: fullPayload,
              response: ({ data, dataType }) => {
                if (typeof dataType !== 'undefined') {
                  dataType = getDataType(dataType)
                } else {
                  dataType = fullPayload.dataType
                }

                this.response({
                  requestId: fullPayload.traceId,
                  contentType: fullPayload.contentType,
                  dataType,
                  data,
                })
              },
            })
          } else if (fullPayload.payloadType === MessagePayloadType.Response) {
            this.emit('response', fullPayload)
          } else if (fullPayload.payloadType === MessagePayloadType.Notify) {
            this.emit('call', fullPayload)
          }

          this.emit('data', fullPayload)
          this.sessionMgr.destroy(session)
        }
      })

      session.on('error', (error) => {
        this.sessionMgr.destroy(session)
        this.emit('error', error)
      })
    }

    session.addChunk(payload)
  }

  /**
   * 发送请求
   * @param {object buffer arraybuffer arraybuffer like} data 传输的数据
   * @param {*} opts
   * @returns
   */
  request(data, opts) {
    try {
      this.errorIfBleDisconnect()
    } catch (error) {
      logger.error('error ble disconnect %j', error)
      return Promise.reject(error)
    }

    const requestTask = () => {
      this.errorIfBleDisconnect()
      this.errorIfSideServiceDisconnect()

      let contentType = DataType.bin

      if (typeof data === 'string') {
        contentType = DataType.text
      } else if (isPlainObject(data)) {
        contentType = DataType.json
      } else if (
        data instanceof ArrayBuffer ||
        ArrayBuffer.isView(data) ||
        Buffer.isBuffer(data)
      ) {
        contentType = DataType.bin
      }

      const defaultOpts = {
        timeout: 60000,
        contentType,
        dataType: contentType,
      }
      const requestId = genTraceId()

      const requestPromiseTask = Deferred()
      opts = Object.assign(defaultOpts, opts)

      let timer = setTimeout(() => {
        timer = null

        requestPromiseTask.reject(
          new MessageError(MessageErrorCode.REQUEST_TIME_OUT, `request id=${requestId} timeout in ${opts.timeout}ms`),
        )
      }, opts.timeout)

      let cancelTimer = () => {
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
      }

      const transact = ({ traceId, payload, dataType }) => {
        this.errorIfBleDisconnect()
        this.errorIfSideServiceDisconnect()

        DEBUG &&
          logger.debug(
            'traceId=>%d payload=>%s',
            traceId,
            payload.toString('hex'),
          )

        let result
        switch (dataType) {
          case MessagePayloadDataTypeOp.TEXT:
            result = buf2str(payload)
            break
          case MessagePayloadDataTypeOp.BIN:
            result = payload
            break
          case MessagePayloadDataTypeOp.JSON:
            result = buf2json(payload)
            break
          default: // buf
            result = payload
            break
        }

        logger.info('response id=>%d', requestId)

        requestPromiseTask.resolve(result)
      }

      this.handlers.set(requestId, transact)

      logger.info('request id=%d', requestId)
      if (Buffer.isBuffer(data)) {
        this.sendBuf({
          requestId,
          buf: data,
          type: MessagePayloadType.Request,
          contentType: MessagePayloadDataTypeOp.BIN,
          dataType: getDataType(opts.dataType),
        })
      } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        this.sendBuf({
          requestId,
          buf: Buffer.from(data),
          type: MessagePayloadType.Request,
          contentType: MessagePayloadDataTypeOp.BIN,
          dataType: getDataType(opts.dataType),
        })
      } else if (
        getDataType(opts.contentType) === MessagePayloadDataTypeOp.JSON
      ) {
        this.sendJson({
          requestId,
          json: data,
          type: MessagePayloadType.Request,
          contentType: MessagePayloadDataTypeOp.JSON,
          dataType: getDataType(opts.dataType),
        })
      } else if (
        getDataType(opts.contentType) === MessagePayloadDataTypeOp.TEXT
      ) {
        this.sendText({
          requestId,
          text: data,
          type: MessagePayloadType.Request,
          contentType: MessagePayloadDataTypeOp.TEXT,
          dataType: getDataType(opts.dataType),
        })
      } else {
        this.sendBuf({
          requestId,
          buf: Buffer.from(data),
          type: MessagePayloadType.Request,
          contentType: MessagePayloadDataTypeOp.BIN,
          dataType: getDataType(opts.dataType),
        })
      }

      return requestPromiseTask.promise
        .catch((e) => {
          logger.error('request id=%d %d %j', requestId, e.code, e.reason)
          throw e
        })
        .finally(() => {
          cancelTimer()
          if (this.handlers.get(requestId)) {
            DEBUG && logger.debug('release request id=>%d', requestId)
            this.handlers.delete(requestId)
          } else {
            logger.warn('release request id=>%d error', requestId)
          }
        })
    }

    return this.waitingShakePromise.then(requestTask)
  }

  /**
   * 相应接口给当前请求
   * @param {obj} param0
   */
  response({ requestId, contentType, dataType, data }) {
    if (MessagePayloadDataTypeOp.BIN === dataType) {
      this.sendBuf({
        requestId,
        buf: data,
        type: MessagePayloadType.Response,
        contentType,
        dataType,
      })
    } else if (MessagePayloadDataTypeOp.TEXT === dataType) {
      this.sendText({
        requestId,
        text: data,
        type: MessagePayloadType.Response,
        contentType,
        dataType,
      })
    } else if (MessagePayloadDataTypeOp.JSON === dataType) {
      this.sendJson({
        requestId,
        json: data,
        type: MessagePayloadType.Response,
        contentType,
        dataType,
      })
    } else {
      this.sendBuf({
        requestId,
        buf: data,
        type: MessagePayloadType.Response,
        contentType,
        dataType: MessagePayloadDataTypeOp.BIN,
      })
    }
  }

  /**
   * call 模式调用接口到伴生服务
   * @param {json | buffer} data
   * @returns
   */
  call(data) {
    let contentType = MessagePayloadDataTypeOp.JSON

    if (typeof data === 'string') {
      contentType = MessagePayloadDataTypeOp.TEXT
    } else if (isPlainObject(data)) {
      contentType = MessagePayloadDataTypeOp.JSON
    } else if (
      data instanceof ArrayBuffer ||
      ArrayBuffer.isView(data) ||
      Buffer.isBuffer(data)
    ) {
      contentType = MessagePayloadDataTypeOp.BIN
    }

    return this.waitingShakePromise.then(() => {
      if (Buffer.isBuffer(data)) {
        return this.sendBuf({
          buf: data,
          type: MessagePayloadType.Notify,
          contentType: MessagePayloadDataTypeOp.BIN,
          dataType: MessagePayloadDataTypeOp.EMPTY,
        })
      } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        return this.sendBuf({
          buf: Buffer.from(data),
          type: MessagePayloadType.Notify,
          contentType: MessagePayloadDataTypeOp.BIN,
          dataType: MessagePayloadDataTypeOp.EMPTY,
        })
      } else if (contentType === MessagePayloadDataTypeOp.JSON) {
        return this.sendJson({
          json: data,
          type: MessagePayloadType.Notify,
          contentType: MessagePayloadDataTypeOp.JSON,
          dataType: MessagePayloadDataTypeOp.EMPTY,
        })
      } else if (contentType === MessagePayloadDataTypeOp.TEXT) {
        return this.sendText({
          text: data,
          type: MessagePayloadType.Notify,
          contentType: MessagePayloadDataTypeOp.TEXT,
          dataType: MessagePayloadDataTypeOp.EMPTY,
        })
      } else {
        return this.sendBuf({
          buf: Buffer.from(data),
          type: MessagePayloadType.Notify,
          contentType: MessagePayloadDataTypeOp.BIN,
          dataType: MessagePayloadDataTypeOp.EMPTY,
        })
      }
    })
  }
}
