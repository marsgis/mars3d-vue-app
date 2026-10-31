import { describe, it, expect } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import VisibleIndex from "@mars/views/analysis/visible/index.vue"
import { mountPage } from "../../../helpers/page"

describe("visible/index 容器壳", () => {
  it("子路由激活时挂载：渲染 router-view 出口，不报错", async () => {
    // 初始路由 "/" 下 router-view 无匹配子页渲染为空，需先激活子路由（重定向到 visible-add）
    await router.push("/analysis/visible")
    await flushPromises()
    const wrapper = mountPage(VisibleIndex)
    expect(wrapper.html().length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it("路由 /analysis/visible 重定向到 visible-add 子页并渲染", async () => {
    await import("@mars/views/analysis/visible/add/index.vue")
    await router.push("/analysis/visible")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("visible-add")
    const wrapper = mountPage(VisibleIndex)
    expect(wrapper.text()).toContain("可视域")
    expect(wrapper.text()).toContain("绘制")
    wrapper.unmount()
  })
})
