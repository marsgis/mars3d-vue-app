import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import VolumeList from "@mars/views/analysis/volume/list/index.vue"
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
      { id: "v1", title: "方量记录一", update_time: now },
      { id: "v2", title: "方量记录二", update_time: now - 3600_000 }
    ]
  } as any)
})

describe("volume/list 方量分析历史列表", () => {
  it("渲染冒烟：标题与两条记录", async () => {
    const wrapper = mountToolPage(VolumeList)
    await flushPromises()
    expect(wrapper.text()).toContain("方量分析")
    expect(wrapper.text()).toContain("方量记录一")
    expect(wrapper.text()).toContain("方量记录二")
    expect(wrapper.findAll(".van-swipe-cell").length).toBe(2)
    wrapper.unmount()
  })

  it("点击记录项跳转 volume-add 并携带 id；关闭图标跳转新增", async () => {
    // volume-add 是 analysis 父壳的三级子路由，需预载全部三层组件
    await Promise.all([import("@mars/views/analysis/index.vue"), import("@mars/views/analysis/volume/index.vue"), import("@mars/views/analysis/volume/add/index.vue")])
    const wrapper = mountToolPage(VolumeList)
    await flushPromises()
    await wrapper.findAll(".van-swipe-cell .van-cell").find((c) => c.text().includes("方量记录一"))!.trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("volume-add")
    expect(router.currentRoute.value.query.id).toBe("v1")
    await wrapper.unmount()
    const wrapper2 = mountToolPage(VolumeList)
    await flushPromises()
    // #left 插槽内 mars-icon 自带 @click，需点击图标本身
    await wrapper2.find(".van-nav-bar__left .mars-icon").trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("volume-add")
    expect(router.currentRoute.value.query.id).toBeUndefined()
    wrapper2.unmount()
  })

  it("点击「删除」：先弹确认框，确认后移除记录；失败：列表保持", async () => {
    vi.mocked(api.deleteHistoricalRecordsById).mockResolvedValue({ code: 200 } as any)
    const wrapper = mountToolPage(VolumeList)
    await flushPromises()
    // 列表按时间排序，按标题定位目标记录的删除按钮
    await wrapper.findAll(".van-swipe-cell").find((c) => c.text().includes("方量记录一"))!.find(".van-swipe-cell__right button").trigger("click")
    await flushPromises()
    // 新契约：删除前需二次确认（I026）
    expect(mockedDialog).toHaveBeenCalledWith(expect.objectContaining({ title: "提示", message: "确定删除该记录吗？", showCancelButton: true }))
    expect(api.deleteHistoricalRecordsById).toHaveBeenCalledWith("v1")
    expect(wrapper.text()).not.toContain("方量记录一")
    expect(wrapper.text()).toContain("方量记录二")
    wrapper.unmount()

    vi.mocked(api.deleteHistoricalRecordsById).mockResolvedValue({ code: 500 } as any)
    const wrapper2 = mountToolPage(VolumeList)
    await flushPromises()
    await wrapper2.findAll(".van-swipe-cell").find((c) => c.text().includes("方量记录二"))!.find(".van-swipe-cell__right button").trigger("click")
    await flushPromises()
    expect(wrapper2.findAll(".van-swipe-cell").length).toBe(2)
    wrapper2.unmount()
  })

  it("点击「删除」后取消确认：不调用删除接口，列表保持；条目 key 为记录 id（I026）", async () => {
    mockedDialog.mockRejectedValueOnce("cancel" as any)
    const wrapper = mountToolPage(VolumeList)
    await flushPromises()
    // 稳定 key：以记录 id 作为 vnode key（列表默认按时间升序，排序后比较），删除后复用不串位
    const keys = wrapper.findAllComponents({ name: "mars-swipe-cell" }).map((c: any) => c.vm.$.vnode.key)
    expect([...keys].sort()).toEqual(["v1", "v2"])

    await wrapper.findAll(".van-swipe-cell").find((c) => c.text().includes("方量记录一"))!.find(".van-swipe-cell__right button").trigger("click")
    await flushPromises()
    expect(api.deleteHistoricalRecordsById).not.toHaveBeenCalled()
    expect(wrapper.findAll(".van-swipe-cell").length).toBe(2)
    wrapper.unmount()
  })
})
