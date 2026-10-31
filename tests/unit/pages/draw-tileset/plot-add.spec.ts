import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import PlotAdd from "@mars/views/draw/plot/add/index.vue"
import { router } from "@mars/routes"
import { mountPage } from "../../../helpers/page"

// 页面 map.ts 桥接层 mock；eventTarget 用真实监听器注册表以便模拟绘制事件
const mapWorkMock = vi.hoisted(() => {
  const listeners: Record<string, ((data?: any) => void)[]> = {}
  const fire = (evt: string, data?: any) => (listeners[evt] || []).forEach((cb) => cb(data))
  return {
    eventTarget: {
      on: vi.fn((evt: string, cb: (data?: any) => void) => {
        ;(listeners[evt] = listeners[evt] || []).push(cb)
      }),
      off: vi.fn(),
      fire
    },
    fire,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    startDraw: vi.fn(),
    getHistoyData: vi.fn(),
    operateOnGraphics: vi.fn(),
    endDraw: vi.fn(),
    clearDraw: vi.fn()
  }
})
vi.mock("@mars/views/draw/plot/add/map", () => mapWorkMock)

vi.mock("@mars/common/api", () => ({
  addMarkerPointHistory: vi.fn(),
  updateMarkerPointHistory: vi.fn(),
  getMarkerPointHistoryList: vi.fn(),
  getMarkerPointHistoryById: vi.fn(),
  deleteMarkerPointHistoryById: vi.fn(),
  addHistoricalRecords: vi.fn(),
  updateHistoryRecords: vi.fn(),
  getHistoricalRecordsList: vi.fn(),
  getHistoricalRecordsById: vi.fn(),
  deleteHistoricalRecordsById: vi.fn()
}))

// PlotList 子组件依赖 axios 拉取 plot-list.json，属于组件层专项，此处 stub
const stubs = { PlotList: true, "plot-list": true }

beforeEach(() => {
  vi.clearAllMocks()
})

describe("plot-add 图上标绘新增", () => {
  it("渲染冒烟：导航标题、标绘/列表入口与帮助按钮", () => {
    const wrapper = mountPage(PlotAdd, { stubs })
    expect(wrapper.text()).toContain("图上标绘")
    expect(wrapper.text()).toContain("标绘")
    expect(wrapper.text()).toContain("列表")
    expect(wrapper.text()).toContain("帮助")
    wrapper.unmount()
  })

  it("点击「列表」：矢量未处于编辑时离开页面跳转 plot-list", async () => {
    // 目标为嵌套路由子页：导航会懒加载父壳 + 子页，动态 import 属宏任务，flushPromises 覆盖不到，需一并预加载
    await import("@mars/views/draw/plot/index.vue")
    await import("@mars/views/draw/plot/list/index.vue")
    mapWorkMock.operateOnGraphics.mockReturnValue(false)
    const wrapper = mountPage(PlotAdd, { stubs })
    const listItem = wrapper.findAll(".home-handle-item").find((el) => el.text().includes("列表"))!
    await listItem.trigger("click")
    await flushPromises()
    expect(mapWorkMock.operateOnGraphics).toHaveBeenCalledWith(undefined, "stopEdit")
    // 防御性等待导航落定（懒加载/初始导航可能引入宏任务）
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe("plot-list"), { timeout: 5000 })
    wrapper.unmount()
  })

  it("点击「标绘」打开标绘样式选择弹层", async () => {
    const wrapper = mountPage(PlotAdd, { stubs })
    const plotItem = wrapper.findAll(".home-handle-item").find((el) => el.text().includes("标绘"))!
    await plotItem.trigger("click")
    await flushPromises()
    expect(wrapper.find(".add-plot-popup").exists()).toBe(true)
    wrapper.unmount()
  })

  it("drawStart 事件后显示绘制中按钮，点击「完成绘制」调用 endDraw", async () => {
    const wrapper = mountPage(PlotAdd, { stubs })
    mapWorkMock.fire("drawStart")
    await flushPromises()
    expect(wrapper.text()).toContain("完成绘制")
    const okBtn = wrapper.findAll("button").find((b) => b.text().includes("完成绘制"))!
    await okBtn.trigger("click")
    expect(mapWorkMock.endDraw).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
