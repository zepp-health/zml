import * as IDisposableFun from './idisposable.js'

class Disposable {
  constructor() {
    this._disposables = undefined
    this._disposed = false
  }

  get disposed() {
    return Boolean(this._disposed)
  }

  registerForDispose(...disposables) {
    for (const disposable of disposables) {
      if (!this._disposables) {
        this._disposables = new Set([disposable])
      } else {
        this._disposables.add(disposable)
      }
    }
  }

  checkIfDisposed() {
    checkDisposed(this)
  }

  [IDisposableFun.dispose]() {
    if (!this._disposed) {
      this._disposed = true

      IDisposableFun.safeDisposeAll(this._disposables)
      delete this._disposables

      this.dispose && this.dispose()
    }
  }
}

export function IDisposable(ctor) {
  class CustomDisposable extends ctor {}
  for (const key of Reflect.ownKeys(Disposable.prototype)) {
    const desc = {
      ...Reflect.getOwnPropertyDescriptor(Disposable.prototype, key),
    }
    Reflect.defineProperty(CustomDisposable.prototype, key, desc)
  }
  return CustomDisposable
}
