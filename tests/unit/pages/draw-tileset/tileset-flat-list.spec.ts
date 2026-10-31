import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises, config as vtuConfig } from "@vue/test-utils"

import FlatList from "@mars/views/tileset/flat/list/index.vue"
import { router } from "@mars/routes"
import { mountPage } from "../../../helpers/page"
import { getHistoricalRecordsList, deleteHistoricalRecordsById } from "@mars/common/api"
import { $dialog } from "@mars/components/mars-ui"

// 删除二次确认统一走 $dialog（与全站弹窗一致，I026），mock 为默认确认通过；其余 mars-ui 导出保持真实实现
vi.mock("@mars/components/mars-ui", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, $dialog: vi.fn(() => Promise.resolve()) }
})

vi.mock("@mars/common/api", () => ({
  addMarkerPointHistory: vi.fn(),
  updateMarkerPointHistory: vi.fn(),
  getMarkerPointHistoryList: vi.fn(),
  getMarkerPointHistoryById: vi.fn(),
  deleteMarkerPointHistoryById: vi.fn(),
  addHistoricalRecords: vi.fn(),
  updateHistoryRecords: vi.fn(),
  getHistoricalRecordsList: vi.fn(),
  getHistoricalRecordsById: vi.fn(),
  deleteHistoricalRecordsById: vi.fn()
}))

vtuConfig.global.config = { globalProperties: { $filters: { timeFilter: (time: any) => (time == null ? "" : String(time)) } } }

const mockedGetList = vi.mocked(getHistoricalRecordsList)
const mockedDelete = vi.mocked(deleteHistoricalRecordsById)

const nowStr = new Date().toISOString()
const listData = [
  { id: "f1", title: "压平一", update_time: nowStr },
  { id: "f2", title: "压平二", update_time: nowStr }
]

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetList.mockResolvedValue({ code: 200, data: listData } as any)
  mockedDelete.mockResolvedValue({ code: 200 } as any)
})

describe("tileset-flat 模型压平列表", () => {
  it("渲染：标题、添加入口与接口返回的列表项", async () => {
    const wrapper = mountPage(FlatList)
    await flushPromises()
    expect(wrapper.text()).toContain("模型压平")
    expect(wrapper.text()).toContain("添加")
    expect(wrapper.text()).toContain("压平一")
    expect(wrapper.text()).toContain("压平二")
    wrapper.unmount()
  })

  it("点击列表项跳转 flat-add 并携带 id；点击「添加」跳转 flat-add 不带 id（I029 路由名已修复）", async () => {
    // 目标为嵌套路由子页：导航会懒加载父壳 + 子页，动态 import 属宏任务，flushPromises 覆盖不到，需一并预加载
    await import("@mars/views/tileset/flat/index.vue")
    await import("@mars/views/tileset/flat/add/index.vue")
    const wrapper = mountPage(FlatList)
    await flushPromises()
    const cell = wrapper.findAll(".van-cell").find((c) => c.text().includes("压平一"))!
    await cell.trigger("click")
    await flushPromises()
    // 防御性等待导航落定（懒加载/初始导航可能引入宏任务）
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe("flat-add"), { timeout: 5000 })
    expect(router.currentRoute.value.query.id).toBe("f1")
    wrapper.unmount()

    const wrapper2 = mountPage(FlatList)
    await flushPromises()
    await wrapper2.find(".van-nav-bar__right .mars-text-btn").trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("flat-add")
    expect(router.currentRoute.value.query.id).toBeUndefined()
    wrapper2.unmount()
  })

  it("点击删除弹出确认，确认后调用删除接口并移除对应行（不重拉列表）", async () => {
    const wrapper = mountPage(FlatList)
    await flushPromises()
    const callsBefore = mockedGetList.mock.calls.length
    const delBtn = wrapper.findAll("button").find((b) => b.text().includes("删除"))!
    await delBtn.trigger("click")
    await flushPromises()
    // I026：删除前有二次确认
    expect($dialog).toHaveBeenCalledTimes(1)
    expect(mockedDelete).toHaveBeenCalledTimes(1)
    expect(mockedDelete.mock.calls[0][0]).toBe("f1")
    expect(wrapper.text()).not.toContain("压平一")
    expect(wrapper.text()).toContain("压平二")
    expect(mockedGetList.mock.calls.length).toBe(callsBefore)
    wrapper.unmount()
  })

  it("取消确认弹窗不执行删除", async () => {
    // 先同步挂接 catch，避免提前创建的 rejected promise 被判为 unhandled rejection
    const cancelPromise = Promise.reject(new Error("cancel"))
    cancelPromise.catch(() => {})
    vi.mocked($dialog).mockReturnValueOnce(cancelPromise as any)
    const wrapper = mountPage(FlatList)
    await flushPromises()
    const delBtn = wrapper.findAll("button").find((b) => b.text().includes("删除"))!
    await delBtn.trigger("click")
    await flushPromises()
    expect(mockedDelete).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain("压平一")
    wrapper.unmount()
  })

  it("列表为空时展示暂无数据空态", async () => {
    mockedGetList.mockResolvedValue({ code: 200, data: [] } as any)
    const wrapper = mountPage(FlatList)
    await flushPromises()
    expect(wrapper.find(".van-empty").exists()).toBe(true)
    expect(wrapper.text()).toContain("暂无数据")
    wrapper.unmount()
  })
})
