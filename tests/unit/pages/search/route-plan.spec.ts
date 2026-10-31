import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import { router } from "@mars/routes"
import RoutePlan from "@mars/views/search/route-plan/index.vue"
import { mountPage } from "../../../helpers/page"
import * as api from "@mars/common/api"

// poi-list 的 map 模块受控替换：测试可主动抛查询结果驱动选点流程
const poiMap = vi.hoisted(() => {
  const listeners: Record<string, ((e?: any) => void)[]> = {}
  return {
    eventTarget: {
      on: (evt: string, cb: (e?: any) => void) => {
        listeners[evt] = listeners[evt] || []
        listeners[evt].push(cb)
      },
      off: () => {
        Object.keys(listeners).forEach((k) => delete listeners[k])
      },
      fire: (evt: string, e?: any) => {
        ;(listeners[evt] || []).forEach((cb) => cb(e))
      }
    },
    clearListeners: () => Object.keys(listeners).forEach((k) => delete listeners[k]),
    search: vi.fn(),
    onMounted: vi.fn(),
    onUnmounted: vi.fn()
  }
})
vi.mock("@mars/views/search/comps/poi-list/map", () => poiMap)

// route-plan 自身的 map 模块受控替换（路线查询）
const routeMap = vi.hoisted(() => ({
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
  queryDrivingPath: vi.fn(),
  queryWallingPath: vi.fn()
}))
vi.mock("@mars/views/search/route-plan/map", () => routeMap)

// localforage 受控替换（poi-list 历史记录读写）
const lf = vi.hoisted(() => {
  const store = new Map<string, any>()
  const localforage = {
    getItem: vi.fn((k: string) => Promise.resolve(store.has(k) ? store.get(k) : null)),
    setItem: vi.fn((k: string, v: any) => {
      store.set(k, v)
      return Promise.resolve(v)
    }),
    removeItem: vi.fn((k: string) => {
      store.delete(k)
      return Promise.resolve()
    })
  }
  return { localforage, store }
})
vi.mock("localforage", () => ({ default: lf.localforage }))

vi.mock("@mars/common/api", () => ({
  isCollection: vi.fn().mockResolvedValue({ code: 500 }),
  addCollection: vi.fn().mockResolvedValue({ code: 500 }),
  deleteCollectionById: vi.fn().mockResolvedValue({ code: 500 }),
  getCollectionList: vi.fn().mockResolvedValue({ code: 200, data: [] }),
  getUserInformation: vi.fn().mockResolvedValue({ code: 200, data: {} })
}))

const pathResult = {
  instruction: [{ instruction: "沿京沪高速行驶" }],
  distance: "1.234公里",
  time: "3分钟"
}

const poiA = { id: "p1", name: "北京西站", address: "北京", type: "火车站", lng: 116.32, lat: 39.89 }
const poiB = { id: "p2", name: "上海站", address: "上海", type: "火车站", lng: 121.4, lat: 31.2 }

const hasMessage = (text: string) =>
  Array.from(document.body.querySelectorAll(".mars-message")).some((el) => el.textContent?.includes(text))

/** 通过 focus + 注入查询结果 + 点击结果项完成一个点的选择 */
async function choosePoint(wrapper: any, inputIndex: number, searchText: string, poi: any) {
  const input = wrapper.findAll("input.point-input")[inputIndex]
  await input.trigger("focus")
  await input.setValue(searchText)
  await flushPromises()
  poiMap.eventTarget.fire("query-result", { list: [poi], allcount: 1 })
  await flushPromises()
  const cell = wrapper.findAll(".van-cell").find((c) => c.text().includes(poi.name))!
  await cell.trigger("click")
  await flushPromises()
}

const findButton = (wrapper: any, text: string) => wrapper.findAll("button").find((b) => b.text().includes(text))!

