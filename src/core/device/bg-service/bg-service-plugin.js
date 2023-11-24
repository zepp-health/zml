import { BgService } from './BgService'

export { BgService }

export function appPlugin(opts) {
  opts.globalData.BgService = BgService

  return {
    onDestroy() {
      BgService.dispose()
    }
  }
}

export function sideServicePlugin() {
  return {
    onDestroy() {
      BgService.disposeService()
    }
  }
}

export const API_LEVEL = __API_LEVEL__