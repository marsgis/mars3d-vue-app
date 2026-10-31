import { describe, it, expect } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import VolumeIndex from "@mars/views/analysis/volume/index.vue"
import { mountPage } from "../../../helpers/page"

describe("volume/index 容器壳", () => {
  it("子路由激活时挂载：渲染 router-view 出口，不报错", async () => {
    // 初始路由 "/" 下 router-view 无匹配子页渲染为空，需先激活子路由（重定向到 volume-add）
    await router.push("/analysis/volume")
    await flushPromises()
    const wrapper = mountPage(VolumeIndex)
    expect(wrapper.html().length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it("路由 /analysis/volume 重定向到 volume-add 子页并渲染", async () => {
    await import("@mars/views/analysis/volume/add/index.vue")
    await router.push("/analysis/volume")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("volume-add")
    const wrapper = mountPage(VolumeIndex)
    expect(wrapper.text()).toContain("方量分析")
    expect(wrapper.text()).toContain("绘制")
    wrapper.unmount()
  })
})