beforeEach(async () => {
  lf.store.clear()
  poiMap.clearListeners()
  poiMap.search.mockClear()

  routeMap.queryDrivingPath.mockReset().mockResolvedValue(pathResult)
  routeMap.queryWallingPath.mockReset().mockResolvedValue(pathResult)

  vi.mocked(api.isCollection).mockReset().mockResolvedValue({ code: 500 } as any)
  vi.mocked(api.addCollection).mockReset().mockResolvedValue({ code: 500 } as any)
  vi.mocked(api.deleteCollectionById).mockReset().mockResolvedValue({ code: 500 } as any)

  await router.push({ name: "route-plan" })
  await flushPromises()
})

describe("route-plan 路线规划页", () => {
  it("渲染冒烟：起终点输入框（默认起点为当前定位）、添加途经点入口与驾车/步行按钮", async () => {
    const wrapper = mountPage(RoutePlan)
    await flushPromises()

    const inputs = wrapper.findAll("input.point-input")
    expect(inputs.length).toBe(2)
    expect(inputs[0].attributes("placeholder")).toBe("输入起点")
    expect(inputs[1].attributes("placeholder")).toBe("输入终点")
    expect((inputs[0].element as HTMLInputElement).value).toBe("我的位置")
    expect(wrapper.find(".add-desc").text()).toContain("添加途经点")
    expect(wrapper.find(".add-desc").text()).toContain("13") // 还可添加 15 - 2 个
    expect(findButton(wrapper, "驾车").exists()).toBe(true)
    expect(findButton(wrapper, "步行").exists()).toBe(true)
    wrapper.unmount()
  })

  it("添加/删除途经点", async () => {
    const wrapper = mountPage(RoutePlan)
    await flushPromises()

    await wrapper.find(".add-point .mars-icon").trigger("click")
    await flushPromises()
    const inputs = wrapper.findAll("input.point-input")
    expect(inputs.length).toBe(3)
    expect(inputs[1].attributes("placeholder")).toBe("输入途经点")
    expect(wrapper.find(".add-desc").text()).toContain("12") // 15 - 3 个
    expect(wrapper.findAll(".point-input-item")[1].find(".mars-icon").exists()).toBe(true)

    await wrapper.findAll(".point-input-item")[1].find(".mars-icon").trigger("click")
    await flushPromises()
    expect(wrapper.findAll("input.point-input").length).toBe(2)
    expect(wrapper.find(".add-desc").text()).toContain("13")
    wrapper.unmount()
  })

  it("未选择地点（showQuick）时点击驾车被拦截", async () => {
    const wrapper = mountPage(RoutePlan)
    await flushPromises()

    await wrapper.findAll("input.point-input")[0].trigger("focus")
    await flushPromises()
    await findButton(wrapper, "驾车").trigger("click")
    await flushPromises()

    expect(hasMessage("请选择导航地点")).toBe(true)
    expect(routeMap.queryDrivingPath).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("缺少可导航位置时点击步行被拦截", async () => {
    const wrapper = mountPage(RoutePlan)
    await flushPromises()

    await findButton(wrapper, "步行").trigger("click")
    await flushPromises()

    expect(hasMessage("请选择导航位置！")).toBe(true)
    expect(routeMap.queryWallingPath).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("选点后驾车查询：调用路线接口并渲染步骤、距离与时间", async () => {
    const wrapper = mountPage(RoutePlan)
    await flushPromises()

    await choosePoint(wrapper, 0, "我的位置", poiA)
    await choosePoint(wrapper, 1, "上海站", poiB)
    await findButton(wrapper, "驾车").trigger("click")
    await flushPromises()

    expect(routeMap.queryDrivingPath).toHaveBeenCalledTimes(1)
    expect(routeMap.queryDrivingPath).toHaveBeenCalledWith([
      [116.32, 39.89],
      [121.4, 31.2]
    ])
    expect(wrapper.text()).toContain("从我的位置出发")
    expect(wrapper.text()).toContain("1.234公里")
    expect(wrapper.text()).toContain("3分钟")
    expect(wrapper.text()).toContain("沿京沪高速行驶")
    wrapper.unmount()
  })

  it("选点后步行查询：切换路线类型并调用步行接口", async () => {
    const wrapper = mountPage(RoutePlan)
    await flushPromises()

    await choosePoint(wrapper, 0, "我的位置", poiA)
    await choosePoint(wrapper, 1, "上海站", poiB)
    await findButton(wrapper, "步行").trigger("click")
    await flushPromises()

    expect(routeMap.queryWallingPath).toHaveBeenCalledWith([
      [116.32, 39.89],
      [121.4, 31.2]
    ])
    // 驾车按钮失活样式、步行按钮激活样式
    expect(findButton(wrapper, "驾车").classes()).toContain("button2")
    expect(findButton(wrapper, "步行").classes()).toContain("button1")
    expect(wrapper.text()).toContain("从我的位置出发")
    wrapper.unmount()
  })

  it("驾车出路线后收藏 / 取消收藏", async () => {
    vi.mocked(api.addCollection).mockResolvedValue({ code: 200, data: { id: "L1" } } as any)
    vi.mocked(api.deleteCollectionById).mockResolvedValue({ code: 200 } as any)
    const wrapper = mountPage(RoutePlan)
    await flushPromises()

    await choosePoint(wrapper, 0, "我的位置", poiA)
    await choosePoint(wrapper, 1, "上海站", poiB)
    await findButton(wrapper, "驾车").trigger("click")
    await flushPromises()

    const collectBtn = wrapper.findAll(".collection").find((d) => d.text().includes("收藏"))!
    await collectBtn.trigger("click")
    await flushPromises()

    expect(api.addCollection).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(api.addCollection).mock.calls[0][0] as any
    expect(payload.title).toBe("北京西站-上海站")
    expect(payload.type).toBe("mars_line")
    expect(hasMessage("已收藏")).toBe(true)

    await collectBtn.trigger("click")
    await flushPromises()
    expect(api.deleteCollectionById).toHaveBeenCalledWith("L1")
    expect(hasMessage("已取消收藏")).toBe(true)
    wrapper.unmount()
  })

  it("携带 line / routeType 路由参数进入时还原路线并展示收藏状态", async () => {
    vi.mocked(api.isCollection).mockResolvedValue({
      code: 200,
      data: { title: "A站-B站", id: "L9", info: JSON.stringify({ status: true, routeType: "walking" }) }
    } as any)
    await router.push({
      name: "route-plan",
      query: {
        line: JSON.stringify([
          { name: "A站", positions: [117.0, 31.8] },
          { name: "B站", positions: [118.0, 32.0] }
        ]),
        routeType: "walking"
      }
    })
    await flushPromises()

    const wrapper = mountPage(RoutePlan)
    await flushPromises()

    expect(routeMap.queryWallingPath).toHaveBeenCalledWith([
      [117.0, 31.8],
      [118.0, 32.0]
    ])
    expect(wrapper.text()).toContain("从我的位置出发")
    expect(wrapper.text()).toContain("沿京沪高速行驶")
    expect(wrapper.html()).toContain("#ffd21e") // 已收藏星标高亮
    wrapper.unmount()
  })

  it("line 参数损坏但 routeType 正常：交通方式仍被还原，页面按无路线处理（I030）", async () => {
    await router.push({
      name: "route-plan",
      query: { line: "{invalid", routeType: "walking" }
    })
    await flushPromises()

    const wrapper = mountPage(RoutePlan)
    await flushPromises()

    // line 解析失败按无路线处理：默认起终点输入框，不发起路线查询
    expect(wrapper.findAll("input.point-input").length).toBe(2)
    expect(routeMap.queryWallingPath).not.toHaveBeenCalled()
    // routeType 未受 line 损坏影响：步行激活（button1）、驾车失活（button2）
    expect(findButton(wrapper, "驾车").classes()).toContain("button2")
    expect(findButton(wrapper, "步行").classes()).toContain("button1")
    wrapper.unmount()
  })
})
