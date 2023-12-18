import { it, describe, beforeEach, afterEach } from 'node:test'
import { equal, ok } from 'node:assert/strict'

import { appPlugin, Disposable } from './app-plugin.js'
import { BaseApp } from '../base-app.js'

describe('app-plugin', () => {
  it('create', (t) => {
    BaseApp.use(appPlugin)
    const spy = t.mock.fn()

    const result = App(
      BaseApp({
        onCreate() {
          console.log(this[Disposable.dispose])
          ok(this['$m'])
          spy()
        },
      }),
    )

    result.onCreate()
    equal(spy.mock.callCount(), 1)
    ok(result['$m'])
  })

  it('destroy', (t) => {
    BaseApp.use(appPlugin)
    const spy = t.mock.fn()

    const result = App(
      BaseApp({
        onDestroy() {
          spy()
        },
      }),
    )

    result.onDestroy()
    equal(spy.mock.callCount(), 1)
    ok(result['$m'])
  })
})
