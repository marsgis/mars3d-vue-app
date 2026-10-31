import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import { router } from "@mars/routes"
import SearchResult from "@mars/views/search/search-result/index.vue"
import { mountPage } from "../../../helpers/page"
import * as api from "@mars/common/api"

// search-result 的 map 模块受控替换（flyToTarget / 详情接口）
const resultMap = vi.hoisted(() => ({
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
  eventTarget: { on: vi.fn(), off: vi.fn() },
  flyToTarget: vi.fn(),
  clearLayer: vi.fn(),
  getGodeApi: vi.fn()
}))
vi.mock("@mars/views/search/search-result/map", () => resultMap)

vi.mock("@mars/common/api", () => ({
  isCollection: vi.fn().mockResolvedValue({ code: 500 }),
  addCollection: vi.fn().mockResolvedValue({ code: 500 }),
  deleteCollectionById: vi.fn().mockResolvedValue({ code: 500 }),
  getCollectionList: vi.fn().mockResolvedValue({ code: 200, data: [] }),
  getUserInformation: vi.fn().mockResolvedValue({ code: 200, data: {} })
}))

const stubs = { ToolsShortcut: true, LayerShortcut: true, AutoLocate: true }

const pointFixture = {
  key: "poi-1",
  name: "合肥火车站",
  address: "瑶海区站西路",
  type: "交通设施",
  positions: [117.3, 31.8],
  photos: [{ url: "img/poi/1.jpg" }]
}

const hasMessage = (text: string) =>
  Array.from(document.body.querySelectorAll(".mars-message")).some((el) => el.textContent?.includes(text))

const pushPointRoute = async () => {
  await router.push({
    name: "search-result",
    query: { point: JSON.stringify(pointFixture), pointId: "poi-1" }
  })
  await flushPromises()
}

beforeEach(() => {
  resultMap.flyToTarget.mockReset()
  resultMap.getGodeApi.mockReset()
  vi.mocked(api.isCollection).mockReset().mockResolvedValue({ code: 500 } as any)
  vi.mocked(api.addCollection).mockReset().mockResolvedValue({ code: 500 } as any)
  vi.mocked(api.deleteCollectionById).mockReset().mockResolvedValue({ code: 500 } as any)
})

describe("search-result 搜索结果页", () => {
  it("渲染冒烟：地点名称、详情弹层与工具入口，并定位到目标点", async () => {
    await pushPointRoute()
    const wrapper = mountPage(SearchResult, { stubs })
    await flushPromises()

    expect(wrapper.find(".region-name").text()).toBe("合肥火车站")
    expect(wrapper.find(".message-title_name").text()).toBe("合肥火车站")
    expect(wrapper.text()).toContain("交通设施")
    expect(wrapper.text()).toContain("瑶海区站西路")
    expect(wrapper.text()).toContain("收藏")
    expect(wrapper.text()).toContain("附近")
    expect(wrapper.text()).toContain("导航")
    expect(wrapper.text()).toContain("路线")
    expect(resultMap.flyToTarget).toHaveBeenCalledWith([117.3, 31.8], "合肥火车站")
    expect(api.isCollection).toHaveBeenCalledWith({ title: "合肥火车站" })
    wrapper.unmount()
  })

  it("点击地点名称展开/收起相册", async () => {
    await pushPointRoute()
    const wrapper = mountPage(SearchResult, { stubs })
    await flushPromises()

    const nameEl = wrapper.find(".message-title_name")
    await nameEl.trigger("click")
    const albumText = wrapper.findAll(".van-nav-bar__text").find((el) => el.text() === "相册")
    expect(albumText?.isVisible()).toBe(true)
    expect(wrapper.html()).toContain("img/poi/1.jpg")

    await nameEl.trigger("click")
    expect(albumText?.isVisible()).toBe(false)
    wrapper.unmount()
  })

  it("路由缺少 point 且详情接口失败时提示并返回", async () => {
    resultMap.getGodeApi.mockRejectedValue(new Error("detail fail"))
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    await router.push({ name: "search-result" })
    await flushPromises()

    const wrapper = mountPage(SearchResult, { stubs })
    await flushPromises()

    expect(hasMessage("获取地点信息失败")).toBe(true)
    expect(goSpy).toHaveBeenCalledWith(-1)
    goSpy.mockRestore()
    wrapper.unmount()
  })

  it("未收藏时点击收藏：提交收藏数据并提示成功", async () => {
    vi.mocked(api.addCollection).mockResolvedValue({ code: 200, data: { id: "c-2" } } as any)
    await pushPointRoute()
    const wrapper = mountPage(SearchResult, { stubs })
    await flushPromises()
    expect(wrapper.html()).not.toContain("var(--mars-poi-star)")

    await wrapper.findAll(".van-grid-item")[0].trigger("click")
    await flushPromises()

    expect(api.addCollection).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(api.addCollection).mock.calls[0][0] as any
    expect(payload.type).toBe("mars_point")
    expect(payload.title).toBe("合肥火车站")
    expect(JSON.parse(payload.info).status).toBe(true)
    expect(hasMessage("已收藏")).toBe(true)
    expect(wrapper.html()).toContain("var(--mars-poi-star)")
    wrapper.unmount()
  })

  it("已收藏时点击收藏：调用删除接口并复位状态", async () => {
    vi.mocked(api.isCollection).mockResolvedValue({
      code: 200,
      data: { title: "合肥火车站", id: "c-1", info: JSON.stringify({ status: true }) }
    } as any)
    vi.mocked(api.deleteCollectionById).mockResolvedValue({ code: 200 } as any)
    await pushPointRoute()
    const wrapper = mountPage(SearchResult, { stubs })
    await flushPromises()
    expect(wrapper.html()).toContain("var(--mars-poi-star)")

    await wrapper.findAll(".van-grid-item")[0].trigger("click")
    await flushPromises()

    expect(api.deleteCollectionById).toHaveBeenCalledWith("c-1")
    expect(hasMessage("已取消收藏")).toBe(true)
    wrapper.unmount()
  })

  it("工具入口跳转：附近 / 路线规划并携带参数", async () => {
    await Promise.all([import("@mars/views/search/nearby/index.vue"), import("@mars/views/search/route-plan/index.vue")])
    await pushPointRoute()
    const wrapper = mountPage(SearchResult, { stubs })
    await flushPromises()

    const gridItems = wrapper.findAll(".van-grid-item")
    await gridItems[1].trigger("click") // 附近
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("nearby")
    expect(router.currentRoute.value.query.name).toBe("合肥火车站")

    await gridItems[3].trigger("click") // 路线
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("route-plan")
    expect(String(router.currentRoute.value.query.endPoint)).toContain("合肥火车站")
    wrapper.unmount()
  })
})
