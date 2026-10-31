import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import VisibleList from "@mars/views/analysis/visible/list/index.vue"
import * as api from "@mars/common/api"
import { $dialog } from "@mars/components/mars-ui"
import { mountToolPage } from "./helpers"

vi.mock("@mars/common/api", () => ({
  getHistoricalRecordsList: vi.fn(),
  getHistoricalRecordsById: vi.fn(),
  addHistoricalRecords: vi.fn(),
  updateHistoryRecords: vi.fn(),
  deleteHistoricalRecordsById: vi.fn()
}))
// 删除已加二次确认：仅替换 $dialog 为受控 mock（确认分支可控），其余导出保持真实实现
vi.mock("@mars/components/mars-ui", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, $dialog: vi.fn() }
})

const mockedDialog = vi.mocked($dialog)

const now = Date.now()

beforeEach(() => {
  vi.clearAllMocks()
  mockedDialog.mockResolvedValue("confirm" as any)
  vi.mocked(api.getHistoricalRecordsList).mockResolvedValue({
    code: 200,
    data: [
      { id: "a1", title: "可视域A", update_time: now },
      { id: "b2", title: "可视域B", update_time: now - 1000 }
    ]
  } as any)
})

describe("visible/list 可视域历史列表", () => {
  it("渲染冒烟：标题、筛选下拉、两条历史记录按时间展示", async () => {
    const wrapper = mountToolPage(VisibleList)
    await flushPromises()
    expect(wrapper.text()).toContain("可视域")
    expect(wrapper.text()).toContain("三天内")
    expect(wrapper.text()).toContain("排序")
    expect(wrapper.text()).toContain("可视域A")
    expect(wrapper.text()).toContain("可视域B")
    expect(wrapper.findAll(".van-swipe-cell").length).toBe(2)
    wrapper.unmount()
  })

  it("接口失败（code != 200）：列表为空不渲染记录", async () => {
    vi.mocked(api.getHistoricalRecordsList).mockResolvedValue({ code: 500, data: [] } as any)
    const wrapper = mountToolPage(VisibleList)
    await flushPromises()
    expect(wrapper.findAll(".van-swipe-cell").length).toBe(0)
    wrapper.unmount()
  })

  it("点击记录项跳转 visible-add 并携带 id", async () => {
    // visible-add 是 analysis 父壳的三级子路由，需预载全部三层组件
    await Promise.all([import("@mars/views/analysis/index.vue"), import("@mars/views/analysis/visible/index.vue"), import("@mars/views/analysis/visible/add/index.vue")])
    const wrapper = mountToolPage(VisibleList)
    await flushPromises()
    await wrapper.findAll(".van-swipe-cell .van-cell").find((c) => c.text().includes("可视域A"))!.trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("visible-add")
    expect(router.currentRoute.value.query.id).toBe("a1")
    wrapper.unmount()
  })

  it("点击「删除」：先弹确认框，确认后调用删除接口并从列表与筛选源中同步移除", async () => {
    vi.mocked(api.deleteHistoricalRecordsById).mockResolvedValue({ code: 200 } as any)
    const wrapper = mountToolPage(VisibleList)
    await flushPromises()
    // 列表按时间排序，按标题定位目标记录的删除按钮
    const targetCell = () => wrapper.findAll(".van-swipe-cell").find((c) => c.text().includes("可视域A"))!
    await targetCell().find(".van-swipe-cell__right button").trigger("click")
    await flushPromises()
    // 新契约：删除前需二次确认（I026），确认文案与标题固定
    expect(mockedDialog).toHaveBeenCalledWith(expect.objectContaining({ title: "提示", message: "确定删除该记录吗？", showCancelButton: true }))
    expect(api.deleteHistoricalRecordsById).toHaveBeenCalledWith("a1")
    const titles = wrapper.findAll(".van-swipe-cell .van-cell__title").map((c) => c.text())
    expect(titles.some((t) => t.includes("可视域A"))).toBe(false)
    expect(titles.some((t) => t.includes("可视域B"))).toBe(true)
    // 删除失败时列表不变
    const wrapper2 = mountToolPage(VisibleList)
    await flushPromises()
    vi.mocked(api.deleteHistoricalRecordsById).mockResolvedValue({ code: 500 } as any)
    await wrapper2.findAll(".van-swipe-cell").find((c) => c.text().includes("可视域B"))!.find(".van-swipe-cell__right button").trigger("click")
    await flushPromises()
    expect(wrapper2.findAll(".van-swipe-cell").length).toBe(2)
    wrapper2.unmount()
    wrapper.unmount()
  })

  it("点击「删除」后取消确认：不调用删除接口，列表保持", async () => {
    mockedDialog.mockRejectedValueOnce("cancel" as any)
    const wrapper = mountToolPage(VisibleList)
    await flushPromises()
    await wrapper.findAll(".van-swipe-cell").find((c) => c.text().includes("可视域A"))!.find(".van-swipe-cell__right button").trigger("click")
    await flushPromises()
    expect(mockedDialog).toHaveBeenCalledTimes(1)
    expect(api.deleteHistoricalRecordsById).not.toHaveBeenCalled()
    expect(wrapper.findAll(".van-swipe-cell").length).toBe(2)
    wrapper.unmount()
  })

  it("条目 key 使用记录 id（稳定 key），删除后复用不串位（I026）", async () => {
    const wrapper = mountToolPage(VisibleList)
    await flushPromises()
    // 列表默认按时间升序渲染，排序后比较，仅验证 key 为记录 id 而非索引
    const keys = wrapper.findAllComponents({ name: "mars-swipe-cell" }).map((c: any) => c.vm.$.vnode.key)
    expect([...keys].sort()).toEqual(["a1", "b2"])
    wrapper.unmount()
  })

  it("导航栏关闭图标跳转 visible-add（新增入口）", async () => {
    await Promise.all([import("@mars/views/analysis/index.vue"), import("@mars/views/analysis/visible/index.vue"), import("@mars/views/analysis/visible/add/index.vue")])
    const wrapper = mountToolPage(VisibleList)
    await flushPromises()
    // #left 插槽内 mars-icon 自带 @click，需点击图标本身
    await wrapper.find(".van-nav-bar__left .mars-icon").trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("visible-add")
    expect(router.currentRoute.value.query.id).toBeUndefined()
    wrapper.unmount()
  })
})
