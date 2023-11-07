import { _r } from '../../common/common'
import { setTimeout } from '../../../shared/device-setTimeout'
const appService = _r('@zos/app-service')
const { queryPermission, requestPermission } = _r('@zos/app')
const { showToast } = _r('@zos/interaction')
const { EventBus } = _r('@zos/utils')
import { stringify } from '../../common/qs'

const BG_PERMISSIONS = ['device:os.bg_service']

class BackgroundService {
  constructor(url) {
    this.url = url
    this._onMessage = null
  }

  get onMessage() {
    return this._onMessage
  }

  set onMessage(val) {
    if (val) {
      this._onMessage = val
      BgService._eventBus.on('bgServiceMessage', this._onMessage)
    } else {
      this._onMessage = null
      BgService._eventBus.off('bgServiceMessage')
    }
  }

  get isRunning() {
    return appService.getAllAppServices().includes(this.url)
  }

  postMessage(params) {
    BgService._eventBus.emit('clientMessage', params)
  }

  offMessage() {
    this.onMessage = null
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

    this.onMessage = null
    const result = appService.stop({
      url: this.url,
      param: `_u=${this.url}&_s=m&_a=stop` + '&' + stringify(params ?? {}),
      complete_func: (info) => {
        setTimeout(() => {
          if (!info.result) {
            showToast({
              content: `stop service[${this.url}] error`,
            })
            cb && cb({ error: new Error(info.file) })
            return
          }

          cb && cb(info)
        }, 10)
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

class Permission {
  static PermissionStatus = {
    unauthorized: 0,
    error: 1,
    authorized: 2,
  }

  static RequestPermissionResult = {
    cancel: 0,
    error: 1,
    granted: 2,
  }

  static request(permissions, cb) {
    const result = queryPermission({
      permissions,
    })[0]

    switch (result) {
      case Permission.PermissionStatus.unauthorized:
        requestPermission({
          permissions,
          callback([res]) {
            switch (res) {
              case Permission.RequestPermissionResult.granted:
                showToast({
                  content: 'permission: granted',
                })
                cb && cb({ code: res })
                break
              case Permission.RequestPermissionResult.cancel:
                showToast({
                  content: 'permission: canceled',
                })
                cb && cb({ error: new Error(res) })
                break
              default:
                showToast({
                  content: 'permission: request error',
                })
                cb && cb({ error: new Error(res) })
                break
            }
          },
        })
        break
      case Permission.PermissionStatus.authorized:
        cb && cb({ code: result })
        break
      default:
        showToast({
          content: 'permission: query error',
        })
        cb && cb({ error: new Error(result) })
        break
    }
  }
}

const bgService = new BackgroundService()

class BgServiceMgr {
  constructor() {
    this._instance = bgService
    this._eventBus = new EventBus()
    this._onMessage = null
  }

  instance(url) {
    this._instance.url = url
    return this._instance
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

  offMessage() {
    this.onMessage = null
  }

  disposePage() {
    // NOTE: 内存不能正确释放的问题，所以有手动将 onMessage 取消
    // this._instance.offMessage()
  }

  disposeService() {
    this.offMessage()
  }

  dispose() {
    this.disposePage()
    this.disposeService()

    this._eventBus.clear()
  }
}

export const BgService = new BgServiceMgr()