import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import Sunlight from "@mars/views/analysis/sunlight/index.vue"
import * as mapWork from "@mars/views/analysis/sunlight/map"
import { mountPage } from "../../../helpers/page"
import { fire } from "./helpers"

vi.mock("@mars/views/analysis/sunlight/map", () => {
  const eventTarget = { on: vi.fn(), off: vi.fn(), fire: vi.fn() }
  return {
    eventTarget,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    setShadows: vi.fn(),
    startPlay: vi.fn(),
    stopPlay: vi.fn(),
    onChangeSpeed: vi.fn()
  }
})

const fireEvt = (event: string, payload?: any) => fire(mapWork as any, event, payload)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("sunlight 日照分析", () => {
  it("挂载即开始分析：setShadows + startPlay（当前日期、00:29）", () => {
    const now = new Date()
    const wrapper = mountPage(Sunlight)
    expect(wrapper.text()).toContain("日照分析")
    expect(mapWork.setShadows).toHaveBeenCalledWith([String(now.getFullYear()), String(now.getMonth() + 1), String(now.getDate())], 0, 29)
    expect(mapWork.startPlay).toHaveBeenCalledWith([String(now.getFullYear()), String(now.getMonth() + 1), String(now.getDate())], 0, 29)
    wrapper.unmount()
  })

  it("点击「播放」重新播放：startPlay 从 0 时 0 分开始", async () => {
    const wrapper = mountPage(Sunlight)
    vi.mocked(mapWork.startPlay).mockClear()
    const play = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("播放"))!
    await play.trigger("click")
    expect(mapWork.startPlay).toHaveBeenCalledTimes(1)
    expect(mapWork.startPlay.mock.calls[0].slice(1)).toEqual([0, 0])
    wrapper.unmount()
  })

  it("暂停/继续切换：stopPlay 返回 true 后按钮文案变「继续」", async () => {
    vi.mocked(mapWork.stopPlay).mockReturnValue(true)
    const wrapper = mountPage(Sunlight)
    expect(wrapper.text()).toContain("暂停")
    const toggle = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("暂停"))!
    await toggle.trigger("click")
    expect(mapWork.stopPlay).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain("继续")
    wrapper.unmount()
  })

  it("changeShadowTime 事件驱动时间条：显示 10:30 且进度为当日比例", async () => {
    const wrapper = mountPage(Sunlight)
    fireEvt("changeShadowTime", { shadowTime: new Date(2026, 0, 1, 10, 30, 0) })
    await flushPromises()
    expect(wrapper.find(".time-num").text()).toBe("10:30/24:00")
    const portion = wrapper.find(".van-progress__portion")
    expect(portion.element.style.width).toBe(`${(630 / 14.4)}%`)
    wrapper.unmount()
  })

  it("倍速切换：打开倍速面板选「3倍」调用 onChangeSpeed(3)", async () => {
    const wrapper = mountPage(Sunlight)
    const speed = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("倍数"))!
    await speed.trigger("click")
    const sheet = wrapper.find(".van-action-sheet")
    expect(sheet.text()).toContain("切换倍速")
    const item = sheet.findAll(".van-action-sheet__item").find((i) => i.text().includes("3倍"))!
    await item.trigger("click")
    expect(mapWork.onChangeSpeed).toHaveBeenCalledWith(3)
    wrapper.unmount()
  })

  it("日期面板确认后重新播放；导航栏返回 router.go(-1)", async () => {
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountPage(Sunlight)
    const date = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("日期"))!
    await date.trigger("click")
    const picker = wrapper.find(".van-picker")
    expect(picker.exists()).toBe(true)
    expect(wrapper.text()).toContain("选择年月日")
    vi.mocked(mapWork.startPlay).mockClear()
    await wrapper.find(".van-picker__confirm").trigger("click")
    await flushPromises()
    expect(mapWork.startPlay).toHaveBeenCalledTimes(1)
    expect(mapWork.startPlay.mock.calls[0].slice(1)).toEqual([0, 0])
    await wrapper.find(".van-nav-bar__left").trigger("click")
    expect(goSpy).toHaveBeenCalledWith(-1)
    goSpy.mockRestore()
    wrapper.unmount()
  })
})
