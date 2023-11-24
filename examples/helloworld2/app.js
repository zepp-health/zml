import { BaseApp } from '@zeppos/zml/base-app'

App(
  BaseApp({
    globalData: {},
    onCreate() {
      this.log('app on create invoke')
    },

    onDestroy(opts) {
      this.log('app on destroy invoke')
    },
  }),
)
