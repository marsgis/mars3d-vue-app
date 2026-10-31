import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import ClipAdd from "@mars/views/tileset/clip/add/index.vue"
import { router } from "@mars/routes"
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
    clearModelClipData: vi.fn(),
    onClickDrawGraphic: vi.fn(),
    addModelClip: vi.fn(),
    getGraphicStyle: vi.fn(),
    onChangeOutsideClip: vi.fn(),
    onClipDistance: vi.fn(),
    onCheckedModel: vi.fn(),
    clipping: vi.fn(),
    flyToGraphic: vi.fn()
  }
})
vi.mock("@mars/views/tileset/clip/add/map", () => mapWorkMock)

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

/** 断言「属性」按钮所在的编辑面板显示状态 */
function editingPanelDisplay(wrapper: any): string {
  const attrItem = wrapper.findAll(".home-handle-item").find((el) => el.text().includes("属性"))!
  const panel = (attrItem.element as HTMLElement).closest(".pannel-box") as HTMLElement
  return panel.style.display
}

describe("tileset-clip-add 模型剖切新增", () => {
  it("渲染冒烟：导航标题、线/矩形/列表入口与提示按钮", () => {
    const wrapper = mountPage(ClipAdd)
    expect(wrapper.text()).toContain("模型剖切")
    expect(wrapper.text()).toContain("线")
    expect(wrapper.text()).toContain("矩形")
    expect(wrapper.text()).toContain("列表")
    expect(wrapper.text()).toContain("提示")
    wrapper.unmount()
  })

  it("点击「线」绘制成功：调用 addModelClip 并新增 modelClip 历史记录，编辑面板出现", async () => {
    mapWorkMock.onClickDrawGraphic.mockResolvedValue({ type: "polyline", positionsShow: [[116.1, 39.9], [116.2, 39.8]] })
    mapWorkMock.addModelClip.mockReturnValue(true)
    mockedAdd.mockResolvedValue({ code: 200, data: { id: "h1" } } as any)
    const wrapper = mountPage(ClipAdd)
    const lineItem = wrapper.findAll(".home-handle-item").find((el) => el.text().includes("线"))!
    await lineItem.trigger("click")
    await flushPromises()
    expect(mapWorkMock.onClickDrawGraphic).toHaveBeenCalledWith("polyline")
    expect(mapWorkMock.addModelClip).toHaveBeenCalledWith([[116.1, 39.9], [116.2, 39.8]], false)
    expect(mockedAdd).toHaveBeenCalledTimes(1)
    const payload = mockedAdd.mock.calls[0][0] as any
    expect(payload.type).toBe("modelClip")
    expect(payload.title).toContain("模型剖切记录")
    expect(editingPanelDisplay(wrapper)).not.toBe("none")
    wrapper.unmount()
  })

  it("模型拾取失败（addModelClip 返回 false）：不新增记录，编辑面板保持隐藏", async () => {
    mapWorkMock.onClickDrawGraphic.mockResolvedValue({ type: "rectangle", getOutlinePositions: () => [[1, 2], [3, 4]] })
    mapWorkMock.addModelClip.mockReturnValue(false)
    const wrapper = mountPage(ClipAdd)
    const rectItem = wrapper.findAll(".home-handle-item").find((el) => el.text().includes("矩形"))!
    await rectItem.trigger("click")
    await flushPromises()
    expect(mapWorkMock.addModelClip).toHaveBeenCalled()
    expect(mockedAdd).not.toHaveBeenCalled()
    expect(editingPanelDisplay(wrapper)).toBe("none")
    wrapper.unmount()
  })

  it("点击「列表」跳转 tileset-clip-list", async () => {
    // 目标为嵌套路由子页：导航会懒加载父壳 + 子页，动态 import 属宏任务，flushPromises 覆盖不到，需一并预加载
    await import("@mars/views/tileset/clip/index.vue")
    await import("@mars/views/tileset/clip/list/index.vue")
    const wrapper = mountPage(ClipAdd)
    const listItem = wrapper.findAll(".home-handle-item").find((el) => el.text().includes("列表"))!
    await listItem.trigger("click")
    await flushPromises()
    // 防御性等待导航落定（懒加载/初始导航可能引入宏任务）
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe("tileset-clip-list"), { timeout: 5000 })
    wrapper.unmount()
  })
})
