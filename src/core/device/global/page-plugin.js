import { AppGlobalThis, MGR, getModuleId } from '../../common/global'

export function pagePlugin() {
  new AppGlobalThis().getValue(MGR)[getModuleId()] = {}
}
