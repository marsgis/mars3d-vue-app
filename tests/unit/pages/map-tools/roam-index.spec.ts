import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import RoamIndex from "@mars/views/camera/roam/index.vue"
// 预加载子路由组件，router.push 时可同步解析
import "@mars/views/camera/roam/draw/index.vue"
import * as api from "@mars/common/api"
import { mountPage } from "../../../helpers/page"

// 壳内 router-view 挂载 roam/draw 子页，其真实 map.ts 会调用 api，受控替换保证确定性
vi.mock("@mars/common/api", () => ({
  getHistoricalRecordsList: vi.fn(),
  getHistoricalRecordsById: vi.fn(),
  addHistoricalRecords: vi.fn(),
  updateHistoryRecords: vi.fn(),
  deleteHistoricalRecordsById: vi.fn()
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.getHistoricalRecordsList).mockResolvedValue({ code: 200, data: [] } as any)
})

describe("roam 飞行漫游容器壳", () => {
  it("壳冒烟：访问 /roam/draw 时壳内渲染绘制页（飞行漫游 + 绘制/列表工具）", async () => {
    await router.push("/roam/draw")
    await flushPromises()
    const wrapper = mountPage(RoamIndex)
    await flushPromises()
    expect(wrapper.text()).toContain("飞行漫游")
    const tools = wrapper.findAll(".home-handle-item").map((i) => i.text())
    expect(tools.some((t) => t.includes("绘制"))).toBe(true)
    expect(tools.some((t) => t.includes("列表"))).toBe(true)
    wrapper.unmount()
  })

  it("访问 /roam：重定向到 /roam/draw 子页并正常渲染", async () => {
    await router.push("/roam")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("roam-draw")
    const wrapper = mountPage(RoamIndex)
    await flushPromises()
    expect(wrapper.text()).toContain("飞行漫游")
    expect(wrapper.text()).toContain("绘制")
    wrapper.unmount()
  })
})
