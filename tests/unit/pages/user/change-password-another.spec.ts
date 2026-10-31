import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import ChangePasswordAnother from "@mars/views/user/account-security/change-password/change-password-another/index.vue"
import { getCode, resetPassword } from "@mars/common/api"
import { mountPage } from "../../../helpers/page"

// 修改说明：页面由静态壳改为本地模拟实现（字段绑定/发送验证码/保存提交），需 mock 相关 API
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

const mockedGetCode = vi.mocked(getCode)
const mockedResetPassword = vi.mocked(resetPassword)

beforeEach(() => {
  mockedGetCode.mockReset()
  mockedResetPassword.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** 填写合法表单（手机号/验证码/密码） */
async function fillValidForm(wrapper: any) {
  const inputs = wrapper.findAll("input")
  await inputs[0].setValue("13800138000")
  await inputs[1].setValue("1234")
  await inputs[2].setValue("abc123")
}

describe("change-password-another 其他方式改密", () => {
  it("渲染标题、三个输入占位与操作按钮", () => {
    const wrapper = mountPage(ChangePasswordAnother)
    expect(wrapper.text()).toContain("修改密码")
    // 输入提示是 placeholder 属性，不在 textContent 中
    const inputs = wrapper.findAll("input")
    expect(inputs).toHaveLength(3)
    expect(inputs[0].attributes("placeholder")).toBe("请输入手机号")
    expect(inputs[1].attributes("placeholder")).toBe("请输入短信验证码")
    expect(inputs[2].attributes("placeholder")).toBe("请输入密码")
    expect(wrapper.text()).toContain("发送验证码")
    expect(wrapper.text()).toContain("保存")
    wrapper.unmount()
  })

  it("点击导航栏返回按钮调用 router.go(-1)", async () => {
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountPage(ChangePasswordAnother)
    await wrapper.find(".van-nav-bar__left").trigger("click")
    expect(goSpy).toHaveBeenCalledWith(-1)
    wrapper.unmount()
  })

  it("字段双向绑定：输入值同步到 v-model", async () => {
    const wrapper = mountPage(ChangePasswordAnother)
    await fillValidForm(wrapper)
    expect((wrapper.vm as any).resetForm.phone).toBe("13800138000")
    expect((wrapper.vm as any).resetForm.code).toBe("1234")
    expect((wrapper.vm as any).resetForm.password).toBe("abc123")
    wrapper.unmount()
  })

  it("密码明暗文切换：点击眼睛图标后输入框 type 在 password/input 间切换", async () => {
    const wrapper = mountPage(ChangePasswordAnother)
    const pwdInput = wrapper.findAll("input")[2]
    expect(pwdInput.attributes("type")).toBe("password")
    const pwdField = wrapper.findAll(".van-field").find((f) => f.find('input[type="password"]').exists())!
    const eyeIcon = pwdField.findAll(".mars-icon").at(-1)!
    await eyeIcon.trigger("click")
    expect(pwdInput.attributes("type")).toBe("input")
    await eyeIcon.trigger("click")
    expect(pwdInput.attributes("type")).toBe("password")
    wrapper.unmount()
  })

  it("发送验证码：手机号格式错误时直接提示，不调用 api", async () => {
    const wrapper = mountPage(ChangePasswordAnother)
    const codeBtn = wrapper.findAll("button").find((b) => b.text().includes("发送验证码"))!
    await codeBtn.trigger("click")
    await flushPromises()
    expect(mockedGetCode).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain("手机号格式不正确")
    wrapper.unmount()
  })

  it("发送验证码：手机号合法时调用 getCode 并进入倒计时", async () => {
    mockedGetCode.mockResolvedValue({ code: 200, message: "ok" } as any)
    vi.useFakeTimers()
    const wrapper = mountPage(ChangePasswordAnother)
    await wrapper.findAll("input")[0].setValue("13800138000")
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

  it("空表单提交被表单校验拦截，不调用改密接口", async () => {
    const wrapper = mountPage(ChangePasswordAnother)
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mockedResetPassword).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("保存提交成功：调用 resetPassword（与 change-password-home 同契约），提示成功并返回上一页", async () => {
    mockedResetPassword.mockResolvedValue({ code: 200, message: "ok" } as any)
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountPage(ChangePasswordAnother)
    await fillValidForm(wrapper)
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mockedResetPassword).toHaveBeenCalledWith({ phone: "13800138000", code: "1234", password: "abc123" })
    expect(document.body.textContent).toContain("修改密码成功")
    expect(goSpy).toHaveBeenCalledWith(-1)
    wrapper.unmount()
  })

  it("保存提交失败（code != 200）：提示错误信息且不返回", async () => {
    mockedResetPassword.mockResolvedValue({ code: 500, message: "验证码错误" } as any)
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountPage(ChangePasswordAnother)
    await fillValidForm(wrapper)
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(document.body.textContent).toContain("验证码错误")
    expect(goSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
