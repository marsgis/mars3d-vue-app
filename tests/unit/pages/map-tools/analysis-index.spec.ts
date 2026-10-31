import { describe, it, expect } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import AnalysisIndex from "@mars/views/analysis/index.vue"
import { mountPage } from "../../../helpers/page"

describe("analysis/index 容器壳", () => {
  it("子路由激活时挂载：渲染 router-view 出口，不报错", async () => {
    // 初始路由 "/" 下 router-view 无匹配子页渲染为空，需先激活子路由
    await router.push("/analysis/measure")
    await flushPromises()
    const wrapper = mountPage(AnalysisIndex)
    expect(wrapper.html().length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it("路由指向 measure 子页时渲染子页面", async () => {
    await import("@mars/views/analysis/measure/index.vue")
    await router.push("/analysis/measure")
    await flushPromises()
    const wrapper = mountPage(AnalysisIndex)
    expect(wrapper.text()).toContain("图上量算")
    wrapper.unmount()
  })
})
