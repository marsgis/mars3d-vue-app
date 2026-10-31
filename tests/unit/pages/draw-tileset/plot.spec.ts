import { describe, it, expect } from "vitest"
import Plot from "@mars/views/draw/plot/index.vue"
import { mountPage } from "../../../helpers/page"

describe("draw/plot 容器壳", () => {
  it("渲染 router-view 壳且挂载不报错", () => {
    const wrapper = mountPage(Plot, { stubs: { RouterView: true } })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toContain("router-view")
    wrapper.unmount()
  })
})
