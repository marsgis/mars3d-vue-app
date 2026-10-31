import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises, config as vtuConfig } from "@vue/test-utils"

import PlotList from "@mars/views/draw/plot/list/index.vue"
import { router } from "@mars/routes"
import { mountPage } from "../../../helpers/page"
import { getHistoricalRecordsList, deleteHistoricalRecordsById } from "@mars/common/api"

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
const makeRecord = (id: string, name: string) => ({
  id,
  content: JSON.stringify({ name, date: nowStr, graphic: {} })
})

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetList.mockResolvedValue({ code: 200, data: [makeRecord("p1", "标绘A"), makeRecord("p2", "标绘B")] } as any)
  mockedDelete.mockResolvedValue({ code: 200 } as any)
})

describe("plot 图上标绘列表", () => {
  it("渲染：标题、搜索栏与解析 content 后的列表项", async () => {
    const wrapper = mountPage(PlotList)
    await flushPromises()
    expect(wrapper.text()).toContain("图上标绘")
    expect(wrapper.find("input").exists()).toBe(true)
    expect(wrapper.text()).toContain("标绘A")
    expect(wrapper.text()).toContain("标绘B")
    expect(wrapper.text()).not.toContain("暂无标绘数据")
    wrapper.unmount()
  })

  it("搜索关键词过滤：不匹配的列表项 v-show 隐藏", async () => {
    const wrapper = mountPage(PlotList)
    await flushPromises()
    await wrapper.find("input").setValue("标绘A")
    await flushPromises()
    const rows = wrapper.findAll(".van-swipe-cell")
    const rowA = rows.find((r) => r.text().includes("标绘A"))!
    const rowB = rows.find((r) => r.text().includes("标绘B"))!
    expect((rowA.element as HTMLElement).style.display).not.toBe("none")
    expect((rowB.element as HTMLElement).style.display).toBe("none")
    wrapper.unmount()
  })

  it("点击列表项跳转 plot-add 并携带 id", async () => {
    // 目标为嵌套路由子页：导航会懒加载父壳 + 子页，动态 import 属宏任务，flushPromises 覆盖不到，需一并预加载
    await import("@mars/views/draw/plot/index.vue")
    await import("@mars/views/draw/plot/add/index.vue")
    const wrapper = mountPage(PlotList)
    await flushPromises()
    const cell = wrapper.findAll(".van-cell").find((c) => c.text().includes("标绘A"))!
    await cell.trigger("click")
    await flushPromises()
    // 防御性等待导航落定（懒加载/初始导航可能引入宏任务）
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe("plot-add"), { timeout: 5000 })
    expect(router.currentRoute.value.query.id).toBe("p1")
    wrapper.unmount()
  })

  it("点击删除调用删除接口并移除对应行（不重拉列表）", async () => {
    const wrapper = mountPage(PlotList)
    await flushPromises()
    const callsBefore = mockedGetList.mock.calls.length
    const delBtn = wrapper.findAll("button").find((b) => b.text().includes("删除"))!
    await delBtn.trigger("click")
    await flushPromises()
    expect(mockedDelete).toHaveBeenCalledTimes(1)
    expect(mockedDelete.mock.calls[0][0]).toBe("p1")
    expect(wrapper.text()).not.toContain("标绘A")
    expect(wrapper.text()).toContain("标绘B")
    expect(document.body.textContent).toContain("删除成功")
    expect(mockedGetList.mock.calls.length).toBe(callsBefore)
    wrapper.unmount()
  })
})
