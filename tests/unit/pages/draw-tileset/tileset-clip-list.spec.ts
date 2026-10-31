import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises, config as vtuConfig } from "@vue/test-utils"

import ClipList from "@mars/views/tileset/clip/list/index.vue"
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
  { id: "c1", title: "剖切一", update_time: nowStr },
  { id: "c2", title: "剖切二", update_time: nowStr }
]

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetList.mockResolvedValue({ code: 200, data: listData } as any)
  mockedDelete.mockResolvedValue({ code: 200 } as any)
})

describe("tileset-clip 模型剖切列表", () => {
  it("渲染：标题与接口返回的列表项", async () => {
    const wrapper = mountPage(ClipList)
    await flushPromises()
    expect(wrapper.text()).toContain("模型剖切")
    expect(wrapper.text()).toContain("剖切一")
    expect(wrapper.text()).toContain("剖切二")
    wrapper.unmount()
  })

  it("点击列表项跳转 tileset-clip-add 并携带 id", async () => {
    // 目标为嵌套路由子页：导航会懒加载父壳 + 子页，动态 import 属宏任务，flushPromises 覆盖不到，需一并预加载
    await import("@mars/views/tileset/clip/index.vue")
    await import("@mars/views/tileset/clip/add/index.vue")
    const wrapper = mountPage(ClipList)
    await flushPromises()
    const cell = wrapper.findAll(".van-cell").find((c) => c.text().includes("剖切一"))!
    await cell.trigger("click")
    await flushPromises()
    // 防御性等待导航落定（懒加载/初始导航可能引入宏任务）
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe("tileset-clip-add"), { timeout: 5000 })
    expect(router.currentRoute.value.query.id).toBe("c1")
    wrapper.unmount()
  })

  it("点击删除弹出确认，确认后调用删除接口并移除对应行（不重拉列表）", async () => {
    const wrapper = mountPage(ClipList)
    await flushPromises()
    const callsBefore = mockedGetList.mock.calls.length
    const delBtn = wrapper.findAll("button").find((b) => b.text().includes("删除"))!
    await delBtn.trigger("click")
    await flushPromises()
    // I026：删除前有二次确认
    expect($dialog).toHaveBeenCalledTimes(1)
    expect(mockedDelete).toHaveBeenCalledTimes(1)
    expect(mockedDelete.mock.calls[0][0]).toBe("c1")
    expect(wrapper.text()).not.toContain("剖切一")
    expect(wrapper.text()).toContain("剖切二")
    expect(mockedGetList.mock.calls.length).toBe(callsBefore)
    wrapper.unmount()
  })
})
