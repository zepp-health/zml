import { ui } from '../../common/common.js'

const _spx = ui.getSysFontSize ?? (s => s);

function sp(num) {
  return {
    [Symbol.toPrimitive](hint) {
      return (hint === 'string') ? `${num.toFixed(0)}sp` : _spx(num);
    }
  }
}

export { sp }
