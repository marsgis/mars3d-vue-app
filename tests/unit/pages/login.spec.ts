import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import Login from "@mars/views/user/login/index.vue"
import { login, getCode } from "@mars/common/api"
import { router } from "@mars/routes"
import { globalStore } from "@mars/common/store/global"
import { mountPage } from "../../helpers/page"

vi.mock("@mars/common/api", () => ({
  login: vi.fn(),
  getCode: vi.fn(),
  loginWithCode: vi.fn(),
  getUserInformation: vi.fn().mockResolvedValue({ code: 200, data: {} })
}))

const mockedLogin = vi.mocked(login)
const mockedGetCode = vi.mocked(getCode)

beforeEach(() => {
  mockedLogin.mockReset()
  mockedGetCode.mockReset()
  // login 页新增已登录重定向守卫（userToken）：每个用例前清空登录态，保持表单渲染/提交类用例原语义
  globalStore.commit("updateUserToken", "")
  localStorage.removeItem("mars-user-token")
})

describe("login 登录页", () => {
  it("默认账号密码登录模式：标题、账号/密码输入框、登录按钮渲染", () => {
    const wrapper = mountPage(Login)
    expect(wrapper.text()).toContain("账号密码登录")
    expect(wrapper.find("input").exists()).toBe(true)
    expect(wrapper.text()).toContain("登录")
    wrapper.unmount()
  })

  it("点击「验证码登录」切换为验证码模式，再点「账号密码登录」切回", async () => {
    const wrapper = mountPage(Login)
    const title = () => wrapper.find(".login-title").text()
    const links = wrapper.findAll(".login-tip a")
    await links[1].trigger("click")
    expect(title()).toContain("验证码登录")
    await links[1].trigger("click")
    expect(title()).toContain("账号密码登录")
    wrapper.unmount()
  })

  it("密码可见性切换：eye 图标点击后输入框 type 在 password/input 间切换", async () => {
    const wrapper = mountPage(Login)
    const pwdInput = wrapper.findAll("input")[1]
    expect(pwdInput.attributes("type")).toBe("password")
    // 密码输入框所在 field 内的 eye 图标：field 内有 left-icon(key) 在前、extra 槽 eye 在后，取最后一个
    const pwdField = wrapper.findAll(".van-field").find((f) => f.find('input[type="password"]').exists())!
    const eyeIcon = pwdField.findAll(".mars-icon").at(-1)!
    await eyeIcon.trigger("click")
    expect(pwdInput.attributes("type")).toBe("input")
    await eyeIcon.trigger("click")
    expect(pwdInput.attributes("type")).toBe("password")
    wrapper.unmount()
  })

  it("账号密码登录提交：账号为手机号时按手机号字段提交", async () => {
    mockedLogin.mockResolvedValue({ code: 200, data: { token: "t-1" } } as any)
    const wrapper = mountPage(Login)
    await wrapper.findAll("input")[0].setValue("13800138000")
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mockedLogin).toHaveBeenCalledTimes(1)
    const payload = mockedLogin.mock.calls[0][0] as any
    expect(payload.phone).toBe("13800138000")
    expect(payload.password).toBe("mars3d")
    expect(payload.email).toBe("")
    wrapper.unmount()
  })

  it("账号为非手机号非邮箱时走 user_account 字段", async () => {
    mockedLogin.mockResolvedValue({ code: 200, data: { token: "t-1" } } as any)
    const wrapper = mountPage(Login)
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    const payload = mockedLogin.mock.calls[0][0] as any
    expect(payload.user_account).toBe("mars3d")
    expect(payload.phone).toBe("")
    wrapper.unmount()
  })

  it("登录失败（code != 200）时不更新路由，走 $message 提示", async () => {
    mockedLogin.mockResolvedValue({ code: 500, message: "密码错误" } as any)
    const wrapper = mountPage(Login)
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(document.body.querySelector(".mars-message")).toBeTruthy()
    wrapper.unmount()
  })

  it("发送验证码：手机号格式错误时直接提示，不调用 api", async () => {
    const wrapper = mountPage(Login)
    const links = wrapper.findAll(".login-tip a")
    await links[1].trigger("click") // 切到验证码模式
    await flushPromises()
    const codeBtn = wrapper.findAll("button").find((b) => b.text().includes("发送验证码"))!
    await codeBtn.trigger("click")
    await flushPromises()
    expect(mockedGetCode).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("发送验证码：手机号合法时调用 getCode 并进入倒计时", async () => {
    mockedGetCode.mockResolvedValue({ code: 200, message: "ok" } as any)
    vi.useFakeTimers()
    const wrapper = mountPage(Login)
    const links = wrapper.findAll(".login-tip a")
    await links[1].trigger("click")
    await flushPromises()
    const phoneInput = wrapper.findAll("input")[0]
    await phoneInput.setValue("13800138000")
    const codeBtn = wrapper.findAll("button").find((b) => b.text().includes("发送验证码"))!
    await codeBtn.trigger("click")
    await flushPromises()
    expect(mockedGetCode).toHaveBeenCalledWith({ phone: "13800138000" })
    vi.advanceTimersByTime(1000)
    await flushPromises()
    expect(wrapper.text()).toContain("59s后再发送")
    wrapper.unmount()
    vi.useRealTimers()
  })

  it("已登录访问登录页重定向回首页", async () => {
    await import("@mars/views/home/index.vue")
    // 先完成一次导航，确保路由初始导航结束，避免 onMounted 里的 replace 被挂起的初始导航吞掉
    await router.push("/user/login")
    await flushPromises()
    globalStore.commit("updateUserToken", { token: "t-redirect" })
    const wrapper = mountPage(Login)
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("home")
    wrapper.unmount()
  })
})
