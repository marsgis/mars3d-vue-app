import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import SlopeAdd from "@mars/views/terrain/slope/add/index.vue"
import * as api from "@mars/common/api"
import * as mapWork from "@mars/views/terrain/slope/add/map"
import { mountPage } from "../../../helpers/page"
import { fire } from "./helpers"

vi.mock("@mars/common/api", () => ({
  getHistoricalRecordsList: vi.fn(),
  getHistoricalRecordsById: vi.fn(),
  addHistoricalRecords: vi.fn(),
  updateHistoryRecords: vi.fn(),
  deleteHistoricalRecordsById: vi.fn()
}))
vi.mock("@mars/views/terrain/slope/add/map", () => {
  const eventTarget = { on: vi.fn(), off: vi.fn(), fire: vi.fn() }
  return {
    eventTarget,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    removeSlopeData: vi.fn(),
    clearDraw: vi.fn(),
    endDraw: vi.fn(),
    onClickDrawGraphic: vi.fn(),
    getGraphicStyle: vi.fn(),
    addTerrainSlop: vi.fn(),
    onChangeShadingType: vi.fn()
  }
})

const fireEvt = (event: string, payload?: any) => fire(mapWork as any, event, payload)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("slope/add 坡度坡向绘制页", () => {
  it("渲染冒烟：矩形/多边形/列表按钮、提示入口", () => {
    const wrapper = mountPage(SlopeAdd)
    const tools = wrapper.findAll(".home-handle-item").map((i) => i.text())
    expect(tools.some((t) => t.includes("矩形"))).toBe(true)
    expect(tools.some((t) => t.includes("多边形"))).toBe(true)
    expect(tools.some((t) => t.includes("列表"))).toBe(true)
    expect(wrapper.text()).toContain("提示")
    wrapper.unmount()
  })

  it("绘制多边形：addTerrainSlop 收到 positions/splitNum/shadingType 并落 terrainSlop 记录", async () => {
    vi.mocked(mapWork.onClickDrawGraphic).mockResolvedValue({ type: "polygon", positionsShow: [[1, 2], [3, 4]] } as any)
    vi.mocked(api.addHistoricalRecords).mockResolvedValue({ code: 200, data: { id: "s9" } } as any)
    const wrapper = mountPage(SlopeAdd)
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("多边形"))!.trigger("click")
    await flushPromises()
    expect(mapWork.addTerrainSlop).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(mapWork.addTerrainSlop).mock.calls[0][0] as any
    expect(arg.type).toBe("polygon")
    expect(arg.positions).toEqual([[1, 2], [3, 4]])
    expect(arg.splitNum).toBe(10)
    expect(arg.shadingType).toBe("none")
    const payload = vi.mocked(api.addHistoricalRecords).mock.calls[0][0] as any
    expect(payload.type).toBe("terrainSlop")
    expect(payload.title).toContain("坡度坡向记录")
    // 多边形绘制中：清除/完成按钮可见
    expect(wrapper.find(".bottom-handle-btns").exists()).toBe(true)
    wrapper.unmount()
  })

  it("绘制矩形：轮廓坐标入参，且绘制按钮不出现", async () => {
    const getOutlinePositions = vi.fn(() => [[5, 6], [7, 8]])
    vi.mocked(mapWork.onClickDrawGraphic).mockResolvedValue({ type: "rectangle", getOutlinePositions } as any)
    const wrapper = mountPage(SlopeAdd)
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("矩形"))!.trigger("click")
    await flushPromises()
    expect(getOutlinePositions).toHaveBeenCalledWith(false)
    const arg = vi.mocked(mapWork.addTerrainSlop).mock.calls[0][0] as any
    expect(arg.type).toBe("rectangle")
    expect(arg.positions).toEqual([[5, 6], [7, 8]])
    // 矩形模板分支：v-if="drawingGraphic && content.type !== 'rectangle'"
    expect(wrapper.find(".bottom-handle-btns").exists()).toBe(false)
    wrapper.unmount()
  })

  it("编辑态：属性弹层含插值数与地表渲染，切坡向触发 onChangeShadingType；删除调用 removeSlopeData", async () => {
    const wrapper = mountPage(SlopeAdd)
    fireEvt("drawCreatedEditingMeasure", {})
    const attr = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("属性"))!
    await attr.trigger("click")
    const popup = wrapper.find(".van-popup")
    expect(popup.text()).toContain("参数设置")
    expect(popup.text()).toContain("插值数")
    expect(popup.text()).toContain("地表渲染")
    const aspect = popup.findAll(".van-radio").find((r) => r.text().includes("坡向"))!
    await aspect.trigger("click")
    expect(mapWork.onChangeShadingType).toHaveBeenCalledWith("aspect")
    const del = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("删除"))!
    await del.trigger("click")
    expect(mapWork.removeSlopeData).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it("携带 query.id 挂载：加载记录并恢复插值数/渲染参数", async () => {
    await router.push({ name: "slope-add", query: { id: "s7" } })
    await flushPromises()
    vi.mocked(api.getHistoricalRecordsById).mockResolvedValue({
      code: 200,
      data: { id: "s7", content: JSON.stringify({ type: "polygon", positions: [[1, 1]], splitNum: 20, shadingType: "slope" }) }
    } as any)
    const wrapper = mountPage(SlopeAdd)
    await flushPromises()
    expect(api.getHistoricalRecordsById).toHaveBeenCalledWith("s7")
    expect(mapWork.addTerrainSlop).toHaveBeenCalledWith({ type: "polygon", positions: [[1, 1]], splitNum: 20, shadingType: "slope" })
    wrapper.unmount()
  })
})
