import { describe, it, expect } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import SlopeIndex from "@mars/views/terrain/slope/index.vue"
import { mountPage } from "../../../helpers/page"

describe("slope/index 容器壳", () => {
  it("子路由激活时挂载：渲染 router-view 出口，不报错", async () => {
    // 初始路由 "/" 下 router-view 无匹配子页渲染为空，需先激活子路由（重定向到 slope-add）
    await router.push("/terrain-slope")
    await flushPromises()
    const wrapper = mountPage(SlopeIndex)
    expect(wrapper.html().length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it("路由 /terrain-slope 重定向到 slope-add 子页并渲染", async () => {
    await import("@mars/views/terrain/slope/add/index.vue")
    await router.push("/terrain-slope")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("slope-add")
    const wrapper = mountPage(SlopeIndex)
    expect(wrapper.text()).toContain("坡度坡向")
    expect(wrapper.text()).toContain("矩形")
    wrapper.unmount()
  })
})
