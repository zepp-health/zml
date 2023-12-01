globalThis.__$$app$$__ = {
  __globals__: {
    __scopedGlobals__: {},
  },
}

globalThis.__$$module$$__ = {
  __globals__: {
    __$$G$$__: {},
  },
}

function initProxy(target, ...source) {
  if (!target) {
    throw Error('target not undefined')
  }

  return new Proxy(target, {
    get(target, p) {
      for (const s of [target, ...source].reverse()) {
        if (!s) continue
        if (p in s) return s[p]
      }
    },
    set(target, p, value) {
      target[p] = value
      return true
    },
  })
}

function noop() {}

globalThis.App = function App(options) {
  const app = {
    _options: options,
    onCreate: noop,
    onDestroy: noop,
    onError: noop,
    onPageNotFound: noop,
    onUnhandledRejection: noop,
    globalData: {},
  }
  return initProxy(app, options)
}

globalThis.Page = function Page(options) {
  const page = {
    _options: options,
    onInit: noop,
    onResume: noop,
    build: noop,
    onPause: noop,
    onDestroy: noop,
    state: {},
  }
  return initProxy(page, opt)
}

globalThis.__API_LEVEL__ = "3.0"