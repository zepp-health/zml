
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
      this.set.delete(cb)
    } else {
      this.set.clear()
    }
  }
}