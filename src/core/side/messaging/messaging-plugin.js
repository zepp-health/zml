import { messaging } from './side-message'

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
      if (req.method === 'http.request') {
        return this.httpRequestHandler(req, res)
      } else {
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
	}
}

export const API_LEVEL = __API_LEVEL__