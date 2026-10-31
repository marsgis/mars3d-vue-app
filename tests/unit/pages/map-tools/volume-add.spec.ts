import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import VolumeAdd from "@mars/views/analysis/volume/add/index.vue"
import * as api from "@mars/common/api"
import * as mapWork from "@mars/views/analysis/volume/add/map"
import { mountPage } from "../../../helpers/page"
import { fire } from "./helpers"

vi.mock("@mars/common/api", () => ({
  getHistoricalRecordsList: vi.fn(),
  getHistoricalRecordsById: vi.fn(),
  addHistoricalRecords: vi.fn(),
  updateHistoryRecords: vi.fn(),
  deleteHistoricalRecordsById: vi.fn()
}))
vi.mock("@mars/views/analysis/volume/add/map", () => {
  const eventTarget = { on: vi.fn(), off: vi.fn(), fire: vi.fn() }
  return {
    eventTarget,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    clear: vi.fn(),
    clearDraw: vi.fn(),
    endDraw: vi.fn(),
    onClickAddVolume: vi.fn(),
    baseHeight: vi.fn(),
    txtMinHeight: vi.fn(),
    txtMaxHeight: vi.fn(),
    selHeight: vi.fn(),
    flyToGraphic: vi.fn(),
    // 模板内联 mapWork.clearDraw()/endDraw() 编译后经 _isRef(mapWork) 判断，mock 命名空间需补该标记
    __v_isRef: false
  }
})

const fireEvt = (event: string, payload?: any) => fire(mapWork as any, event, payload)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("volume/add 方量分析绘制页", () => {
  it("渲染冒烟：绘制/列表按钮、提示入口", () => {
    const wrapper = mountPage(VolumeAdd)
    const tools = wrapper.findAll(".home-handle-item").map((i) => i.text())
    expect(tools.some((t) => t.includes("绘制"))).toBe(true)
    expect(tools.some((t) => t.includes("列表"))).toBe(true)
    expect(wrapper.text()).toContain("提示")
    wrapper.unmount()
  })

  it("点击「绘制」：onClickAddVolume 成功后按 volume 类型落记录并回填高度参数", async () => {
    vi.mocked(mapWork.onClickAddVolume).mockResolvedValue({
      positions: [[1, 2, 3]],
      style: { height: 100, minHeight: 10, maxHeight: 200 }
    } as any)
    vi.mocked(api.addHistoricalRecords).mockResolvedValue({ code: 200, data: { id: "v9" } } as any)
    const wrapper = mountPage(VolumeAdd)
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("绘制"))!.trigger("click")
    await flushPromises()
    expect(api.addHistoricalRecords).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(api.addHistoricalRecords).mock.calls[0][0] as any
    expect(payload.type).toBe("volume")
    expect(payload.title).toContain("方量分析记录")
    const content = JSON.parse(payload.content)
    expect(content.positions).toEqual([[1, 2, 3]])
    expect(content.style).toEqual({ height: 100, minHeight: 10, maxHeight: 200 })
    wrapper.unmount()
  })

  it("drawStart 事件进入绘制态：完成绘制→endDraw，清除绘制→clearDraw", async () => {
    const wrapper = mountPage(VolumeAdd)
    expect(wrapper.find(".bottom-handle-btns").exists()).toBe(false)
    fireEvt("drawStart", {})
    await flushPromises()
    const btns = () => wrapper.find(".bottom-handle-btns").findAll("button")
    await btns().find((b) => b.text().includes("完成绘制"))!.trigger("click")
    expect(mapWork.endDraw).toHaveBeenCalledTimes(1)
    await btns().find((b) => b.text().includes("清除绘制"))!.trigger("click")
    expect(mapWork.clearDraw).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it("编辑态：删除调用 clear()，属性弹层可点选高度", async () => {
    const wrapper = mountPage(VolumeAdd)
    fireEvt("drawCreatedEditingMeasure", {})
    await flushPromises()
    const editItems = wrapper.findAll(".home-handle-item")
    const del = editItems.find((i) => i.text().includes("删除"))!
    await del.trigger("click")
    expect(mapWork.clear).toHaveBeenCalledTimes(1)
    const attr = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("属性"))!
    await attr.trigger("click")
    const popup = wrapper.find(".van-popup")
    expect(popup.text()).toContain("参数设置")
    expect(popup.text()).toContain("基准面高")
    await popup.findAll("button").find((b) => b.text().includes("点选高度"))!.trigger("click")
    expect(mapWork.selHeight).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it("携带 query.id 挂载：加载记录并 flyToGraphic 定位", async () => {
    await router.push({ name: "volume-add", query: { id: "v8" } })
    await flushPromises()
    vi.mocked(api.getHistoricalRecordsById).mockResolvedValue({
      code: 200,
      data: { id: "v8", content: JSON.stringify({ positions: [[1, 1]], style: { height: 66 } }) }
    } as any)
    const wrapper = mountPage(VolumeAdd)
    await flushPromises()
    expect(api.getHistoricalRecordsById).toHaveBeenCalledWith("v8")
    expect(mapWork.flyToGraphic).toHaveBeenCalledWith({ positions: [[1, 1]], style: { height: 66 } })
    wrapper.unmount()
  })
})
