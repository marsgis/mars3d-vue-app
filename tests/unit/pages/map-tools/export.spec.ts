import { describe, it, expect, vi, beforeEach } from "vitest"
import { router } from "@mars/routes"

import Export from "@mars/views/analysis/export/index.vue"
import * as mapWork from "@mars/views/analysis/export/map"
import { mountPage } from "../../../helpers/page"

vi.mock("@mars/views/analysis/export/map", () => ({
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
  expImage: vi.fn()
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("export 地图导出", () => {
  it("渲染冒烟：标题、截图按钮、提示按钮", () => {
    const wrapper = mountPage(Export)
    expect(wrapper.text()).toContain("地图导出")
    expect(wrapper.text()).toContain("截图")
    expect(wrapper.text()).toContain("提示")
    wrapper.unmount()
  })

  it("点击「截图」调用 mapWork.expImage", async () => {
    const wrapper = mountPage(Export)
    await wrapper.findAll(".home-handle-item").find((i) => i.text().includes("截图"))!.trigger("click")
    expect(mapWork.expImage).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it("点击「提示」打开提示弹层；导航栏返回 router.go(-1)", async () => {
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountPage(Export)
    // 提示按钮是 pannel 内层 div 的 @click；第一个 div 是 pannel-content 容器，需点到其直接子级
    await wrapper.find(".tool-single-button .pannel-content > div").trigger("click")
    expect(wrapper.find(".van-popup").text()).toContain("可能无法导出截图")
    await wrapper.find(".van-nav-bar__left").trigger("click")
    expect(goSpy).toHaveBeenCalledWith(-1)
    goSpy.mockRestore()
    wrapper.unmount()
  })
})
