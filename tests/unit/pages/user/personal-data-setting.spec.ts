import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import PersonalDataSetting from "@mars/views/user/personal-data-setting/index.vue"
import { updateUserInformation, getUserInformation } from "@mars/common/api"
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

const mockedUpdate = vi.mocked(updateUserInformation)
const mockedGetUserInformation = vi.mocked(getUserInformation)

const USER = { id: "1", user_name: "张三", phone: "13800138000", email: "", avatar: "" }

beforeEach(() => {
  mockedUpdate.mockReset()
  mockedGetUserInformation.mockReset()
  globalStore.commit("updateUserInformation", null)
  globalStore.commit("updateLoginRedirect", null)
  globalStore.commit("updateUserToken", "")
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("personal-data-setting 个人资料", () => {
  it("未登录进入时重定向 login 路由", async () => {
    await import("@mars/views/user/login/index.vue")
    // 先完成一次导航，确保路由初始导航结束，避免守卫里的 replace 被挂起的初始导航吞掉
    await router.push("/user/personal-data-setting")
    await flushPromises()
    const wrapper = mountPage(PersonalDataSetting)
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("login")
    wrapper.unmount()
  })

  it("已登录渲染：回显手机号、默认头像与保存按钮", () => {
    globalStore.commit("updateUserInformation", USER)
    const wrapper = mountPage(PersonalDataSetting)
    expect(wrapper.text()).toContain("个人资料")
    // 手机号经 v-model 渲染在 disabled 输入框的 value 上，不在 textContent 中
    const phoneInput = wrapper.findAll(".van-field__control")[0].element as HTMLInputElement
    expect(phoneInput.value).toBe("13800138000")
    expect(wrapper.html()).toContain("img/project/user/login.png")
    expect(wrapper.text()).toContain("保存修改")
    wrapper.unmount()
  })

  it("内置试用账号提交：提示禁止修改且不调用更新接口", async () => {
    globalStore.commit("updateUserInformation", { ...USER, user_name: "mars3d" })
    const wrapper = mountPage(PersonalDataSetting)
    await flushPromises()
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mockedUpdate).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain("当前是内置试用帐号，禁止修改！")
    wrapper.unmount()
  })

  it("保存成功：按表单字段调用更新接口，刷新用户信息后回退", async () => {
    globalStore.commit("updateUserInformation", USER)
    mockedUpdate.mockResolvedValue({ code: 200, message: "ok" } as any)
    mockedGetUserInformation.mockResolvedValue({
      code: 200,
      data: { id: "1", user_name: "后端名字", phone: "13800138000", email: "test@qq.com", avatar: "" }
    } as any)
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountPage(PersonalDataSetting)
    await flushPromises()
    const controls = wrapper.findAll(".van-field__control")
    // 顺序：手机号(disabled)、邮箱、用户名
    await controls[1].setValue("test@qq.com")
    await controls[2].setValue("新名字")
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mockedUpdate).toHaveBeenCalledWith({ user_name: "新名字", email: "test@qq.com", avatar: "" })
    expect(globalStore.state.userInformation?.user_name).toBe("后端名字")
    expect(goSpy).toHaveBeenCalledWith(-1)
    expect(document.body.textContent).toContain("修改个人信息成功")
    wrapper.unmount()
  })
})
