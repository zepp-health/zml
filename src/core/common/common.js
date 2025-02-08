import { isZeppOS1, isZeppOS2, _r } from '../../shared/platform.js'

let getPackageInfo = null

if (isZeppOS1()) {
  getPackageInfo = hmApp.getPackageInfo
} else if (isZeppOS2()) {
  getPackageInfo = _r('@zos/app').getPackageInfo
}

export { getPackageInfo }

let ui = null

if (isZeppOS1()) {
  ui = hmUI
} else if (isZeppOS2()) {
  ui = _r('@zos/ui')
  // ui = uiModule
}

export { ui }

let setting = null

if (isZeppOS1()) {
  setting = hmSetting
} else if (isZeppOS2()) {
  setting = _r('@zos/settings')
}

export { setting }

let _px = null
if (isZeppOS1()) {
  _px = px
} else {
  _px = _r('@zos/utils').px
}

export { _px }

let getDeviceInfo = null

if (isZeppOS1()) {
  getDeviceInfo = hmSetting.getDeviceInfo
} else if (isZeppOS2()) {
  getDeviceInfo = _r('@zos/device').getDeviceInfo
}

export { getDeviceInfo }

let getText = null
if (isZeppOS1()) {
  getText =
    typeof __$$app$$__ !== 'undefined'
      ? __$$app$$__?.__globals__?.gettext
      : function () {
          throw new Error(`zeppos 1.0 required: import { gettext } from 'i18n'`)
        }
} else if (isZeppOS2()) {
  getText = _r('@zos/i18n').getText
}

export { getText }

let push = null

if (isZeppOS1()) {
  push = hmApp.gotoPage
} else if (isZeppOS2()) {
  push = _r('@zos/router').push
}

export { push }



let zosApp = null

if (isZeppOS1()) {
  zosApp = hmApp
} else if (isZeppOS2()) {
  zosApp = _r('@zos/app')
}

export { zosApp }
