import { describe, it, expect } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"
import { globalStore } from "@mars/common/store/global"

import ChangePassword from "@mars/views/user/account-security/change-password/index.vue"
import { mountPage } from "../../../helpers/page"

const USER = { id: "1", user_name: "测试用户", phone: "13800138000", email: "", avatar: "" }

describe("change-password 容器壳", () => {
  it("渲染子路由出口 router-view", () => {
    const wrapper = mountPage(ChangePassword, { stubs: { RouterView: true } })
    expect(wrapper.find("router-view-stub").exists()).toBe(true)
    wrapper.unmount()
  })

  it("路由出口渲染改密表单（子页有登录守卫，需预置登录态）", async () => {
    await import("@mars/views/user/account-security/change-password/change-password-home/index.vue")
    globalStore.commit("updateUserInformation", USER)
    await router.push("/user/account-security/change-password/change-password-home")
    await flushPromises()
    const wrapper = mountPage(ChangePassword)
    await flushPromises()
    expect(wrapper.text()).toContain("修改密码")
    expect(wrapper.text()).toContain("旧密码")
    expect(wrapper.text()).toContain("保存")
    wrapper.unmount()
  })
})
