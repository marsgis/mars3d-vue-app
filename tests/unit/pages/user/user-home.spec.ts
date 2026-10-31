import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import UserHome from "@mars/views/user/user-home/index.vue"
import { loginOut, getUserInformation } from "@mars/common/api"
import { $dialog } from "@mars/components/mars-ui"
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
  destroyAccount: vi.fn(),
  addCollection: vi.fn(),
  getCollectionList: vi.fn(),
  getCollectionById: vi.fn(),
  deleteCollectionById: vi.fn(),
  isCollection: vi.fn()
}))

// 仅替换 $dialog 为受控 mock（确认分支可控），其余导出（组件、$message）保持真实实现
vi.mock("@mars/components/mars-ui", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, $dialog: vi.fn() }
})

const mockedLoginOut = vi.mocked(loginOut)
const mockedGetUserInformation = vi.mocked(getUserInformation)
const mockedDialog = vi.mocked($dialog)

const USER = { id: "1", user_name: "测试用户", phone: "13800138000", email: "", avatar: "" }

beforeEach(() => {
  mockedLoginOut.mockReset()
  mockedGetUserInformation.mockReset()
  mockedGetUserInformation.mockResolvedValue({ code: 200, data: {} } as any)
  mockedDialog.mockReset()
  globalStore.commit("updateUserInformation", null)
  globalStore.commit("updateLoginRedirect", null)
  globalStore.commit("updateUserToken", "")
  localStorage.removeItem("mars-user-token")
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("user-home 个人中心", () => {
  it("未登录渲染：展示点击登录与公共菜单，隐藏登录专属项", () => {
    const wrapper = mountPage(UserHome)
    expect(wrapper.text()).toContain("点击登录")
    expect(wrapper.text()).toContain("帮助中心")
    expect(wrapper.text()).toContain("关于")
    expect(wrapper.text()).toContain("清除缓存")
    expect(wrapper.text()).not.toContain("收藏夹")
    expect(wrapper.text()).not.toContain("账号与安全")
    expect(wrapper.text()).not.toContain("退出登录")
    wrapper.unmount()
  })

  it("已登录渲染：展示用户名、设置与登录专属菜单", () => {
    globalStore.commit("updateUserInformation", USER)
    const wrapper = mountPage(UserHome)
    expect(wrapper.text()).toContain("测试用户")
    expect(wrapper.text()).toContain("设置")
    expect(wrapper.text()).toContain("收藏夹")
    expect(wrapper.text()).toContain("账号与安全")
    expect(wrapper.text()).toContain("退出登录")
    expect(wrapper.text()).not.toContain("点击登录")
    wrapper.unmount()
  })

  it("未登录点击「点击登录」跳转 login 路由", async () => {
    await import("@mars/views/user/login/index.vue")
    await router.push("/user/user-home")
    await flushPromises()
    const wrapper = mountPage(UserHome)
    await wrapper.find(".logininfo").trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("login")
    wrapper.unmount()
  })

  it("已登录点击「收藏夹」跳转 collection 路由", async () => {
    await import("@mars/views/user/collection/index.vue")
    await router.push("/user/user-home")
    await flushPromises()
    globalStore.commit("updateUserInformation", USER)
    const wrapper = mountPage(UserHome)
    const cell = wrapper.findAll(".van-cell").find((c) => c.text().includes("收藏夹"))!
    await cell.trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("collection")
    wrapper.unmount()
  })

  it("清除缓存：弹出确认对话框，确认后清理临时缓存且不影响登录态", async () => {
    // 修改说明：清除缓存改为真实清理（提示文案同步更新），并验证鉴权信息不被清除
    mockedDialog.mockResolvedValue("confirm" as any)
    localStorage.setItem("mars-user-token", "token-keep")
    localStorage.setItem("project-debugger", "1")
    const wrapper = mountPage(UserHome)
    const cell = wrapper.findAll(".van-cell").find((c) => c.text().includes("清除缓存"))!
    await cell.trigger("click")
    await flushPromises()
    expect(mockedDialog).toHaveBeenCalledWith(expect.objectContaining({ message: "将清理本地临时缓存（不影响收藏等业务数据与登录状态），是否继续？" }))
    expect(document.body.textContent).toContain("清除成功!")
    // 临时缓存键被清理
    expect(localStorage.getItem("project-debugger")).toBeNull()
    // 鉴权信息不被清理
    expect(localStorage.getItem("mars-user-token")).toBe("token-keep")
    wrapper.unmount()
  })

  it("退出登录：确认后调用 loginOut、清空用户状态与本地 token 并回退", async () => {
    globalStore.commit("updateUserInformation", USER)
    localStorage.setItem("mars-user-token", "token-1")
    mockedDialog.mockResolvedValue("confirm" as any)
    mockedLoginOut.mockResolvedValue({ code: 200, message: "ok" } as any)
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountPage(UserHome)
    const cell = wrapper.findAll(".van-cell").find((c) => c.text().includes("退出登录"))!
    await cell.trigger("click")
    await flushPromises()
    expect(mockedDialog).toHaveBeenCalledWith(expect.objectContaining({ message: "确定退出登录吗？" }))
    expect(mockedLoginOut).toHaveBeenCalledTimes(1)
    expect(globalStore.state.userInformation).toBeNull()
    expect(localStorage.getItem("mars-user-token")).toBeNull()
    expect(goSpy).toHaveBeenCalledWith(-1)
    wrapper.unmount()
  })
})
