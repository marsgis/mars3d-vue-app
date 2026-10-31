import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import VisibleAdd from "@mars/views/analysis/visible/add/index.vue"
import * as api from "@mars/common/api"
import * as mapWork from "@mars/views/analysis/visible/add/map"
import { mountPage } from "../../../helpers/page"
import { fire } from "./helpers"

vi.mock("@mars/common/api", () => ({
  getHistoricalRecordsList: vi.fn(),
  getHistoricalRecordsById: vi.fn(),
  addHistoricalRecords: vi.fn(),
  updateHistoryRecords: vi.fn(),
  deleteHistoricalRecordsById: vi.fn()
}))
vi.mock("@mars/views/analysis/visible/add/map", () => {
  const eventTarget = { on: vi.fn(), off: vi.fn(), fire: vi.fn() }
  return {
    eventTarget,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    drawViewShed: vi.fn(),
    clearVisible: vi.fn(),
    getLastViewShed: vi.fn(),
    flyToVisible: vi.fn()
  }
})

const fireEvt = (event: string, payload?: any) => fire(mapWork as any, event, payload)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("visible/add 可视域绘制页", () => {
  it("渲染冒烟：绘制/列表按钮、提示入口", () => {
    const wrapper = mountPage(VisibleAdd)
    const tools = wrapper.findAll(".home-handle-item").map((i) => i.text())
    expect(tools.some((t) => t.includes("绘制"))).toBe(true)
    expect(tools.some((t) => t.includes("列表"))).toBe(true)
    expect(wrapper.text()).toContain("提示")
    wrapper.unmount()
  })

  it("点击「绘制」：drawViewShed 成功后按 visible 类型落历史记录", async () => {
    vi.mocked(mapWork.drawViewShed).mockResolvedValue({
      position: [116.1, 39.9, 0],
      style: { heading: 45.4, distance: 2000.6, opacity: 0.5, showFrustum: true }
    } as any)
    vi.mocked(api.addHistoricalRecords).mockResolvedValue({ code: 200, data: { id: "g1" } } as any)
    const wrapper = mountPage(VisibleAdd)
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("绘制"))!.trigger("click")
    await flushPromises()
    expect(mapWork.drawViewShed).toHaveBeenCalledWith(true)
    expect(api.addHistoricalRecords).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(api.addHistoricalRecords).mock.calls[0][0] as any
    expect(payload.type).toBe("visible")
    expect(payload.title).toContain("可视域记录")
    const content = JSON.parse(payload.content)
    expect(content.position).toEqual([116.1, 39.9, 0])
    expect(content.style.heading).toBe(45)
    expect(content.style.distance).toBe(2001)
    // 添加成功不提示失败
    expect(document.body.querySelector(".mars-message")).toBeNull()
    wrapper.unmount()
  })

  it("事件驱动编辑态：属性面板出现；新增态（id 为空）关闭参数弹层跳过修改接口（I030）", async () => {
    vi.mocked(api.updateHistoryRecords).mockResolvedValue({ code: 200 } as any)
    const wrapper = mountPage(VisibleAdd)
    // 编辑面板（含“属性”项）初始隐藏（mars-pannel v-show），事件触发后出现
    const attrPannel = () => wrapper.findAll(".pannel-box").find((p) => p.text().includes("属性"))!
    expect(attrPannel().element.style.display).toBe("none")
    fireEvt("drawCreatedEditingMeasure", {})
    await flushPromises()
    expect(attrPannel().element.style.display).not.toBe("none")
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("属性"))!.trigger("click")
    const popup = wrapper.find(".van-popup")
    expect(popup.text()).toContain("参数设置")
    expect(popup.text()).toContain("四周方向")
    expect(popup.text()).toContain("视椎线")
    // 关闭弹层（左箭头）：新契约下新增态 id 为空，跳过修改调用，避免 id:undefined 请求（I030）
    await popup.find(".van-nav-bar__left").trigger("click")
    await flushPromises()
    expect(api.updateHistoryRecords).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("绘制完成后（graphicId 就绪）关闭参数弹层：以该 id 调修改接口", async () => {
    vi.mocked(mapWork.drawViewShed).mockResolvedValue({
      position: [116.1, 39.9, 0],
      style: { heading: 45.4, distance: 2000.6, opacity: 0.5, showFrustum: true }
    } as any)
    vi.mocked(api.addHistoricalRecords).mockResolvedValue({ code: 200, data: { id: "g9" } } as any)
    vi.mocked(api.updateHistoryRecords).mockResolvedValue({ code: 200 } as any)
    const wrapper = mountPage(VisibleAdd)
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("绘制"))!.trigger("click")
    await flushPromises()
    fireEvt("drawCreatedEditingMeasure", {})
    await flushPromises()
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("属性"))!.trigger("click")
    await wrapper.find(".van-popup").find(".van-nav-bar__left").trigger("click")
    await flushPromises()
    expect(api.updateHistoryRecords).toHaveBeenCalledWith(expect.objectContaining({ id: "g9" }))
    wrapper.unmount()
  })

  it("绘制未完成（drawViewShed 无有效结果）：提示且不落垃圾记录（I026）", async () => {
    vi.mocked(mapWork.drawViewShed).mockResolvedValue(undefined as any)
    const wrapper = mountPage(VisibleAdd)
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("绘制"))!.trigger("click")
    await flushPromises()
    expect(document.body.textContent).toContain("请先完成绘制")
    expect(api.addHistoricalRecords).not.toHaveBeenCalled()
    // 绘制状态复位，绘制面板重新可见
    const drawPannel = () => wrapper.findAll(".pannel-box").find((p) => p.text().includes("绘制"))!
    expect(drawPannel().element.style.display).not.toBe("none")
    wrapper.unmount()
  })

  it("携带 query.id 挂载：加载记录、flyToVisible 定位并进入编辑态", async () => {
    await router.push({ name: "visible-add", query: { id: "x9" } })
    await flushPromises()
    vi.mocked(api.getHistoricalRecordsById).mockResolvedValue({
      code: 200,
      data: { id: "x9", content: JSON.stringify({ position: [9, 9, 9], style: { heading: 30, distance: 800, opacity: 0.6, showFrustum: false } }) }
    } as any)
    const wrapper = mountPage(VisibleAdd)
    await flushPromises()
    expect(api.getHistoricalRecordsById).toHaveBeenCalledWith("x9")
    expect(mapWork.flyToVisible).toHaveBeenCalledWith({ position: [9, 9, 9], style: { heading: 30, distance: 800, opacity: 0.6, showFrustum: false } })
    expect(wrapper.findAll(".home-handle-item").some((i) => i.text().includes("属性"))).toBe(true)
    wrapper.unmount()
  })

  it("记录 content 损坏：提示且不调用定位", async () => {
    await router.push({ name: "visible-add", query: { id: "bad" } })
    await flushPromises()
    vi.mocked(api.getHistoricalRecordsById).mockResolvedValue({ code: 200, data: { id: "bad", content: "{invalid" } } as any)
    const wrapper = mountPage(VisibleAdd)
    await flushPromises()
    expect(document.body.textContent).toContain("记录数据已损坏，无法加载")
    expect(mapWork.flyToVisible).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("点击「列表」跳转 visible-list", async () => {
    // 子路由导航需预加载父壳与子页
    await Promise.all([import("@mars/views/analysis/visible/index.vue"), import("@mars/views/analysis/visible/list/index.vue")])
    const wrapper = mountPage(VisibleAdd)
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("列表"))!.trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("visible-list")
    wrapper.unmount()
  })
})
