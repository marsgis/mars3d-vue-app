import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import ClipAdd from "@mars/views/terrain/clip/add/index.vue"
import * as api from "@mars/common/api"
import * as mapWork from "@mars/views/terrain/clip/add/map"
import { mountPage } from "../../../helpers/page"

vi.mock("@mars/common/api", () => ({
  getHistoricalRecordsList: vi.fn(),
  getHistoricalRecordsById: vi.fn(),
  addHistoricalRecords: vi.fn(),
  updateHistoryRecords: vi.fn(),
  deleteHistoricalRecordsById: vi.fn()
}))
vi.mock("@mars/views/terrain/clip/add/map", () => {
  const eventTarget = { on: vi.fn(), off: vi.fn(), fire: vi.fn() }
  return {
    eventTarget,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    removeAll: vi.fn(),
    clearDraw: vi.fn(),
    endDraw: vi.fn(),
    onClickDrawGraphic: vi.fn(),
    addTerrainClip: vi.fn(),
    getGraphicStyle: vi.fn(),
    onChangeClipHeight: vi.fn()
  }
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe("clip/add 地形开挖绘制页", () => {
  it("渲染冒烟：矩形/多边形/列表按钮、提示入口", () => {
    const wrapper = mountPage(ClipAdd)
    const tools = wrapper.findAll(".home-handle-item").map((i) => i.text())
    expect(tools.some((t) => t.includes("矩形"))).toBe(true)
    expect(tools.some((t) => t.includes("多边形"))).toBe(true)
    expect(tools.some((t) => t.includes("列表"))).toBe(true)
    expect(wrapper.text()).toContain("提示")
    wrapper.unmount()
  })

  it("绘制多边形：addTerrainClip 收到 positions/diffHeight 并落 terrainClip 记录", async () => {
    vi.mocked(mapWork.onClickDrawGraphic).mockResolvedValue({ type: "polygon", positionsShow: [[1, 2], [3, 4]] } as any)
    vi.mocked(api.addHistoricalRecords).mockResolvedValue({ code: 200, data: { id: "c9" } } as any)
    const wrapper = mountPage(ClipAdd)
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("多边形"))!.trigger("click")
    await flushPromises()
    expect(mapWork.addTerrainClip).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(mapWork.addTerrainClip).mock.calls[0][0] as any
    expect(arg.type).toBe("polygon")
    expect(arg.positions).toEqual([[1, 2], [3, 4]])
    expect(arg.diffHeight).toBe(50) // 默认开挖深度
    const payload = vi.mocked(api.addHistoricalRecords).mock.calls[0][0] as any
    expect(payload.type).toBe("terrainClip")
    expect(payload.title).toContain("地形开挖记录")
    wrapper.unmount()
  })

  it("绘制中：完成绘制→endDraw 并进入编辑态；清除绘制→clearDraw 退出", async () => {
    // 永不 resolve 的绘制 Promise，使页面停留在绘制中状态
    vi.mocked(mapWork.onClickDrawGraphic).mockReturnValue(new Promise(() => {}))
    const wrapper = mountPage(ClipAdd)
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("多边形"))!.trigger("click")
    const btns = () => wrapper.find(".bottom-handle-btns").findAll("button")
    await btns().find((b) => b.text().includes("完成绘制"))!.trigger("click")
    expect(mapWork.endDraw).toHaveBeenCalledTimes(1)
    await btns().find((b) => b.text().includes("清除绘制"))!.trigger("click")
    expect(mapWork.clearDraw).toHaveBeenCalledTimes(1)
    expect(wrapper.find(".bottom-handle-btns").exists()).toBe(false)
    wrapper.unmount()
  })

  it("编辑态删除：removeAll 调用；属性弹层可修改开挖深度", async () => {
    const wrapper = mountPage(ClipAdd)
    // 通过完成绘制直接进入编辑态
    vi.mocked(mapWork.onClickDrawGraphic).mockReturnValue(new Promise(() => {}))
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("多边形"))!.trigger("click")
    await wrapper.find(".bottom-handle-btns").findAll("button").find((b) => b.text().includes("完成绘制"))!.trigger("click")
    const del = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("删除"))!
    await del.trigger("click")
    expect(mapWork.removeAll).toHaveBeenCalledTimes(1)
    const attr = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("属性"))!
    await attr.trigger("click")
    const popup = wrapper.find(".van-popup")
    expect(popup.text()).toContain("参数设置")
    expect(popup.text()).toContain("开挖深度")
    wrapper.unmount()
  })

  it("携带 query.id 挂载：加载记录并 addTerrainClip 恢复", async () => {
    await router.push({ name: "terrain-clip-add", query: { id: "c8" } })
    await flushPromises()
    vi.mocked(api.getHistoricalRecordsById).mockResolvedValue({
      code: 200,
      data: { id: "c8", content: JSON.stringify({ type: "polygon", positions: [[2, 2]], diffHeight: 88 }) }
    } as any)
    const wrapper = mountPage(ClipAdd)
    await flushPromises()
    expect(api.getHistoricalRecordsById).toHaveBeenCalledWith("c8")
    expect(mapWork.addTerrainClip).toHaveBeenCalledWith({ type: "polygon", positions: [[2, 2]], diffHeight: 88 })
    wrapper.unmount()
  })
})
