import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"
import { $dialog } from "@mars/components/mars-ui"

import ClipList from "@mars/views/terrain/clip/list/index.vue"
import * as api from "@mars/common/api"
import { mountToolPage } from "./helpers"

// 删除二次确认统一走 $dialog（与全站弹窗一致，I026），mock 为默认确认通过；其余 mars-ui 导出保持真实实现
vi.mock("@mars/components/mars-ui", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, $dialog: vi.fn(() => Promise.resolve()) }
})

vi.mock("@mars/common/api", () => ({
  getHistoricalRecordsList: vi.fn(),
  getHistoricalRecordsById: vi.fn(),
  addHistoricalRecords: vi.fn(),
  updateHistoryRecords: vi.fn(),
  deleteHistoricalRecordsById: vi.fn()
}))

const now = Date.now()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.getHistoricalRecordsList).mockResolvedValue({
    code: 200,
    data: [
      { id: "c1", title: "开挖记录一", update_time: now },
      { id: "c2", title: "开挖记录二", update_time: now - 600_000 }
    ]
  } as any)
})

describe("clip/list 地形开挖历史列表", () => {
  it("渲染冒烟：标题、筛选下拉、两条记录", async () => {
    const wrapper = mountToolPage(ClipList)
    await flushPromises()
    expect(wrapper.text()).toContain("地形开挖")
    expect(wrapper.text()).toContain("三天内")
    expect(wrapper.text()).toContain("开挖记录一")
    expect(wrapper.text()).toContain("开挖记录二")
    wrapper.unmount()
  })

  it("点击记录项跳转 terrain-clip-add 并携带 id；关闭图标跳转新增", async () => {
    // 子路由导航需预加载父壳与子页
    await Promise.all([import("@mars/views/terrain/clip/index.vue"), import("@mars/views/terrain/clip/add/index.vue")])
    const wrapper = mountToolPage(ClipList)
    await flushPromises()
    await wrapper.findAll(".van-swipe-cell .van-cell").find((c) => c.text().includes("开挖记录一"))!.trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("terrain-clip-add")
    expect(router.currentRoute.value.query.id).toBe("c1")
    await wrapper.unmount()
    const wrapper2 = mountToolPage(ClipList)
    await flushPromises()
    await wrapper2.find(".van-nav-bar__left .mars-icon").trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("terrain-clip-add")
    expect(router.currentRoute.value.query.id).toBeUndefined()
    wrapper2.unmount()
  })

  it("点击「删除」弹出确认，确认后成功移除记录", async () => {
    vi.mocked(api.deleteHistoricalRecordsById).mockResolvedValue({ code: 200 } as any)
    const wrapper = mountToolPage(ClipList)
    await flushPromises()
    // 列表按时间排序，按标题定位目标记录的删除按钮
    await wrapper.findAll(".van-swipe-cell").find((c) => c.text().includes("开挖记录一"))!.find(".van-swipe-cell__right button").trigger("click")
    await flushPromises()
    // I026：删除前有二次确认
    expect($dialog).toHaveBeenCalledTimes(1)
    expect(api.deleteHistoricalRecordsById).toHaveBeenCalledWith("c1")
    expect(wrapper.text()).not.toContain("开挖记录一")
    expect(wrapper.text()).toContain("开挖记录二")
    wrapper.unmount()
  })
})
