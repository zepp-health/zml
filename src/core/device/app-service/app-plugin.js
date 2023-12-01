import { BgServiceMgr } from './BgService.js'

export function appPlugin(opt) {
  opt.$m.BgService = new BgServiceMgr()

  return {
    onDestroy() {
      opt.$m.BgService.disposeApp()
    }
  }
}

export const API_LEVEL = __API_LEVEL__