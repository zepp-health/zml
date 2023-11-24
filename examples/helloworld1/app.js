import { BaseApp } from '@zeppos/zml/base-app'

App(
  BaseApp({
    globalData: {},
    onCreate() {
      this.log('app on create invoke')
    },
    onDestroy() {
      this.log('app on destroy invoke')
    },
  }),
)
