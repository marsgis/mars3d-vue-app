import { describe, it, expect } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import ClipIndex from "@mars/views/terrain/clip/index.vue"
import { mountPage } from "../../../helpers/page"

describe("clip/index 容器壳", () => {
  it("子路由激活时挂载：渲染 router-view 出口，不报错", async () => {
    // 初始路由 "/" 下 router-view 无匹配子页渲染为空，需先激活子路由（重定向到 terrain-clip-add）
    await router.push("/terrain-clip")
    await flushPromises()
    const wrapper = mountPage(ClipIndex)
    expect(wrapper.html().length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it("路由 /terrain-clip 重定向到 terrain-clip-add 子页并渲染", async () => {
    await import("@mars/views/terrain/clip/add/index.vue")
    await router.push("/terrain-clip")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("terrain-clip-add")
    const wrapper = mountPage(ClipIndex)
    expect(wrapper.text()).toContain("地形开挖")
    expect(wrapper.text()).toContain("矩形")
    wrapper.unmount()
  })
})
