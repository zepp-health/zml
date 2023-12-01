import { IDisposable } from '../../common/disposable.js'
import  * as Disposable  from '../../common/idisposable.js'
import { AppGlobalThis, getAppId } from '../../common/global.js'

class ZeppOSDisposeObj {
  constructor(id) {
    this.name = "AppDispose_" + id
    console.log(this.name, 'create')
  }

  dispose() {
    console.log(this.name, 'dispose')
  }
}

export function appPlugin(opt) {
  const _g = new AppGlobalThis()
  const DisposeClass = IDisposable(ZeppOSDisposeObj)

  const disposer = (opt[Disposable.dispose] = new DisposeClass(getAppId()))
  _g.setValue(Disposable.dispose, disposer)

  opt.$m = {
    Dispose: {
      Disposable,
      IDisposable,
    },
    G: {
      App: _g
    }
  }

  return {
    onDestroy() {
      Disposable.safeDispose(disposer)
      _g.deleteKey(Disposable.dispose)
    },
  }
}

export function getAppDisposer() {
  return new AppGlobalThis().getValue(Disposable.dispose)
}

export {
	Disposable
}

export const API_LEVEL = __API_LEVEL__