import { ModuleGlobalThis, getModuleId } from '../../common/global.js'
import { getAppGlobalModules } from '../utils.js'

const [
  { IDisposable, Disposable },
] = getAppGlobalModules('Dispose')

class ZeppOSDisposeObj {
  constructor(id) {
    this.name = "ModuleDispose_" + id
    console.log(this.name, 'create')
  }

  dispose() {
    console.log(this.name, 'dispose')
  }
}

export function pagePlugin(opt) {
  const _g = new ModuleGlobalThis()
  const DisposeClass = IDisposable(ZeppOSDisposeObj)

  const disposer = (opt[Disposable.dispose] = new DisposeClass(getModuleId()))
  _g.setValue(Disposable.dispose, disposer)

  return {
    onDestroy() {
      Disposable.safeDispose(disposer)
      delete _g.deleteKey(Disposable.dispose)
    },
  }
}

export function getModuleDisposer() {
  return new ModuleGlobalThis().getValue(Disposable.dispose)
}

export { Disposable }

export const API_LEVEL = __API_LEVEL__
