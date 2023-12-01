import { getAppGlobalModules } from '../utils.js'

const [BgService] = getAppGlobalModules('BgService')

export function appServicePlugin() {
  return {
    onDestroy() {
      BgService.disposeService()
    }
  }
}

export {
  BgService
}

export const API_LEVEL = __API_LEVEL__