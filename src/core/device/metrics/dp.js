import { setting } from '../../common/common.js'
const settingInfo = setting.getFontSizeInfo()

export function dp(num) {
  return {
    [Symbol.toPrimitive](hint) {
      return hint === 'string'
        ? `swdpi(${num.toFixed(0)})`
        : num * settingInfo.DPIFactor
    },
  }
}
