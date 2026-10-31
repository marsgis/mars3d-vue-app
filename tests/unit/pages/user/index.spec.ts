import { describe, it, expect } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import UserIndex from "@mars/views/user/index.vue"
import { mountPage } from "../../../helpers/page"

describe("user 容器壳", () => {
  it("渲染子路由出口 router-view", () => {
    const wrapper = mountPage(UserIndex, { stubs: { RouterView: true } })
    expect(wrapper.find("router-view-stub").exists()).toBe(true)
    wrapper.unmount()
  })

  it("路由出口渲染当前子页面（/user/user-home 未登录态）", async () => {
    // 预加载目标子页组件，避免 vite-node 首次懒加载阻塞导航收尾
    await import("@mars/views/user/user-home/index.vue")
    await router.push("/user/user-home")
    await flushPromises()
    const wrapper = mountPage(UserIndex)
    await flushPromises()
    expect(wrapper.text()).toContain("点击登录")
    wrapper.unmount()
  })
})
