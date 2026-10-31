import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import CancelAccount from "@mars/views/user/account-security/cancel-account/index.vue"
import { checkLogin, destroyAccount } from "@mars/common/api"
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

const mockedCheckLogin = vi.mocked(checkLogin)
const mockedDestroy = vi.mocked(destroyAccount)

const USER = { id: "1", user_name: "测试用户", phone: "13800138000", email: "", avatar: "" }

beforeEach(() => {
  mockedCheckLogin.mockReset()
  mockedDestroy.mockReset()
  globalStore.commit("updateUserInformation", null)
  globalStore.commit("updateLoginRedirect", null)
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function clickConfirm(wrapper: any) {
  const btn = wrapper.findAll("button").find((b) => b.text().includes("确认注销"))!
  await btn.trigger("click")
}

describe("cancel-account 注销账号", () => {
  it("渲染注销风险说明与确认/取消按钮", () => {
    const wrapper = mountPage(CancelAccount)
    expect(wrapper.text()).toContain("申请注销账号")
    expect(wrapper.text()).toContain("已清楚风险，确认注销")
    expect(wrapper.text()).toContain("再想想")
    wrapper.unmount()
  })

  it("注销成功：checkLogin 通过后调用 destroyAccount，清空用户状态并跳首页", async () => {
    globalStore.commit("updateUserInformation", USER)
    mockedCheckLogin.mockResolvedValue({ code: 200, message: "ok" } as any)
    mockedDestroy.mockResolvedValue({ code: 200, message: "ok" } as any)
    const pushSpy = vi.spyOn(router, "push").mockImplementation((() => Promise.resolve(undefined)) as any)
    const wrapper = mountPage(CancelAccount)
    await clickConfirm(wrapper)
    await flushPromises()
    expect(mockedCheckLogin).toHaveBeenCalledTimes(1)
    expect(mockedDestroy).toHaveBeenCalledTimes(1)
    expect(globalStore.state.userInformation).toBeNull()
    expect(pushSpy).toHaveBeenCalledWith("/")
    expect(document.body.textContent).toContain("注销账号成功")
    wrapper.unmount()
  })

  it("checkLogin 失败（code != 200）：提示错误且不调用注销接口", async () => {
    globalStore.commit("updateUserInformation", USER)
    mockedCheckLogin.mockResolvedValue({ code: 500, message: "会话已失效" } as any)
    const wrapper = mountPage(CancelAccount)
    await clickConfirm(wrapper)
    await flushPromises()
    expect(mockedDestroy).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain("会话已失效")
    wrapper.unmount()
  })

  it("未登录时通过守卫：提示先登录并 replace 到 login，不调用注销接口", async () => {
    mockedCheckLogin.mockResolvedValue({ code: 200, message: "ok" } as any)
    const replaceSpy = vi.spyOn(router, "replace").mockImplementation((() => Promise.resolve(undefined)) as any)
    const wrapper = mountPage(CancelAccount)
    await clickConfirm(wrapper)
    await flushPromises()
    expect(mockedDestroy).not.toHaveBeenCalled()
    expect(replaceSpy).toHaveBeenCalledWith({ name: "login" })
    expect(document.body.textContent).toContain("请先登录")
    wrapper.unmount()
  })

  it("点击「再想想」调用 router.go(-1) 返回", async () => {
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountPage(CancelAccount)
    const btn = wrapper.findAll("button").find((b) => b.text().includes("再想想"))!
    await btn.trigger("click")
    expect(goSpy).toHaveBeenCalledWith(-1)
    wrapper.unmount()
  })
})
