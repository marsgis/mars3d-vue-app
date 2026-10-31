import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import RoamStart from "@mars/views/camera/roam/start/index.vue"
import * as mapWork from "@mars/views/camera/roam/start/map"
import * as api from "@mars/common/api"
// 删除后 replace 的目标路由组件预加载（子路由导航需父壳一并加载）
import "@mars/views/camera/roam/index.vue"
import "@mars/views/camera/roam/draw/index.vue"
import { mountPage } from "../../../helpers/page"
import { fire } from "./helpers"

vi.mock("@mars/views/camera/roam/start/map", () => {
  const eventTarget = { on: vi.fn(), off: vi.fn(), fire: vi.fn() }
  return {
    eventTarget,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    getRoamLineData: vi.fn(),
    initRoamLine: vi.fn(),
    setCameraOptions: vi.fn(),
    stopPlay: vi.fn(),
    paly: vi.fn(),
    fixedSataus: vi.fn(),
    goBack: vi.fn(),
    playSpeed: vi.fn(),
    getTerrainHeight: vi.fn(),
    formatDistance: vi.fn((v: any) => (v ?? 0) + "米"),
    formatTime: vi.fn((v: any) => (v ?? 0) + "秒")
  }
})
vi.mock("@mars/common/api", () => ({
  getHistoricalRecordsList: vi.fn(),
  getHistoricalRecordsById: vi.fn(),
  addHistoricalRecords: vi.fn(),
  updateHistoryRecords: vi.fn(),
  deleteHistoricalRecordsById: vi.fn()
}))

beforeEach(async () => {
  vi.clearAllMocks()
  vi.mocked(api.getHistoricalRecordsById).mockResolvedValue({
    code: 200,
    data: { id: "r1", content: JSON.stringify({ name: "测试航线", positions: [[116, 39, 0], [117, 40, 0]] }) }
  } as any)
  // itemId 在 setup 时读取 query，先定位路由再挂载
  await router.push({ name: "roam-start", query: { roamLineId: "r1" } })
})

describe("roam/start 漫游播放页", () => {
  it("渲染冒烟：按记录展示航线名与操作按钮，加载漫游路线数据", async () => {
    const wrapper = mountPage(RoamStart)
    await flushPromises()
    expect(wrapper.find(".van-nav-bar__title").text()).toBe("测试航线")
    expect(api.getHistoricalRecordsById).toHaveBeenCalledWith("r1")
    expect(mapWork.getRoamLineData).toHaveBeenCalledTimes(1)
    expect(vi.mocked(mapWork.getRoamLineData).mock.calls[0][0].name).toBe("测试航线")
    const items = wrapper.findAll(".home-handle-item").map((i) => i.text())
    for (const n of ["剖面", "属性", "删除", "列表", "重播", "暂停", "倍速"]) {
      expect(items.some((t) => t.includes(n))).toBe(true)
    }
    wrapper.unmount()
  })

  it("点击「暂停」：stopPlay 返回 true 后切换为「继续」", async () => {
    vi.mocked(mapWork.stopPlay).mockReturnValue(true)
    const wrapper = mountPage(RoamStart)
    await flushPromises()
    const toggle = () => wrapper.findAll(".home-handle-item").find((i) => i.text().includes("暂停"))!
    expect(toggle().text()).toContain("暂停")
    await toggle().trigger("click")
    await flushPromises()
    expect(mapWork.stopPlay).toHaveBeenCalledTimes(1)
    expect(wrapper.findAll(".home-handle-item").find((i) => i.text().includes("继续"))).toBeDefined()
    wrapper.unmount()
  })

  it("roamLineChange 事件：更新进度条与时间展示", async () => {
    const wrapper = mountPage(RoamStart)
    await flushPromises()
    fire(mapWork as any, "roamLineChange", {
      distance: 50,
      distance_all: 100,
      second: 10,
      second_all: 20,
      point: { lng: 116.1, lat: 40.2, alt: 300 }
    })
    await flushPromises()
    const bar = wrapper.find(".time-bar")
    expect(bar.exists()).toBe(true)
    expect(bar.find(".time-num").text()).toBe("10秒/20秒")
    expect(bar.find(".van-progress__portion").element.style.width).toBe("50%")
    expect(mapWork.formatDistance).toHaveBeenCalledWith(50)
    expect(mapWork.formatDistance).toHaveBeenCalledWith(300)
    wrapper.unmount()
  })

  it("删除记录：调用删除接口、goBack 清理并回到 roam-draw", async () => {
    vi.mocked(api.deleteHistoricalRecordsById).mockResolvedValue({ code: 200 } as any)
    const wrapper = mountPage(RoamStart)
    await flushPromises()
    const del = wrapper.findAll(".home-handle-item").find((i) => i.text().includes("删除"))!
    await del.trigger("click")
    await flushPromises()
    expect(api.deleteHistoricalRecordsById).toHaveBeenCalledWith("r1")
    expect(mapWork.goBack).toHaveBeenCalledTimes(1)
    // setTimeout(50) 后才 replace，等待真实定时器
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(router.currentRoute.value.name).toBe("roam-draw")
    expect(router.currentRoute.value.query.id).toBeUndefined()
    wrapper.unmount()
  })

  it("记录损坏或获取失败：提示并返回上一页", async () => {
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    // content 不是合法 JSON
    vi.mocked(api.getHistoricalRecordsById).mockResolvedValue({
      code: 200,
      data: { id: "r1", content: "{bad-json" }
    } as any)
    let wrapper = mountPage(RoamStart)
    await flushPromises()
    expect(goSpy).toHaveBeenCalledWith(-1)
    wrapper.unmount()

    // 接口失败
    vi.mocked(api.getHistoricalRecordsById).mockResolvedValue({ code: 500 } as any)
    wrapper = mountPage(RoamStart)
    await flushPromises()
    expect(goSpy).toHaveBeenCalledTimes(2)
    wrapper.unmount()
    goSpy.mockRestore()
  })
})
