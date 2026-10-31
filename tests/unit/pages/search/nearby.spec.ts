import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import { router } from "@mars/routes"
import Nearby from "@mars/views/search/nearby/index.vue"
import { mountPage } from "../../../helpers/page"

// nearby 的 map 模块受控替换（周边查询）
const nearbyMap = vi.hoisted(() => ({
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
  queryNearby: vi.fn()
}))
vi.mock("@mars/views/search/nearby/map", () => nearbyMap)

beforeEach(async () => {
  nearbyMap.queryNearby.mockReset()
  await router.push({ name: "nearby", query: { positions: "117.2,31.8" } })
  await flushPromises()
})

describe("nearby 附近搜索分类页", () => {
  it("渲染冒烟：导航栏与 12 个分类入口", () => {
    const wrapper = mountPage(Nearby)
    expect(wrapper.find(".van-nav-bar__title").text()).toBe("附近")
    const items = wrapper.findAll(".van-grid-item")
    expect(items.length).toBe(12)
    expect(wrapper.text()).toContain("美食")
    expect(wrapper.text()).toContain("酒店")
    expect(wrapper.text()).toContain("公厕")
    wrapper.unmount()
  })

  it("点击分类跳转 nearby-result 并按分类码发起周边查询", async () => {
    await Promise.all([import("@mars/views/search/nearby-result/index.vue")])
    const wrapper = mountPage(Nearby)
    await flushPromises()
    nearbyMap.queryNearby.mockClear()

    await wrapper.findAll(".van-grid-item")[0].trigger("click") // 美食
    await flushPromises()

    expect(nearbyMap.queryNearby).toHaveBeenCalledWith("050000", 3000, "117.2,31.8")
    expect(router.currentRoute.value.name).toBe("nearby-result")
    expect(router.currentRoute.value.query.title).toBe("美食")
    expect(router.currentRoute.value.query.code).toBe("050000")
    wrapper.unmount()
  })

  it("导航栏左箭头返回上一页", async () => {
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountPage(Nearby)
    await flushPromises()

    await wrapper.find(".van-nav-bar__left").trigger("click")

    expect(goSpy).toHaveBeenCalledWith(-1)
    goSpy.mockRestore()
    wrapper.unmount()
  })
})
