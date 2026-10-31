import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import axios from "axios"

import { router } from "@mars/routes"
import { mountPage } from "../../../helpers/page"

// http.ts 顶层会 axios.create，需同时提供 create 桩避免模块加载崩溃
vi.mock("axios", () => {
  const instance: any = {
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    request: vi.fn().mockResolvedValue({ data: {} }),
    get: vi.fn().mockResolvedValue({ data: {} })
  }
  return { default: { get: vi.fn(), create: vi.fn(() => instance), request: vi.fn() } }
})

const QUESTIONS = [
  { type: "产品购买", name: "如何购买", answer: "官网下单", answerDetail: "详情A" },
  { type: "产品购买", name: "购买优惠", answer: "有折扣", answerDetail: "详情B" },
  { type: "项目细节", name: "项目周期", answer: "两周", answerDetail: "详情C" }
]

// 修改说明：页面请求已从模块顶层移入 onMounted（含 try/catch 与失败重试/空数据空态），
// 动态 import 仅为兼容历史加载时序，现可正常静态加载
const mockedAxiosGet = vi.mocked(axios.get)
const HelpCenter = (await import("@mars/views/user/help-center/index.vue")).default

beforeEach(() => {
  mockedAxiosGet.mockReset()
  mockedAxiosGet.mockResolvedValue({ data: { result: QUESTIONS } } as any)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("help-center 帮助中心", () => {
  it("渲染标题、搜索框与三个问题分类 tab", async () => {
    const wrapper = mountPage(HelpCenter)
    await flushPromises()
    expect(wrapper.text()).toContain("帮助中心")
    // 搜索占位符是 input 的 placeholder 属性，不在 textContent 中
    expect(wrapper.find(".van-field__control").attributes("placeholder")).toBe("请输入搜索关键词")
    expect(wrapper.text()).toContain("产品购买")
    expect(wrapper.text()).toContain("项目细节")
    expect(wrapper.text()).toContain("售后支持")
    expect(wrapper.text()).toContain("常见问题")
    wrapper.unmount()
  })

  it("默认加载「产品购买」分类问题列表", async () => {
    const wrapper = mountPage(HelpCenter)
    await flushPromises()
    expect(mockedAxiosGet).toHaveBeenCalled()
    expect(wrapper.text()).toContain("如何购买")
    expect(wrapper.text()).toContain("购买优惠")
    expect(wrapper.text()).not.toContain("项目周期")
    wrapper.unmount()
  })

  it("输入搜索关键词后按问题名过滤列表", async () => {
    const wrapper = mountPage(HelpCenter)
    await flushPromises()
    await wrapper.find(".van-field__control").setValue("如何")
    await flushPromises()
    expect(wrapper.text()).toContain("如何购买")
    expect(wrapper.text()).not.toContain("购买优惠")
    expect(wrapper.text()).not.toContain("项目周期")
    wrapper.unmount()
  })

  it("切换 tab 后加载对应分类的问题", async () => {
    const wrapper = mountPage(HelpCenter)
    await flushPromises()
    await wrapper.findAll(".van-tab")[1].trigger("click")
    await flushPromises()
    expect(wrapper.text()).toContain("项目周期")
    wrapper.unmount()
  })

  it("点击导航栏返回按钮调用 router.go(-1)", async () => {
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountPage(HelpCenter)
    await flushPromises()
    await wrapper.find(".van-nav-bar__left").trigger("click")
    expect(goSpy).toHaveBeenCalledWith(-1)
    wrapper.unmount()
  })

  it("加载失败：显示「加载失败」空态与重试按钮，重试成功后恢复列表", async () => {
    mockedAxiosGet.mockRejectedValue(new Error("network error"))
    const wrapper = mountPage(HelpCenter)
    await flushPromises()
    expect(wrapper.text()).toContain("加载失败")
    expect(wrapper.text()).toContain("重试")
    // 重试：恢复 mock 数据后再次拉取成功
    mockedAxiosGet.mockResolvedValue({ data: { result: QUESTIONS } } as any)
    const retryBtn = wrapper.findAll("button").find((b) => b.text().includes("重试"))!
    await retryBtn.trigger("click")
    await flushPromises()
    expect(wrapper.text()).toContain("如何购买")
    wrapper.unmount()
  })

  it("数据加载成功但为空：显示「暂无数据」空态", async () => {
    mockedAxiosGet.mockResolvedValue({ data: { result: [] } } as any)
    const wrapper = mountPage(HelpCenter)
    await flushPromises()
    expect(wrapper.find(".van-empty").exists()).toBe(true)
    expect(wrapper.text()).toContain("暂无数据")
    wrapper.unmount()
  })
})
