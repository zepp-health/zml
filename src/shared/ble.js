import { _r, isZeppOS1, isZeppOS2 } from './platform.js'

let nativeBle = null

if (isZeppOS1()) {
  nativeBle = hmBle
} else if (isZeppOS2()) {
  nativeBle = _r('@zos/ble')
  // nativeBle = bleModule
}

export { nativeBle }