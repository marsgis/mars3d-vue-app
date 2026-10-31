import { describe, it, expect, vi } from "vitest"
import nprogress from "nprogress"
import { $message } from "@mars/components/mars-ui/mars-message"
import { $dialog } from "@mars/components/mars-ui/mars-dialog"
import { $shownotify, $clearNotify } from "@mars/components/mars-ui/mars-notify"
import { $showLoading, $hideLoading } from "@mars/components/mars-ui/mars-loading"

describe("mars-ui 函数式 API", () => {
  it("$message 字符串入参转 options 并渲染 .mars-message", async () => {
    $message("保存成功")
    await vi.waitFor(() => {
      const el = document.body.querySelector(".mars-message")
      expect(el).toBeTruthy()
      expect(el!.textContent).toContain("保存成功")
    })
  })

  it("$message 对象入参透传并注入 className", async () => {
    $message({ message: "对象消息", type: "success" } as any)
    await vi.waitFor(() => {
      expect(document.body.querySelector(".mars-message")).toBeTruthy()
    })
  })

  it("$shownotify 渲染 .mars-notify，$clearNotify 清除", async () => {
    $shownotify("网络异常")
    await vi.waitFor(() => {
      expect(document.body.querySelector(".mars-notify")).toBeTruthy()
    })
    $clearNotify()
  })

  it("$dialog.alert 注入 mars-dialog 样式类，点击确认后 resolve", async () => {
    const p = $dialog.alert({ message: "确认删除吗" } as any)
    await vi.waitFor(() => {
      expect(document.body.querySelector(".van-dialog.mars-dialog")).toBeTruthy()
    })
    ;(document.body.querySelector(".van-dialog__confirm") as HTMLElement).click()
    await expect(p).resolves.toBeTruthy()
  })

  it("$showLoading top 模式启动 nprogress，进度随时间推进，$hideLoading 归零后 done", () => {
    vi.useFakeTimers()
    try {
      $showLoading("top")
      expect(nprogress.isStarted()).toBe(true)
      const before = nprogress.status as number
      vi.advanceTimersByTime(500)
      expect(nprogress.status as number).toBeGreaterThan(before)
      $hideLoading()
      expect(nprogress.isStarted()).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it("$showLoading toast 模式显示加载 toast，$hideLoading 触发关闭不异常", async () => {
    $showLoading("toast")
    await vi.waitFor(() => {
      expect(document.body.querySelector(".van-toast")).toBeTruthy()
    })
    // toast 的 DOM 卸载依赖 CSS transition（css:false + happy-dom 不触发 transitionend），故仅验证关闭链路不抛异常
    expect(() => $hideLoading()).not.toThrow()
  })

  it("$hideLoading 多余调用不产生负计数（clamp 到 0，重复 done 无害）", () => {
    $showLoading("top")
    $hideLoading()
    $hideLoading()
    expect(nprogress.isStarted()).toBe(false)
  })
})
