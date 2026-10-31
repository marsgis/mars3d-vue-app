import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import MapCompare from "@mars/views/analysis/map-compare/index.vue"
import * as mapWork from "@mars/views/analysis/map-compare/map"
import { mountPage } from "../../../helpers/page"

vi.mock("@mars/views/analysis/map-compare/map", () => {
  const eventTarget = { on: vi.fn(), off: vi.fn(), fire: vi.fn() }
  return {
    eventTarget,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    getMapExOptions: vi.fn(),
    changeBaseMaps: vi.fn(),
    changeTerrain: vi.fn(),
    getLayers: vi.fn(),
    addLayer: vi.fn()
  }
})

const childLayer = { id: 2, pid: 1, name: "边界线", type: "geojson", hasOpacity: false, hasZIndex: false, isAdded: true, show: false, flyTo: vi.fn() }

function setupMapMock() {
  vi.mocked(mapWork.getMapExOptions).mockReturnValue({
    baseMaps: [
      { name: "影像地图", id: "img", isAdded: true, show: true, options: { icon: "a.png" } },
      { name: "电子地图", id: "vec", isAdded: false, show: false, options: {} }
    ],
    hasTerrain: true
  } as any)
  vi.mocked(mapWork.getLayers).mockReturnValue([
    // 根图层无需 _hasMapInit 内部标记：页面已改为不依赖库内部标记，pid===-1 直接作为分组标题（I030 回归）
    { id: 1, pid: -1, name: "业务图层", type: "graphics", hasOpacity: true, opacity: 0.5, hasZIndex: false, isAdded: true, show: true },
    childLayer
  ] as any)
}

beforeEach(() => {
  vi.clearAllMocks()
  childLayer.flyTo.mockClear()
  setupMapMock()
})

describe("map-compare 地图对比", () => {
  it("渲染冒烟：标题、缩略图入口、外层图层组件", () => {
    const wrapper = mountPage(MapCompare, { stubs: { LayerShortcut: true } })
    expect(wrapper.text()).toContain("地图对比")
    expect(wrapper.find(".thumbnail").exists()).toBe(true)
    wrapper.unmount()
  })

  it("打开底图切换弹层：底图卡片渲染且当前底图高亮", async () => {
    const wrapper = mountPage(MapCompare, { stubs: { LayerShortcut: true } })
    await flushPromises()
    await wrapper.find(".thumbnail").trigger("click")
    const popup = wrapper.find(".van-popup")
    expect(popup.text()).toContain("底图切换")
    const cards = popup.findAll(".basemap-card")
    expect(cards.length).toBe(2)
    expect(cards[0].text()).toContain("影像地图")
    expect(cards[0].classes()).toContain("active-card")
    expect(cards[1].classes()).not.toContain("active-card")
    wrapper.unmount()
  })

  it("点击其他底图卡片：changeBaseMaps 收到目标 id 且高亮切换", async () => {
    const wrapper = mountPage(MapCompare, { stubs: { LayerShortcut: true } })
    await flushPromises()
    await wrapper.find(".thumbnail").trigger("click")
    const cards = wrapper.findAll(".basemap-card")
    await cards[1].trigger("click")
    expect(mapWork.changeBaseMaps).toHaveBeenCalledWith("vec")
    expect(cards[1].classes()).toContain("active-card")
    wrapper.unmount()
  })

  it("切换「是否显示地形」开关：changeTerrain 收到新值", async () => {
    const wrapper = mountPage(MapCompare, { stubs: { LayerShortcut: true } })
    await flushPromises()
    await wrapper.find(".thumbnail").trigger("click")
    const terrainSwitch = wrapper.find(".mars-cell .van-switch")
    expect((terrainSwitch.element as HTMLElement).classList.contains("van-switch--on")).toBe(true)
    await terrainSwitch.trigger("click")
    expect(mapWork.changeTerrain).toHaveBeenCalledWith(false)
    wrapper.unmount()
  })

  it("打开图层开关（show: false → true）：图层 show 置真并 flyTo 定位", async () => {
    const wrapper = mountPage(MapCompare, { stubs: { LayerShortcut: true } })
    await flushPromises()
    await wrapper.find(".thumbnail").trigger("click")
    const popup = wrapper.find(".van-popup")
    expect(popup.text()).toContain("业务图层")
    const layerCell = popup.findAll(".van-cell").find((c) => c.text().includes("边界线"))!
    const layerSwitch = layerCell.find(".van-switch")
    expect(layerSwitch.classes()).not.toContain("van-switch--on")
    await layerSwitch.trigger("click")
    await flushPromises()
    expect(childLayer.flyTo).toHaveBeenCalledTimes(1)
    expect(childLayer.show).toBe(true)
    // 图层已在场景中，不重复 addLayer
    expect(mapWork.addLayer).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
