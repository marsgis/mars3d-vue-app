import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import Limit from "@mars/views/tileset/limit/index.vue"
import { mountPage } from "../../../helpers/page"

// 限高分析页无接口依赖，仅 mock 页面 map.ts 桥接层
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
    removeModelLimitData: vi.fn(),
    clearDraw: vi.fn(),
    endDraw: vi.fn(),
    onClickDrawGraphic: vi.fn(),
    addModelLimit: vi.fn(),
    onMapClickPoint: vi.fn(),
    onChangeLimitBottomHeight: vi.fn(),
    onChangeLimitHeight: vi.fn()
  }
})
vi.mock("@mars/views/tileset/limit/map", () => mapWorkMock)

beforeEach(() => {
  vi.clearAllMocks()
})

function editingPanelDisplay(wrapper: any): string {
  const attrItem = wrapper.findAll(".home-handle-item").find((el) => el.text().includes("属性"))!
  const panel = (attrItem.element as HTMLElement).closest(".pannel-box") as HTMLElement
  return panel.style.display
}

describe("tileset-limit 限高分析", () => {
  it("渲染冒烟：导航标题、矩形/面入口与提示按钮", () => {
    const wrapper = mountPage(Limit)
    expect(wrapper.text()).toContain("限高分析")
    expect(wrapper.text()).toContain("矩形")
    expect(wrapper.text()).toContain("面")
    expect(wrapper.text()).toContain("提示")
    wrapper.unmount()
  })

  it("点击「矩形」绘制：调用 addModelLimit 并进入编辑状态（矩形不显示完成绘制按钮）", async () => {
    mapWorkMock.onClickDrawGraphic.mockResolvedValue({ type: "rectangle", getOutlinePositions: () => [[116.1, 39.9], [116.2, 39.8]] })
    const wrapper = mountPage(Limit)
    const rectItem = wrapper.findAll(".home-handle-item").find((el) => el.text().includes("矩形"))!
    await rectItem.trigger("click")
    await flushPromises()
    expect(mapWorkMock.onClickDrawGraphic).toHaveBeenCalledWith("rectangle")
    expect(mapWorkMock.addModelLimit).toHaveBeenCalledWith([[116.1, 39.9], [116.2, 39.8]])
    expect(editingPanelDisplay(wrapper)).not.toBe("none")
    wrapper.unmount()
  })

  it("点击「面」绘制中显示完成绘制按钮，点击后调用 endDraw 并以多边形坐标完成分析", async () => {
    let resolveDraw!: (v: any) => void
    mapWorkMock.onClickDrawGraphic.mockImplementation(() => new Promise<any>((resolve) => (resolveDraw = resolve)))
    const wrapper = mountPage(Limit)
    const polyItem = wrapper.findAll(".home-handle-item").find((el) => el.text().includes("面"))!
    await polyItem.trigger("click")
    await flushPromises()
    expect(wrapper.text()).toContain("完成绘制")
    const okBtn = wrapper.findAll("button").find((b) => b.text().includes("完成绘制"))!
    await okBtn.trigger("click")
    expect(mapWorkMock.endDraw).toHaveBeenCalledTimes(1)
    resolveDraw({ type: "polygon", positionsShow: [[116.1, 39.9], [116.2, 39.9], [116.2, 39.8]] })
    await flushPromises()
    expect(mapWorkMock.addModelLimit).toHaveBeenCalledWith([[116.1, 39.9], [116.2, 39.9], [116.2, 39.8]])
    wrapper.unmount()
  })

  it("绘制中点击「清除绘制」调用 clearDraw 并隐藏绘制中按钮", async () => {
    mapWorkMock.onClickDrawGraphic.mockImplementation(() => new Promise<any>(() => {}))
    const wrapper = mountPage(Limit)
    // 矩形类型绘制中不显示完成/清除按钮（GraphicType !== 'rectangle' 才显示），改用面类型
    const polyItem = wrapper.findAll(".home-handle-item").find((el) => el.text().includes("面"))!
    await polyItem.trigger("click")
    await flushPromises()
    expect(wrapper.text()).toContain("完成绘制")
    const clearBtn = wrapper.findAll("button").find((b) => b.text().includes("清除绘制"))!
    await clearBtn.trigger("click")
    await flushPromises()
    expect(mapWorkMock.clearDraw).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).not.toContain("完成绘制")
    wrapper.unmount()
  })

  it("点击「提示」打开操作说明弹层", async () => {
    const wrapper = mountPage(Limit)
    const tip = wrapper.findAll("p").find((p) => p.text() === "提示")!
    await tip.trigger("click")
    await flushPromises()
    expect(wrapper.text()).toContain("限高分析提示")
    expect(wrapper.text()).toContain("操作说明")
    wrapper.unmount()
  })
})
