import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import FlatAdd from "@mars/views/tileset/flat/add/index.vue"
import { mountPage } from "../../../helpers/page"
import { addHistoricalRecords } from "@mars/common/api"

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
    clearModelFlatData: vi.fn(),
    sureAnalysis: vi.fn(),
    onClickDrawGraphic: vi.fn(),
    getGraphicStyle: vi.fn(),
    showMxypTilesetFlat: vi.fn(),
    onCheckedModelFlat: vi.fn(),
    onChangeFlatHeight: vi.fn()
  }
})
vi.mock("@mars/views/tileset/flat/add/map", () => mapWorkMock)

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

const mockedAdd = vi.mocked(addHistoricalRecords)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("tileset-flat-add 模型压平新增", () => {
  it("渲染冒烟：标题、绘制/删除入口，「设置」入口在未绘制时不出现", () => {
    const wrapper = mountPage(FlatAdd)
    expect(wrapper.text()).toContain("模型压平")
    const rightBtns = wrapper.findAll(".mars-text-btn").map((s) => s.text())
    expect(rightBtns).toContain("绘制")
    expect(rightBtns).toContain("删除")
    expect(wrapper.text()).not.toContain("设置")
    wrapper.unmount()
  })

  it("添加→矩形绘制成功：调用压平分析并新增 modelFlat 历史记录，「设置」入口出现", async () => {
    mapWorkMock.onClickDrawGraphic.mockResolvedValue({
      type: "rectangle",
      getOutlinePositions: () => [[116.1, 39.9], [116.2, 39.9], [116.2, 39.8]]
    })
    mapWorkMock.showMxypTilesetFlat.mockReturnValue(true)
    mockedAdd.mockResolvedValue({ code: 200, data: { id: "f1" } } as any)
    const wrapper = mountPage(FlatAdd)
    await wrapper.findAll(".mars-text-btn").find((s) => s.text() === "绘制")!.trigger("click")
    await flushPromises()
    // action-sheet 原位渲染，第一项为「矩形」
    const rectItem = wrapper.findAll(".van-action-sheet__item")[0]
    await rectItem.trigger("click")
    await flushPromises()
    expect(mapWorkMock.onClickDrawGraphic).toHaveBeenCalledWith("rectangle")
    expect(mapWorkMock.showMxypTilesetFlat).toHaveBeenCalled()
    const arg = mapWorkMock.showMxypTilesetFlat.mock.calls[0][0] as any
    expect(arg.positions).toEqual([[116.1, 39.9], [116.2, 39.9], [116.2, 39.8]])
    expect(mockedAdd).toHaveBeenCalledTimes(1)
    expect((mockedAdd.mock.calls[0][0] as any).type).toBe("modelFlat")
    expect(wrapper.findAll(".mars-text-btn").map((s) => s.text())).toContain("设置")
    wrapper.unmount()
  })

  it("模型拾取失败（压平分析返回 false）：不新增记录，「设置」入口保持隐藏", async () => {
    mapWorkMock.onClickDrawGraphic.mockResolvedValue({
      type: "polygon",
      positionsShow: [[116.1, 39.9], [116.2, 39.9], [116.2, 39.8]]
    })
    mapWorkMock.showMxypTilesetFlat.mockReturnValue(false)
    const wrapper = mountPage(FlatAdd)
    await wrapper.findAll(".mars-text-btn").find((s) => s.text() === "绘制")!.trigger("click")
    await flushPromises()
    const polyItem = wrapper.findAll(".van-action-sheet__item").find((i) => i.text().includes("多边形"))!
    await polyItem.trigger("click")
    await flushPromises()
    expect(mapWorkMock.showMxypTilesetFlat).toHaveBeenCalled()
    expect(mockedAdd).not.toHaveBeenCalled()
    expect(wrapper.findAll(".mars-text-btn").map((s) => s.text())).not.toContain("设置")
    wrapper.unmount()
  })

  it("点击「删除」清除压平数据（无已保存记录时不调用删除接口）", async () => {
    const wrapper = mountPage(FlatAdd)
    await wrapper.findAll(".mars-text-btn").find((s) => s.text() === "删除")!.trigger("click")
    await flushPromises()
    expect(mapWorkMock.clearModelFlatData).toHaveBeenCalledTimes(1)
    expect(mockedAdd).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
