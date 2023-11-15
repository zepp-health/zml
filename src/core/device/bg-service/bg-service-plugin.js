import { BgService } from './BgService'

export { BgService }

export function AppPlugin(opts) {
  opts.globalData.BgService = BgService

  return {
    onDestroy() {
      BgService.dispose()
    }
  }
}

export function BgServicePlugin() {
  return {
    onDestroy() {
      BgService.disposeService()
    }
  }
}