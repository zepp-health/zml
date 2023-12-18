export const MGR = '_$mgr$_'

class GlobalThis {
  constructor(global) {
    this.global = global
  }

  getValue(key) {
    return this.global[key]
  }

  setValue(key, value) {
    return (this.global[key] = value)
  }

  deleteKey(key) {
    delete this.global[key]
  }
}
export class AppGlobalThis extends GlobalThis {
  constructor() {
    super(__$$app$$__.__globals__.__scopedGlobals__)
  }
}

export class ModuleGlobalThis extends GlobalThis {
  constructor() {
    super(__$$app$$__.__globals__.__scopedGlobals__[MGR][__$$module$$__.id])
  }
}

export function getModuleId() {
  return __$$module$$__.id
}

export function getAppId() {
  return __$$app$$__.pid
}
