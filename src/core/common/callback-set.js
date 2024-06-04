
export class CallbackSet {
  constructor() {
    this.set = new Set()
  }

  add(cb) {
    this.set.add(cb)
  }

  runAll(...args) {
    this.set.forEach((cb) => {
      cb && cb(...args)
    })
  }

  remove(cb) {
    if (cb) {
      let res = this.set.delete(cb)
      if (!res) {
        console.log("remove error")
      } else {
        console.log("remove success")
      }

      console.log("set count=>", this.set.size)
    } else {
      this.set.clear()
    }
  }
}