import { describe, it, expect, vi, beforeEach } from "vitest"

import Opacity from "@mars/views/terrain/opacity/index.vue"
import * as mapWork from "@mars/views/terrain/opacity/map"
import { mountPage } from "../../../helpers/page"

vi.mock("@mars/views/terrain/opacity/map", () => ({
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
  onChangeGraphicStyle: vi.fn(),
  onCheckedOpacity: vi.fn(),
  onChangeOpacity: vi.fn()
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("opacity 地表透明", () => {
  it("渲染冒烟：标题、属性按钮、提示入口", () => {
    const wrapper = mountPage(Opacity)
    expect(wrapper.text()).toContain("地表透明")
    expect(wrapper.text()).toContain("属性")
    expect(wrapper.text()).toContain("提示")
    wrapper.unmount()
  })

  it("点击「属性」打开参数设置弹层：开关与透明度滑块渲染", async () => {
    const wrapper = mountPage(Opacity)
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("属性"))!.trigger("click")
    const popup = wrapper.find(".van-popup")
    expect(popup.text()).toContain("参数设置")
    expect(popup.text()).toContain("开启状态")
    expect(popup.text()).toContain("地表透明度")
    wrapper.unmount()
  })

  it("切换「开启状态」开关：onChangeGraphicStyle('enabled', 新值)", async () => {
    const wrapper = mountPage(Opacity)
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("属性"))!.trigger("click")
    const sw = wrapper.find(".van-popup .van-switch")
    expect(sw.classes()).toContain("van-switch--on")
    await sw.trigger("click")
    expect(mapWork.onChangeGraphicStyle).toHaveBeenCalledWith("enabled", false)
    wrapper.unmount()
  })
})
