import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import Register from "@mars/views/user/register/index.vue"
import { register, login, getUserInformation } from "@mars/common/api"
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

const mockedRegister = vi.mocked(register)
const mockedLogin = vi.mocked(login)
const mockedGetUserInformation = vi.mocked(getUserInformation)

beforeEach(() => {
  mockedRegister.mockReset()
  mockedLogin.mockReset()
  mockedGetUserInformation.mockReset()
  mockedGetUserInformation.mockResolvedValue({ code: 200, data: { user_name: "u" } } as any)
  globalStore.commit("updateUserInformation", null)
  globalStore.commit("updateLoginRedirect", null)
  globalStore.commit("updateUserToken", "")
  globalStore.commit("updateLoginPhone", null)
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** 填写合法表单；checked=false 时不勾选协议 */
async function fillValidForm(wrapper: any, checked = true) {
  const inputs = wrapper.findAll("input")
  await inputs[0].setValue("13800138000")
  await inputs[1].setValue("abc123")
  await inputs[2].setValue("abc123")
  if (checked) {
    await wrapper.find(".van-checkbox__icon").trigger("click")
  }
}

describe("register 注册页", () => {
  it("渲染注册标题、三个输入框、保存按钮与用户协议入口", () => {
    const wrapper = mountPage(Register)
    expect(wrapper.text()).toContain("注册")
    expect(wrapper.findAll("input").length).toBe(3)
    expect(wrapper.text()).toContain("保存")
    expect(wrapper.text()).toContain("《火星科技用户协议》")
    wrapper.unmount()
  })

  it("已登录用户进入注册页被重定向回首页", async () => {
    await import("@mars/views/home/index.vue")
    // 先完成一次导航，确保路由初始导航结束，避免 onMounted 里的 replace 被挂起的初始导航吞掉
    await router.push("/user/register")
    await flushPromises()
    globalStore.commit("updateUserInformation", { id: "1", user_name: "已登录", phone: "13800138000", email: "", avatar: "" })
    const wrapper = mountPage(Register)
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("home")
    wrapper.unmount()
  })

  it("空表单提交被表单校验拦截，不调用注册接口", async () => {
    const wrapper = mountPage(Register)
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mockedRegister).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("未勾选用户协议提交：提示勾选且不调用注册接口", async () => {
    const wrapper = mountPage(Register)
    await fillValidForm(wrapper, false)
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mockedRegister).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain("请阅读后勾选《火星科技用户协议》")
    wrapper.unmount()
  })

  it("注册接口失败（code != 200）：提示错误信息且不走自动登录", async () => {
    mockedRegister.mockResolvedValue({ code: 500, message: "手机号已注册" } as any)
    const wrapper = mountPage(Register)
    await fillValidForm(wrapper, true)
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mockedRegister).toHaveBeenCalledWith({ phone: "13800138000", password: "abc123" })
    expect(document.body.textContent).toContain("手机号已注册")
    expect(mockedLogin).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("注册成功：自动登录写入 token 与手机号，并跳转 loginRedirect", async () => {
    await import("@mars/views/home/index.vue")
    globalStore.commit("updateLoginRedirect", "/")
    mockedRegister.mockResolvedValue({ code: 200, message: "ok", data: {} } as any)
    mockedLogin.mockResolvedValue({ code: 200, data: { token: "reg-token" } } as any)
    const wrapper = mountPage(Register)
    await fillValidForm(wrapper, true)
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mockedLogin).toHaveBeenCalledWith({ phone: "13800138000", password: "abc123" })
    expect(globalStore.state.userToken).toEqual({ token: "reg-token" })
    expect(globalStore.state.userPhone).toBe("13800138000")
    expect(router.currentRoute.value.name).toBe("home")
    wrapper.unmount()
  })
})
