import { BTN_STYLE } from './index.style'
import ui from '@zos/ui'
import { getText } from '@zos/i18n'

export const layout = {
  refs: {},
  render(vm) {
    this.refs.btn1 = ui.createWidget(ui.widget.BUTTON, {
      ...BTN_STYLE,
      text: getText('appName'),
      click_func: () => {
        this.refs.btn1.setProperty(ui.prop.MORE, {
          color: 0xffffff,
        })
      },
    })

    this.refs.btn2 = ui.createWidget(ui.widget.BUTTON, {
      ...BTN_STYLE,
      y: BTN_STYLE.y + 100,
      click_func: () => {
        this.refs.btn2.setProperty(ui.prop.MORE, {
          color: 0xffffff,
        })

        vm.goBlePage()
      },
    })

    this.refs.btn3 = ui.createWidget(ui.widget.BUTTON, {
      ...BTN_STYLE,
      y: BTN_STYLE.y + 200,
      color: 0xff00ff,
      text: '测试文件传输',
      click_func: () => {
        this.refs.btn3.setProperty(ui.prop.MORE, {
          color: 0xffffff,
        })

        vm.goFilePage()
      },
    })

    this.refs.btn5 = ui.createWidget(ui.widget.BUTTON, {
      ...BTN_STYLE,
      y: BTN_STYLE.y + 300,
      color: 0xff00ff,
      text: '测试蓝牙 http 代理',
      click_func: () => {
        this.refs.btn5.setProperty(ui.prop.MORE, {
          color: 0xffffff,
        })

        vm.goBleHttp()
      },
    })
  },
}
