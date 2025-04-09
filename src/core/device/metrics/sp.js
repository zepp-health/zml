import { ui } from '../../common/common.js'

const _dpi_sp = ui.sp ?? ((s) => s)

function sp(num) {
  return {
    [Symbol.toPrimitive](hint) {
      return hint === 'string' ? `${num.toFixed(0)}sp` : _dpi_sp(num)
    },
  }
}

export { sp }
