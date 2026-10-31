import { describe, it, expect } from "vitest"
import Marker from "@mars/views/draw/marker/index.vue"
import { mountPage } from "../../../helpers/page"

// 容器壳页：仅渲染 router-view，子页面由各自 spec 覆盖；stub 掉 RouterView 避免懒加载首页整图
describe("draw/marker 容器壳", () => {
  it("渲染 router-view 壳且挂载不报错", () => {
    const wrapper = mountPage(Marker, { stubs: { RouterView: true } })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toContain("router-view")
    wrapper.unmount()
  })
})
