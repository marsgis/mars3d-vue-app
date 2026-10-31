import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import ChangePasswordHome from "@mars/views/user/account-security/change-password/change-password-home/index.vue"
import { resetPassword, loginOut } from "@mars/common/api"
import { router } from "@mars/routes"
import { globalStore } from "@mars/common/store/global"
import { mountPage } from "../../../helpers/page"

vi.mock("@mars/common/api", () => ({
  login: vi.fn(),
  getCode: vi.fn(),
  loginWithCode: vi.fn(),
  getUserInformation: vi.fn(),
  updateUserInformation: vi.fn(),
  checkLogin: vi.fn(),
  loginOut: vi.fn(),
  register: vi.fn(),
  resetPassword: vi.fn(),
  destroyAccount: vi.fn()
}))

const mockedReset = vi.mocked(resetPassword)
const mockedLoginOut = vi.mocked(loginOut)

const USER = { id: "1", user_name: "测试用户", phone: "13800138000", email: "", avatar: "" }

beforeEach(() => {
  mockedReset.mockReset()
  mockedLoginOut.mockReset()
  globalStore.commit("updateUserInformation", null)
  globalStore.commit("updateLoginRedirect", null)
  localStorage.removeItem("mars-user-token")
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function fillForm(wrapper: any) {
  const inputs = wrapper.findAll("input")
  await inputs[0].setValue("abc123")
  await inputs[1].setValue("abc456")
  await inputs[2].setValue("abc456")
}

describe("change-password-home 修改密码", () => {
  it("未登录进入时重定向 login 路由", async () => {
    await import("@mars/views/user/login/index.vue")
    // 先完成一次导航，确保路由初始导航结束，避免守卫里的 replace 被挂起的初始导航吞掉
    await router.push("/user/account-security/change-password/change-password-home")
    await flushPromises()
    const wrapper = mountPage(ChangePasswordHome)
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("login")
    wrapper.unmount()
  })

  it("已登录渲染：三个密码输入框与保存按钮", () => {
    globalStore.commit("updateUserInformation", USER)
    const wrapper = mountPage(ChangePasswordHome)
    expect(wrapper.text()).toContain("旧密码")
    expect(wrapper.text()).toContain("新密码")
    expect(wrapper.text()).toContain("确认新密码")
    expect(wrapper.text()).toContain("保存")
    wrapper.unmount()
  })

  it("内置试用账号提交：提示禁止修改、跳首页且不调用重置接口", async () => {
    globalStore.commit("updateUserInformation", { ...USER, user_name: "mars3d" })
    const pushSpy = vi.spyOn(router, "push").mockImplementation((() => Promise.resolve(undefined)) as any)
    const wrapper = mountPage(ChangePasswordHome)
    await fillForm(wrapper)
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mockedReset).not.toHaveBeenCalled()
    expect(pushSpy).toHaveBeenCalledWith("/")
    expect(document.body.textContent).toContain("当前是内置试用帐号，禁止修改！")
    wrapper.unmount()
  })

  it("重置接口失败：提示错误信息且不触发退出登录", async () => {
    globalStore.commit("updateUserInformation", USER)
    mockedReset.mockResolvedValue({ code: 500, message: "旧密码错误" } as any)
    const wrapper = mountPage(ChangePasswordHome)
    await fillForm(wrapper)
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mockedReset).toHaveBeenCalledWith({ password: "abc123", newPassword: "abc456", newPassword2: "abc456" })
    expect(mockedLoginOut).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain("旧密码错误")
    wrapper.unmount()
  })

  it("重置成功：调用 loginOut 退出，清空用户状态与本地 token 并跳转 user-home", async () => {
    globalStore.commit("updateUserInformation", USER)
    mockedReset.mockResolvedValue({ code: 200, message: "ok" } as any)
    mockedLoginOut.mockResolvedValue({ code: 200, message: "ok" } as any)
    localStorage.setItem("mars-user-token", "token-1")
    const pushSpy = vi.spyOn(router, "push").mockImplementation((() => Promise.resolve(undefined)) as any)
    const wrapper = mountPage(ChangePasswordHome)
    await fillForm(wrapper)
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mockedLoginOut).toHaveBeenCalledTimes(1)
    expect(globalStore.state.userInformation).toBeNull()
    expect(localStorage.getItem("mars-user-token")).toBeNull()
    expect(pushSpy).toHaveBeenCalledWith("/user/user-home")
    wrapper.unmount()
  })
})
