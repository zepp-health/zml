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

export function PagePlugin(vm) {
  return {
    onDestroy() {
      BgService.disposePage()
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