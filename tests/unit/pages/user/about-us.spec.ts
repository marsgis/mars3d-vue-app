import { describe, it, expect, vi, afterEach } from "vitest"
import { router } from "@mars/routes"

import AboutUs from "@mars/views/user/about-us/index.vue"
import { mountPage } from "../../../helpers/page"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("about-us 关于页", () => {
  it("渲染应用名、版本与站点信息列表", () => {
    const wrapper = mountPage(AboutUs)
    expect(wrapper.text()).toContain("关于")
    expect(wrapper.text()).toContain("Mars3D APP")
    expect(wrapper.text()).toContain("V3.4.0")
    expect(wrapper.text()).toContain("产品官网")
    expect(wrapper.text()).toContain("公司官网")
    expect(wrapper.text()).toContain("微信公众号")
    expect(wrapper.text()).toContain("客服热线")
    wrapper.unmount()
  })

  it("点击导航栏返回按钮调用 router.go(-1)", async () => {
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountPage(AboutUs)
    await wrapper.find(".van-nav-bar__left").trigger("click")
    expect(goSpy).toHaveBeenCalledWith(-1)
    wrapper.unmount()
  })

  it("点击产品官网：浏览器环境走 window.open 打开 mars3d.cn", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation((() => null) as any)
    const wrapper = mountPage(AboutUs)
    const cell = wrapper.findAll(".van-cell").find((c) => c.text().includes("产品官网"))!
    await cell.trigger("click")
    expect(openSpy).toHaveBeenCalledWith("http://mars3d.cn/")
    wrapper.unmount()
  })

  it("点击公司官网：浏览器环境走 window.open 打开 marsgis.cn", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation((() => null) as any)
    const wrapper = mountPage(AboutUs)
    const cell = wrapper.findAll(".van-cell").find((c) => c.text().includes("公司官网"))!
    await cell.trigger("click")
    expect(openSpy).toHaveBeenCalledWith("http://marsgis.cn/")
    wrapper.unmount()
  })
})
