import { BaseApp } from '@zeppos/zml/base-app'

App(
  BaseApp({
    globalData: {
      a: 1
    },
    onCreate() {
      this.globalData.a = 2
      this.log(this.globalData.a)
      this.log('app test')
      // this.test()
      // this.test2()
    },
    onDestroy(opts) {
      // this.globalData.a += 1
      // this.globalData.a += 2
      // this.log('destroy=2',this.globalData.a)
      // this.log('app on destroy invoke')
    },
    test() {
      this.globalData.a += 1
      this.log('test method')
    },
    test2() {
      this.log('test2')
    }
  }),
)
