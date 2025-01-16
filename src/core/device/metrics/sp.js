import { ui, _px } from '../../common/common.js'

function spx(fz) {
  // 首次调用时进行判断，并缓存结果到 sp 函数自身
  spx = ui.getSysFontSize ?? (s => s);
  // 调用缓存的函数
  return spx(_px(fz));
}

export { spx }
