import { AppGlobalThis, getModuleId } from '../../common/global.js'
import { getAppGlobalModules } from '../utils.js'

const [
  {
    Dispose: { IDisposable, Disposable },
  },
] = getAppGlobalModules('Dispose')

export function getAppDisposer() {
  return new AppGlobalThis().getValue(Disposable.dispose)
}

export function getModuleDisposer() {
  return new ModuleGlobalThis().getValue(Disposable.dispose)
}

export {
	IDisposable,
	Disposable
}