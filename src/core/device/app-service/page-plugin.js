import { getAppGlobalModules } from '../utils.js'

const [BgService] = getAppGlobalModules('BgService')

export const API_LEVEL = __API_LEVEL__

export function pagePlugin() {
  return {
    onDestroy() {
      BgService.disposePage()
    },
  }
}

export { BgService }
