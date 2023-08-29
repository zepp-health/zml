import { device } from './side-message'
import { settingsLib } from './side-settings'
import { downloaderLib } from './side-download-file'
import { fileTransferLib } from './side-file-transfer'

function addBaseURL(opts) {
  const params = {
    timeout: 10000,
    ...opts,
  }

  params.url = new URL(opts.url, params.baseURL).toString()

  return params
}

export function BaseSideService(initParams) {
  return {
    state: {},
    ...initParams,
    onInit(opts) {
      this._onCall = this.onCall?.bind(this)
      this._onRequest = this.onRequest?.bind(this)
      device.onCall(this._onCall).onRequest(this.__onRequest.bind(this))

      this._onReceivedFile = this.onReceivedFile?.bind(this)
      fileTransferLib.onSideServiceFileFinished(this._onReceivedFile)

      this._onSettingsChange = this.onSettingsChange?.bind(this)
      settingsLib.onChange(this._onSettingsChange)

      device.start()
      initParams.onInit?.apply(this, opts)
      Object.entries(initParams).forEach(([k, v]) => {
        if (k === 'onInit') {
          return
        }

        if (typeof k === 'string' && k.startsWith('onInit')) {
          v.apply(this, opts)
        }
      })

      if (typeof sideService !== 'undefined') {
        console.log('sideService.launchArgs=>', sideService.launchArgs)
        if (sideService.launchReasons.settingsChanged) {
          this._onSettingsChange(sideService.launchArgs)
        }

        if (sideService.launchReasons.fileTransfer) {
          fileTransferLib.emitFile()
        }
      }
    },
    onRun(opts) {
      initParams.onRun?.apply(this, opts)
      Object.entries(initParams).forEach(([k, v]) => {
        if (k === 'onRun') {
          return
        }

        if (typeof k === 'string' && k.startsWith('onRun')) {
          v.apply(this, opts)
        }
      })
    },
    onDestroy(opts) {
      if (this._onCall) {
        device.offOnCall(this._onCall)
      }

      if (this._onRequest) {
        device.offOnRequest(this._onRequest)
      }

      device.stop()

      if (this._onReceivedFile) {
        fileTransferLib.offFile(this._onReceivedFile)
      }

      if (this._onSettingsChange) {
        settingsLib.offChange(this._onSettingsChange)
      }

      Object.entries(initParams).forEach(([k, v]) => {
        if (k === 'onDestroy') {
          return
        }

        if (typeof k === 'string' && k.startsWith('onDestroy')) {
          v.apply(this, opts)
        }
      })

      initParams.onDestroy?.apply(this, opts)
    },
    request(data) {
      return device.request(data)
    },
    call(data) {
      return device.call(data)
    },
    fetch(opt) {
      return fetch(addBaseURL(opt))
    },
    sendFile(path, opts) {
      return fileTransferLib.sendFile(path, opts)
    },
    download(url, opts = {}) {
      return downloaderLib.download(url, opts)
    },
    __onRequest(req, res) {
      if (req.method === 'http.request') {
        return this.httpRequestHandler(req, res)
      } else {
        return this._onRequest(req, res)
      }
    },
    httpRequestHandler(req, res) {
      return this.fetch(req.params)
        .then((result) => {
          res(null, {
            status: result.status,
            statusText: result.statusText,
            headers: result.headers,
            body: result.body,
          })
        })
        .catch((e) => {
          return res({
            code: 1,
            message: e.message,
          })
        })
    },
  }
}
