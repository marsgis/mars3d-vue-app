import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import { router } from "@mars/routes"
import SearchHome from "@mars/views/search/search-home/index.vue"
import QuickPoint from "@mars/components/quick-point/index.vue"
import { mountPage } from "../../../helpers/page"

// poi-list 的 map 模块受控替换：eventTarget 提供真实 on/off/fire 语义，测试可主动抛查询结果
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

// localforage 受控替换（poi-list 历史记录读写），避免依赖 IndexedDB 真实初始化时序
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

// quick-point 真实挂载会请求收藏列表，受控兜底
vi.mock("@mars/common/api", () => ({
  getCollectionList: vi.fn().mockResolvedValue({ code: 200, data: [] }),
  getUserInformation: vi.fn().mockResolvedValue({ code: 200, data: {} })
}))

const HISTORY_KEY = "search-result"

const historyItems = [
  { key: "k1", name: "合肥火车站", address: "瑶海区", type: "交通设施", positions: [117.3, 31.8] },
  { key: "k2", name: "万达广场", address: "包河区", type: "购物", positions: [117.28, 31.86] }
]

beforeEach(() => {
  lf.store.clear()
  lf.localforage.getItem.mockClear()
  lf.localforage.setItem.mockClear()
  lf.localforage.removeItem.mockClear()
  poiMap.clearListeners()
  poiMap.search.mockClear()
})

describe("search-home 搜索首页", () => {
  it("渲染冒烟：搜索框、搜索按钮与空历史提示", async () => {
    const wrapper = mountPage(SearchHome)
    await flushPromises()
    expect(wrapper.find(".mars-search input").exists()).toBe(true)
    expect(wrapper.find(".van-search__action").text()).toBe("搜索")
    expect(wrapper.text()).toContain("没有搜索记录")
    wrapper.unmount()
  })

  it("历史记录渲染与清空", async () => {
    lf.store.set(HISTORY_KEY, JSON.stringify(historyItems))
    const wrapper = mountPage(SearchHome)
    await flushPromises()
    expect(wrapper.text()).toContain("合肥火车站")
    expect(wrapper.text()).toContain("清空历史记录")

    await wrapper.find(".clear-histor_data").trigger("click")
    await flushPromises()
    expect(lf.localforage.removeItem).toHaveBeenCalledWith(HISTORY_KEY)
    expect(wrapper.text()).toContain("没有搜索记录")
    expect(wrapper.text()).not.toContain("合肥火车站")
    wrapper.unmount()
  })

  it("点击「搜索」后 poi-list 切换为结果分支并渲染查询结果", async () => {
    const wrapper = mountPage(SearchHome)
    await flushPromises()
    await wrapper.find(".mars-search input").setValue("奶茶")
    // action 槽内层 div 才绑定了 @click，点击外层容器不会触发
    await wrapper.find(".van-search__action div").trigger("click")
    await flushPromises()

    // keyWords 生效后 poi-list 才会走 van-list 结果分支渲染查询数据
    poiMap.eventTarget.fire("query-result", {
      list: [{ id: "p1", name: "一点点奶茶", address: "长江路", type: "餐饮", lng: 117.2, lat: 31.8 }],
      allcount: 1
    })
    await flushPromises()
    expect(wrapper.text()).toContain("一点点奶茶")
    expect(wrapper.text()).not.toContain("没有搜索记录")
    wrapper.unmount()
  })

  it("点击历史记录项跳转 search-result 并携带路由参数", async () => {
    await Promise.all([import("@mars/views/search/search-result/index.vue")])
    lf.store.set(HISTORY_KEY, JSON.stringify(historyItems))
    const wrapper = mountPage(SearchHome)
    await flushPromises()

    const cell = wrapper.findAll(".van-cell").find((c) => c.text().includes("合肥火车站"))!
    await cell.trigger("click")
    await flushPromises()

    // 选中后先写入本地历史，再由 selectItem 触发路由跳转
    expect(lf.localforage.setItem).toHaveBeenCalledWith(HISTORY_KEY, expect.stringContaining("合肥火车站"))
    await flushPromises()
    // coverage 运行下懒加载组件解析变慢，固定轮次 flushPromises 可能早于导航完成，改轮询等待
    await vi.waitFor(
      () => {
        expect(router.currentRoute.value.name).toBe("search-result")
      },
      { timeout: 10000, interval: 50 }
    )
    expect(router.currentRoute.value.query.pointId).toBe("k1")
    expect(String(router.currentRoute.value.query.point)).toContain("合肥火车站")
    wrapper.unmount()
  })

  it("quick-point 图上选点事件切换页面显隐（operateMap / operateMapEnd）", async () => {
    const wrapper = mountPage(SearchHome)
    await flushPromises()

    const quick = wrapper.findComponent(QuickPoint)
    expect(quick.exists()).toBe(true)
    const panel = () => wrapper.find(".search-home")
    expect(panel().isVisible()).toBe(true)

    quick.vm.$emit("operateMap")
    await flushPromises()
    expect(panel().isVisible()).toBe(false)
    quick.vm.$emit("operateMapEnd")
    await flushPromises()
    expect(panel().isVisible()).toBe(true)
    wrapper.unmount()
  })
})
