import { BaseSideService } from '@zeppos/zml/base-side'

AppSideService(
  BaseSideService({
    onInit() {
      this.log('app side service invoke onInit')
    },
    onRun() {
      this.log('app side service invoke onRun')
    },
    onDestroy() {
      this.log('app side service invoke onDestroy')
    },
    getDataFromDevice() {
      return this.request({
        method: 'your.method2',
        params: {
          param1: 'param1',
          param2: 'param2',
        },
      })
        .then((result) => {
          // receive your data
          this.log('result=>', result)
        })
        .catch((error) => {
          // receive your error
          this.error('error=>', error)
        })
    },
    notifyDevice() {
      this.call({
        method: 'your.method4',
        params: {
          param1: 'param1',
          param2: 'param2',
        },
      })
    },
    onRequest(req, res) {
      // request from device
      // need reply
      // node style callback
      // first param is error
      // second param is your data
      if (req.method === 'your.method1') {
        // do something
        this.debug('receive request=>', req)
        res(null, {
          test: 'test',
        })
      } else {
        res('error happened')
      }
    },

    onCall(req) {
      // call from device
      // no reply
      this.debug('receive call=>', req)
      if (req.method === 'your.method3') {
        // do something
        this.debug('receive call=>', req)
      } else if (req.method === 'mobile.request') {
        this.getDataFromDevice()
      } else if (req.method === 'mobile.call') {
        this.notifyDevice()
      }
    },
  }),
)
