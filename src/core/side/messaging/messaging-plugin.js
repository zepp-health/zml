import { messaging } from './side-message.js'
import { fileTransferLib } from '../file-transfer/side-file-transfer.js'
import { settingsLib } from '../settings/side-settings.js'

function addBaseURL(opts) {
  const params = {
    timeout: 10000,
    ...opts,
  }

  if (params.baseURL) {
    params.url = new URL(params.url, params.baseURL).toString()
  }

  return params
}

export function messagingPlugin() {
  return {
    onInit() {
      this.messaging = messaging
      this._onCall = this.onCall?.bind(this)
      this._onRequest = this.onRequest?.bind(this)
      this.messaging.onCall(this._onCall).onRequest(this.__onRequest.bind(this))

      this.messaging.start()
    },
    onDestroy() {
      if (this._onCall) {
        this.messaging.offOnCall(this._onCall)
      }

      if (this._onRequest) {
        this.messaging.offOnRequest(this._onRequest)
      }

      this.messaging.stop()
    },
    request(data, opts = {}) {
      return this.messaging.request(data, opts)
    },
    call(data) {
      return this.messaging.call(data)
    },
    __onRequest(req, res) {
      switch (req.method) {
        case 'http.request':
          return this.httpRequestHandler(req, res)
        case 'download':
          return this.downloadHandler(req, res)
        case 'receiveFile':
          return this.receiveFileHandler(req, res)
        case 'getSettings':
          return this.getSettingsHandler(req, res)
        default:
          return this._onRequest(req, res)
      }
    },
    fetch(opt) {
      return fetch(addBaseURL(opt))
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
    download(opt) {
      opt = addBaseURL(opt)
      return network.downloader.downloadFile(opt)
    },
    downloadHandler(req, res) {
      return new Promise((resolve, reject) => {
        const downloadTask = this.download(req.params)
        downloadTask.onProgress = (event) => {
          if (req.params.onProgress) {
            req.params.onProgress(event)
          }
        }

        downloadTask.onSuccess = (event) => {
          if (!req.params.opts?.transfer) {
            res(null, {
              status: 'success',
              params: event,
            })

            resolve({ req, event })
          } else {
            req.params = req.params.opts.transfer
            this.receiveFileHandler(req, res)
              .then((result) => {
                resolve(result)
              })
              .catch((error) => {
                reject(error)
              })
          }
        }

        downloadTask.onFail = (event) => {
          res({
            code: 1,
            message: 'error',
            params: event,
          })

          reject({ event })
        }
      })
    },
    receiveFile(params) {
      return fileTransferLib.sendFile(params.path, params.opts)
    },
    receiveFileHandler(req, res) {
      return new Promise((resolve, reject) => {
        const task = this.receiveFile(req.params)
        task.on('progress', (event) => {
          if (req.params.onProgress) {
            req.params.onProgress(event)
          }
        })

        // Sometimes transferred event is sent twice
        let sendResult = true
        task.on('change', (event) => {
          if (event.data.readyState === 'transferred') {
            if (sendResult) {
              sendResult = false
              res(null, {
                status: 'success',
                params: {
                  req,
                },
              })
              resolve({ req })
            }
          } else if (event.data.readyState === 'error') {
            if (sendResult) {
              sendResult = false
              res({
                code: 1,
                message: 'error',
                params: {
                  req,
                  event,
                },
              })

              reject({ req, event })
            }
          } else {
            if (req.params.onChange) req.params.onChange(event)
          }
        })
      })
    },
    getSettingsHandler(req, res) {
      return new Promise((resolve, reject) => {
        const settings = {}
        if (!req.params.settings || !Array.isArray(req.params.settings)) {
          res({
            code: 1,
            message: 'error',
            params: {
              req,
            },
          })

          reject({
            status: 'error',
            message: 'invalid input',
          })
        }

        req.params.settings.forEach((setting) => {
          settings[setting] = settingsLib.getItem(setting)
        })

        res(null, {
          status: 'success',
          params: {
            settings,
          },
        })

        resolve({ settings })
      })
    },
  }
}

export const API_LEVEL = __API_LEVEL__
