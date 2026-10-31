import { describe, it, expect } from "vitest"
import TilesetFlat from "@mars/views/tileset/flat/index.vue"
import { mountPage } from "../../../helpers/page"

describe("tileset/flat 容器壳", () => {
  it("渲染 router-view 壳且挂载不报错", () => {
    const wrapper = mountPage(TilesetFlat, { stubs: { RouterView: true } })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toContain("router-view")
    wrapper.unmount()
  })
})
