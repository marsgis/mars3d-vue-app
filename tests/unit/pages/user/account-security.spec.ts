import { describe, it, expect } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import AccountSecurity from "@mars/views/user/account-security/index.vue"
import { mountPage } from "../../../helpers/page"

describe("account-security 容器壳", () => {
  it("渲染子路由出口 router-view", () => {
    const wrapper = mountPage(AccountSecurity, { stubs: { RouterView: true } })
    expect(wrapper.find("router-view-stub").exists()).toBe(true)
    wrapper.unmount()
  })

  it("路由出口渲染安全项列表（修改密码/注销账号）", async () => {
    await import("@mars/views/user/account-security/account-security-home/index.vue")
    await router.push("/user/account-security/account-security-home")
    await flushPromises()
    const wrapper = mountPage(AccountSecurity)
    await flushPromises()
    expect(wrapper.text()).toContain("账号与安全")
    expect(wrapper.text()).toContain("修改密码")
    expect(wrapper.text()).toContain("注销账号")
    wrapper.unmount()
  })
})
