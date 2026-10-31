import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import Measure from "@mars/views/analysis/measure/index.vue"
import * as mapWork from "@mars/views/analysis/measure/map"
import { mountPage } from "../../../helpers/page"
import { fire } from "./helpers"

// map.ts 为项目内文件，用 vi.mock 受控替换，断言 mapWork 调用
vi.mock("@mars/views/analysis/measure/map", () => {
  const eventTarget = { on: vi.fn(), off: vi.fn(), fire: vi.fn() }
  return {
    eventTarget,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    clearDraw: vi.fn(),
    endMesureDraw: vi.fn(),
    showTipMarker: vi.fn(),
    hideTipMarker: vi.fn(),
    onClickMeasureDistance: vi.fn(),
    onClickMeasureDistanceSurface: vi.fn(),
    onClickMeasureSection: vi.fn(),
    onClickMeasureArea: vi.fn(),
    onClickMeasureAngle: vi.fn(),
    onClickMeasureHeightTriangle: vi.fn(),
    // 模板内联 mapWork.endMesureDraw() 编译后经 _isRef(mapWork) 判断，mock 命名空间需补该标记
    __v_isRef: false
  }
})
// 页面 onMounted 里 echarts.init（happy-dom 无 2D 上下文），受控替换
vi.mock("echarts", () => ({
  init: vi.fn(() => ({ setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(), isDisposed: vi.fn(() => false) })),
  graphic: { LinearGradient: vi.fn() }
}))

const fireEvt = (event: string, payload?: any) => fire(mapWork as any, event, payload)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("measure 图上量算", () => {
  it("渲染冒烟：标题、六个量算工具、帮助与默认单位", () => {
    const wrapper = mountPage(Measure)
    expect(wrapper.text()).toContain("图上量算")
    const tools = wrapper.findAll(".home-handle-item")
    expect(tools.length).toBe(6)
    const names = tools.map((t) => t.text())
    for (const n of ["空间", "贴地", "剖面", "面积", "角度", "三角"]) {
      expect(names.some((x) => x.includes(n))).toBe(true)
    }
    expect(wrapper.find(".tool-content_name").text()).toBe("自动")
    wrapper.unmount()
  })

  it("选择「空间」：按距离单位调用 onClickMeasureDistance，进入绘制状态", async () => {
    const wrapper = mountPage(Measure)
    const space = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("空间"))!
    await space.trigger("click")
    expect(mapWork.onClickMeasureDistance).toHaveBeenCalledWith("auto")
    // sureMeasure 工具：绘制中显示清除/完成按钮
    const btns = wrapper.find(".bottom-handle-btns")
    expect(btns.exists()).toBe(true)
    expect(btns.text()).toContain("清除绘制")
    expect(btns.text()).toContain("完成绘制")
    wrapper.unmount()
  })

  it("选择「角度」：无需单位参数调用 onClickMeasureAngle，不进入绘制状态", () => {
    const wrapper = mountPage(Measure)
    const angle = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("角度"))!
    angle.trigger("click")
    expect(mapWork.onClickMeasureAngle).toHaveBeenCalledTimes(1)
    expect(mapWork.onClickMeasureAngle.mock.calls[0].length).toBe(0)
    expect(wrapper.find(".bottom-handle-btns").exists()).toBe(false)
    wrapper.unmount()
  })

  it("切换单位：打开单位面板选「公里」后，绘制按公里单位执行", async () => {
    const wrapper = mountPage(Measure)
    await wrapper.find(".tool-content").trigger("click")
    const sheet = wrapper.find(".van-action-sheet")
    expect(sheet.exists()).toBe(true)
    expect(sheet.text()).toContain("单位切换")
    const km = sheet.findAll(".van-action-sheet__item").find((i) => i.text().includes("公里"))!
    await km.trigger("click")
    await flushPromises()
    expect(wrapper.find(".tool-content_name").text()).toBe("公里")
    const space = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("空间"))!
    space.trigger("click")
    expect(mapWork.onClickMeasureDistance).toHaveBeenCalledWith("km")
    wrapper.unmount()
  })

  it("绘制中点击「完成绘制」与「清除绘制」：分别调用 endMesureDraw / clearDraw+hideTipMarker", async () => {
    const wrapper = mountPage(Measure)
    const space = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("空间"))!
    await space.trigger("click")
    const btns = () => wrapper.find(".bottom-handle-btns").findAll("button")
    await btns().find((b) => b.text().includes("完成绘制"))!.trigger("click")
    expect(mapWork.endMesureDraw).toHaveBeenCalledTimes(1)
    await btns().find((b) => b.text().includes("清除绘制"))!.trigger("click")
    expect(mapWork.clearDraw).toHaveBeenCalledTimes(1)
    expect(mapWork.hideTipMarker).toHaveBeenCalledTimes(1)
    // 清除后退出绘制状态
    expect(wrapper.find(".bottom-handle-btns").exists()).toBe(false)
    wrapper.unmount()
  })

  it("事件驱动：drawCreatedEditingMeasure 进入编辑态，removeEditorStopMeasure 退出", async () => {
    const wrapper = mountPage(Measure)
    const editingPannel = () => wrapper.findAll(".pannel-box").find((p) => p.text().includes("删除"))!
    // 初始：编辑面板隐藏（v-show）
    expect(editingPannel().element.style.display).toBe("none")
    fireEvt("drawCreatedEditingMeasure", { isEditing: true })
    await flushPromises()
    expect(editingPannel().element.style.display).not.toBe("none")
    fireEvt("removeEditorStopMeasure", {})
    await flushPromises()
    expect(editingPannel().element.style.display).toBe("none")
    wrapper.unmount()
  })

  it("导航栏返回：清除通知并 router.go(-1)", async () => {
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountPage(Measure)
    await wrapper.find(".van-nav-bar__left").trigger("click")
    expect(goSpy).toHaveBeenCalledWith(-1)
    goSpy.mockRestore()
    wrapper.unmount()
  })
})
