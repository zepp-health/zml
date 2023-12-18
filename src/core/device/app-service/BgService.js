import { _r } from '../../common/common.js'
import { stringify } from '../../common/qs.js'
import { Permission } from '../permission/permission.js'
const { showToast } = _r('@zos/interaction')
const { EventBus } = _r('@zos/utils')
const appService = _r('@zos/app-service')

const BG_PERMISSIONS = ['device:os.bg_service']

class BackgroundService {
  constructor(url) {
    this.url = url
    this._onMessage = null
    this.BgService = null
  }

  get onMessage() {
    return this._onMessage
  }

  set onMessage(val) {
    if (val) {
      this._onMessage = val
      this.BgService._eventBus.on('bgServiceMessage', this._onMessage)
    } else {
      this._onMessage = null
      this.BgService._eventBus.off('bgServiceMessage')
    }
  }

  get isRunning() {
    return appService.getAllAppServices().includes(this.url)
  }

  postMessage(params) {
    this.BgService._eventBus.emit('clientMessage', params)
  }

  postEvent(params, cb) {
    if (!params) {
      return cb({
        error: new Error('postEvent need params'),
      })
    }

    if (!this.isRunning) {
      return this.start(params, cb)
    }

    const result = appService.start({
      url: this.url,
      param: `_u=${this.url}&_s=m&_a=running` + '&' + stringify(params),
      complete_func: (info) => {
        if (!info.result) {
          showToast({
            content: 'start service error',
          })
          cb && cb({ error: new Error(info.file) })
          return
        }

        cb && cb(info)
      },
    })

    if (result !== 0) {
      cb && cb({ error: new Error(result) })
    }
  }

  start(params, cb) {
    if (this.isRunning) {
      this.postEvent(params, cb)
      return
    }

    Permission.request(BG_PERMISSIONS, (result) => {
      if (result.error) {
        cb && cb(result)
        return
      }

      this._start(params, cb)
    })
  }

  _start(params, cb) {
    const result = appService.start({
      url: this.url,
      param: `_u=${this.url}&_s=m&_a=start` + '&' + stringify(params ?? {}),
      complete_func: (info) => {
        if (!info.result) {
          showToast({
            content: 'start service error',
          })
          cb && cb({ error: new Error(info.file) })
          return
        }

        showToast({
          content: 'start service success',
        })
        cb && cb(info)
      },
    })

    if (result !== 0) {
      cb && cb({ error: new Error(result) })
    }
  }

  stop(params, cb) {
    if (!this.isRunning) {
      cb({
        file: this.url,
      })
      return
    }

    const result = appService.stop({
      url: this.url,
      param: `_u=${this.url}&_s=m&_a=stop` + '&' + stringify(params ?? {}),
      complete_func: (info) => {
        if (!info.result) {
          showToast({
            content: `stop service[${this.url}] error`,
          })
          cb && cb({ error: new Error(info.file) })
          return
        }

        cb && cb(info)
      },
    })

    if (result !== 0) {
      cb && cb({ error: new Error(result) })
    }
  }

  toString() {
    return `BgService {url=${this.url} status=${
      this.isRunning ? 'running' : 'stop'
    }}`
  }
}

export class BgServiceMgr {
  constructor() {
    this._instance = new Map()
    this._eventBus = new EventBus()
    this._onMessage = null
  }

  instance(url) {
    if (this._instance.has(url)) {
      const ins = this._instance.get(url)
      ins.BgService = this
      return ins
    }

    const bgService = new BackgroundService(url)
    bgService.BgService = this
    this._instance.set(url, bgService)
    return bgService
  }

  postMessage(params) {
    this._eventBus.emit('bgServiceMessage', params)
  }

  get onMessage() {
    return this._onMessage
  }

  set onMessage(cb) {
    if (cb) {
      this._onMessage = cb
      this._eventBus.on('clientMessage', cb)
    } else {
      this._onMessage = null
      this._eventBus.off('clientMessage')
    }
  }

  stopAll() {
    this._instance.forEach((v) => {
      v.stop()
    })

    this._instance.clear()
  }

  offMessage() {
    this.onMessage = null
  }

  disposePage() {
    this._instance.forEach((v) => {
      v.onMessage = null
      v.BgService = null
    })

    this._instance.clear()
  }

  disposeService() {
    this.offMessage()
  }

  disposeApp() {
    this.disposePage()
    this.disposeService()
  }
}
