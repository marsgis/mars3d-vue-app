import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import RoamList from "@mars/views/camera/roam/list/index.vue"
// 预加载跳转目标路由组件（子路由导航需父壳一并加载）
import "@mars/views/camera/roam/index.vue"
import "@mars/views/camera/roam/draw/index.vue"
import "@mars/views/camera/roam/start/index.vue"
import * as api from "@mars/common/api"
import { mountPage } from "../../../helpers/page"

vi.mock("@mars/common/api", () => ({
  getHistoricalRecordsList: vi.fn(),
  getHistoricalRecordsById: vi.fn(),
  addHistoricalRecords: vi.fn(),
  updateHistoryRecords: vi.fn(),
  deleteHistoricalRecordsById: vi.fn()
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.getHistoricalRecordsList).mockResolvedValue({
    code: 200,
    data: [{ id: "r1", content: JSON.stringify({ name: "巡检航线" }) }]
  } as any)
})

describe("roam/list 漫游航线历史列表", () => {
  it("渲染冒烟：标题与漫游航线记录", async () => {
    const wrapper = mountPage(RoamList)
    await flushPromises()
    expect(wrapper.text()).toContain("飞行漫游")
    expect(wrapper.text()).toContain("巡检航线")
    expect(wrapper.findAll(".van-swipe-cell").length).toBe(1)
    wrapper.unmount()
  })

  it("无数据：展示空态提示", async () => {
    vi.mocked(api.getHistoricalRecordsList).mockResolvedValue({ code: 500 } as any)
    const wrapper = mountPage(RoamList)
    await flushPromises()
    expect(wrapper.text()).toContain("暂无漫游数据")
    expect(wrapper.find(".mars-empty").exists()).toBe(true)
    wrapper.unmount()
  })

  it("点击记录项跳转 roam-draw 携带 id；左上关闭跳转 roam-draw 不带 query", async () => {
    const wrapper = mountPage(RoamList)
    await flushPromises()
    await wrapper.find(".van-swipe-cell .van-cell").trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("roam-draw")
    expect(router.currentRoute.value.query.id).toBe("r1")
    await wrapper.unmount()

    const wrapper2 = mountPage(RoamList)
    await flushPromises()
    await wrapper2.find(".van-nav-bar__left .mars-icon").trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("roam-draw")
    expect(router.currentRoute.value.query.id).toBeUndefined()
    wrapper2.unmount()
  })

  it("点击播放图标跳转 roam-start 携带 roamLineId（点击不冒泡到记录项）", async () => {
    const wrapper = mountPage(RoamList)
    await flushPromises()
    await wrapper.find(".van-cell .mars-icon").trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("roam-start")
    expect(router.currentRoute.value.query.roamLineId).toBe("r1")
    wrapper.unmount()
  })

  it("删除成功：调用删除接口并重新拉取列表", async () => {
    vi.mocked(api.deleteHistoricalRecordsById).mockResolvedValue({ code: 200 } as any)
    const wrapper = mountPage(RoamList)
    await flushPromises()
    expect(api.getHistoricalRecordsList).toHaveBeenCalledTimes(1)
    await wrapper.find(".van-swipe-cell__right button").trigger("click")
    await flushPromises()
    expect(api.deleteHistoricalRecordsById).toHaveBeenCalledWith("r1")
    expect(api.getHistoricalRecordsList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })
})
