import { Toast } from "vant"
import type { ToastOptions } from "vant"
import { App } from "vue"
import "./message.less"

/**
 * message 信息弹窗
 * @export
 * @param {App} app vue实例
 * @copyright 火星科技 mars3d.cn
 * @author 火星渣渣灰 2022-03-10
 * @returns {void}
 */

export const $message = (options: string | ToastOptions) => {
  if (typeof options === "string") {
    options = {
      message: options
    }
  }
  options.className = "mars-message"
  Toast(options)
}

export default function (app: App): void {
  app.config.globalProperties.$message = $message
}
