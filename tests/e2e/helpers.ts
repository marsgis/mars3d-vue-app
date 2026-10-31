import type { Page } from "playwright/test"

/**
 * 收集页面未捕获异常（uncaught exceptions，含 TypeError/ReferenceError 等）。
 * 口径与第3步浏览器走查一致：资源加载失败（瓦片/模型/地形/在线数据源，本机无外网数据属预期）
 * 产生的 console error 不计入，仅未捕获 JS 异常视为页面崩溃。
 */
export function trackPageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on("pageerror", (err) => errors.push(err.message))
  return errors
}
