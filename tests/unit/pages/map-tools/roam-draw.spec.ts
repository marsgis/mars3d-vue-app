import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import RoamDraw from "@mars/views/camera/roam/draw/index.vue"
import * as mapWork from "@mars/views/camera/roam/draw/map"
// 预加载跳转目标路由组件（子路由导航需父壳一并加载）
import "@mars/views/camera/roam/index.vue"
import "@mars/views/camera/roam/list/index.vue"
import "@mars/views/camera/roam/start/index.vue"
import { mountPage } from "../../../helpers/page"
import { fire } from "./helpers"

vi.mock("@mars/views/camera/roam/draw/map", () => {
  const eventTarget = { on: vi.fn(), off: vi.fn(), fire: vi.fn() }
  return {
    eventTarget,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    addRouteLine: vi.fn(),
    getHistoyData: vi.fn(),
    operateOnGraphics: vi.fn(),
    endDraw: vi.fn(),
    clearDraw: vi.fn(),
    // 模板内联 mapWork.clearDraw() 编译后经 _isRef(mapWork) 判断，mock 命名空间需补该标记
    __v_isRef: false
  }
})

const fireEvt = (event: string, payload?: any) => fire(mapWork as any, event, payload)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("roam/draw 漫游路线绘制页", () => {
  it("渲染冒烟：初始化加载历史数据，编辑面板默认隐藏", async () => {
    const wrapper = mountPage(RoamDraw)
    await flushPromises()
    expect(wrapper.text()).toContain("飞行漫游")
    expect(mapWork.getHistoyData).toHaveBeenCalledWith(undefined)
    const tools = wrapper.findAll(".home-handle-item").map((i) => i.text())
    expect(tools.some((t) => t.includes("绘制"))).toBe(true)
    expect(tools.some((t) => t.includes("列表"))).toBe(true)
    // 「开始」面板默认隐藏（mars-pannel v-show）
    const startPannel = () => wrapper.findAll(".pannel-box").find((p) => p.text().includes("开始"))!
    expect(startPannel().element.style.display).toBe("none")
    wrapper.unmount()
  })

  it("点击「绘制」：先 endDraw 结束上一条，再 addRouteLine 开启新绘制", async () => {
    const wrapper = mountPage(RoamDraw)
    await flushPromises()
    const draw = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("绘制"))!
    await draw.trigger("click")
    await flushPromises()
    expect(mapWork.endDraw).toHaveBeenCalledTimes(1)
    expect(mapWork.addRouteLine).toHaveBeenCalledTimes(1)
    expect(mapWork.endDraw.mock.invocationCallOrder[0]).toBeLessThan(mapWork.addRouteLine.mock.invocationCallOrder[0])
    wrapper.unmount()
  })

  it("drawStart 事件进入绘制态：完成绘制→endDraw，清除绘制→clearDraw", async () => {
    const wrapper = mountPage(RoamDraw)
    await flushPromises()
    expect(wrapper.find(".bottom-handle-btns").exists()).toBe(false)
    fireEvt("drawStart", {})
    await flushPromises()
    const btns = wrapper.find(".bottom-handle-btns")
    expect(btns.exists()).toBe(true)
    expect(btns.text()).toContain("清除绘制")
    expect(btns.text()).toContain("完成绘制")
    await btns.findAll("button").find((b) => b.text().includes("完成绘制"))!.trigger("click")
    expect(mapWork.endDraw).toHaveBeenCalledTimes(1)
    await btns.findAll("button").find((b) => b.text().includes("清除绘制"))!.trigger("click")
    expect(mapWork.clearDraw).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it("editStart 事件进入编辑态：属性/删除/开始出现，删除按 historId 移除", async () => {
    const wrapper = mountPage(RoamDraw)
    await flushPromises()
    fireEvt("editStart", { historId: "h1", editingGraphic: true })
    await flushPromises()
    const tools = wrapper.findAll(".home-handle-item").map((i) => i.text())
    expect(tools.some((t) => t.includes("属性"))).toBe(true)
    expect(tools.some((t) => t.includes("删除"))).toBe(true)
    const startPannel = wrapper.findAll(".pannel-box").find((p) => p.text().includes("开始"))!
    expect(startPannel.element.style.display).not.toBe("none")
    const del = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("删除"))!
    await del.trigger("click")
    expect(mapWork.operateOnGraphics).toHaveBeenCalledWith("h1", "remove")
    wrapper.unmount()
  })

  it("getHistorId 后点「开始」跳 roam-start 携带 roamLineId；点「列表」跳 roam-list", async () => {
    const wrapper = mountPage(RoamDraw)
    await flushPromises()
    fireEvt("getHistorId", { historId: "h9" })
    fireEvt("editStart", { editingGraphic: true })
    await flushPromises()
    const start = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("开始"))!
    await start.trigger("click")
    await flushPromises()
    // 先尝试停止编辑（mock 返回 undefined 视为无需停止），再放行跳转
    expect(mapWork.operateOnGraphics).toHaveBeenCalledWith("h9", "stopEdit")
    expect(router.currentRoute.value.name).toBe("roam-start")
    expect(router.currentRoute.value.query.roamLineId).toBe("h9")

    const list = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("列表"))!
    await list.trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("roam-list")
    wrapper.unmount()
  })
})
