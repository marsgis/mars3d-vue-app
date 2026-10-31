import { describe, it, expect } from "vitest"
import TilesetClip from "@mars/views/tileset/clip/index.vue"
import { mountPage } from "../../../helpers/page"

describe("tileset/clip 容器壳", () => {
  it("渲染 router-view 壳且挂载不报错", () => {
    const wrapper = mountPage(TilesetClip, { stubs: { RouterView: true } })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toContain("router-view")
    wrapper.unmount()
  })
})
