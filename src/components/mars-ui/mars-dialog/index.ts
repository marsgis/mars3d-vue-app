import { Dialog } from "vant"
import { App } from "vue"
import "./dialog.less"

/**
 * Dialog 提示框
 * @export
 * @param {App} app vue实例
 * @copyright 火星科技 mars3d.cn
 * @author 火星渣渣灰 2022-03-10
 * @returns {void}
 */

Dialog.setDefaultOptions({
  className: "mars-dialog",
  overlayClass: "mars-dialog-overlay"
})

export const $dialog = Dialog

export default function (app: App): void {
  app.config.globalProperties.$dialog = $dialog
}
