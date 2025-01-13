let _r = null

if (typeof __$$R$$__ !== 'undefined') {
  _r = __$$R$$__
} else {
  _r = () => { }
}

const ui = _r('@zos/ui');

function sp(fz) {
  // 首次调用时进行判断，并缓存结果到 sp 函数自身
  sp = ui.getSysFontSize ?? (s => s);
  // 调用缓存的函数
  return sp(fz);
}

export { sp }
