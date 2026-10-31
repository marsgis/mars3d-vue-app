import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import { router } from "@mars/routes"
import NearbyResult from "@mars/views/search/nearby-result/index.vue"
import { mountPage } from "../../../helpers/page"

// nearby-result 的 map 模块受控替换：eventTarget 可真实 fire，测试可主动抛查询结果/错误
const nearbyResultMap = vi.hoisted(() => {
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
    queryNearby: vi.fn(),
    pageNum: vi.fn(),
    onMounted: vi.fn(),
    onUnmounted: vi.fn()
  }
})
vi.mock("@mars/views/search/nearby-result/map", () => nearbyResultMap)

const hasMessage = (text: string) =>
  Array.from(document.body.querySelectorAll(".mars-message")).some((el) => el.textContent?.includes(text))

beforeEach(async () => {
  nearbyResultMap.clearListeners()
  nearbyResultMap.queryNearby.mockReset()
  nearbyResultMap.pageNum.mockReset()
  await router.push({
    name: "nearby-result",
    query: { title: "美食", code: "050000", positions: "117.2,31.8" }
  })
  await flushPromises()
})

describe("nearby-result 附近结果页", () => {
  it("渲染冒烟：导航栏标题、搜索框与距离筛选默认 2 千米", async () => {
    const wrapper = mountPage(NearbyResult)
    await flushPromises()
    expect(wrapper.find(".van-nav-bar__title").text()).toBe("美食")
    expect(wrapper.find(".mars-search input").exists()).toBe(true)
    expect(wrapper.find(".van-search__action").text()).toBe("搜索")
    expect(wrapper.find(".van-dropdown-menu__title").text()).toContain("2千米")
    wrapper.unmount()
  })

  it("周边数据事件渲染结果列表：地址数组兜底、图片兜底与分页完结", async () => {
    const wrapper = mountPage(NearbyResult)
    await flushPromises()

    nearbyResultMap.eventTarget.fire("nearby-result", {
      result: {
        count: 2,
        allcount: 2,
        list: [
          { id: "n1", name: "万达广场", address: "包河区", type: "购物", lng: 117.28, lat: 31.86, info: { photos: [{ url: "img/mall.png" }] } },
          { id: "n2", name: "银泰城", address: ["蜀山区"], type: "购物", lng: 117.26, lat: 31.84 }
        ]
      },
      pageNo: 0,
      pageSize: 20
    })
    await flushPromises()

    expect(wrapper.text()).toContain("万达广场")
    expect(wrapper.text()).toContain("银泰城")
    expect(wrapper.text()).toContain("暂无数据") // address 为数组时兜底展示
    expect(wrapper.text()).toContain("没有更多了") // 已拉全 → finished
    expect(wrapper.html()).toContain("img/mall.png")
    expect(wrapper.html()).toContain("noImage.gif") // 无图兜底
    wrapper.unmount()
  })

  it("输入关键字搜索：重置页码、按距离发起查询并用新结果替换旧列表", async () => {
    const wrapper = mountPage(NearbyResult)
    await flushPromises()

    // 预置一条旧数据（可能经自动加载或其他事件进入列表）
    nearbyResultMap.eventTarget.fire("nearby-result", {
      result: { count: 1, allcount: 1, list: [{ id: "n0", name: "老数据", address: "x", lng: 1, lat: 2 }] },
      pageNo: 0,
      pageSize: 20
    })
    await flushPromises()

    nearbyResultMap.queryNearby.mockClear()
    nearbyResultMap.pageNum.mockClear()
    await wrapper.find(".mars-search input").setValue("火锅")
    // action 槽内层 div 才绑定了 @click，点击外层容器不会触发
    await wrapper.find(".van-search__action div").trigger("click")
    await flushPromises()

    expect(nearbyResultMap.pageNum).toHaveBeenCalled()
    expect(nearbyResultMap.queryNearby).toHaveBeenCalledWith("050000", 2000, "117.2,31.8", "火锅")

    nearbyResultMap.eventTarget.fire("nearby-result", {
      result: { count: 1, allcount: 1, list: [{ id: "n9", name: "海底捞", address: "庐阳区", lng: 117.2, lat: 31.8 }] },
      pageNo: 0,
      pageSize: 20
    })
    await flushPromises()

    expect(wrapper.text()).toContain("海底捞")
    expect(wrapper.text()).not.toContain("老数据")
    wrapper.unmount()
  })

  it("查询失败分支：提示加载失败且 van-list 置为完结", async () => {
    const wrapper = mountPage(NearbyResult)
    await flushPromises()

    nearbyResultMap.eventTarget.fire("nearby-error")
    await flushPromises()

    expect(hasMessage("加载失败")).toBe(true)
    expect(wrapper.text()).toContain("没有更多了")
    wrapper.unmount()
  })

  it("无定位参数直入：展示空态引导返回搜索页且不发起查询（I027）", async () => {
    await Promise.all([import("@mars/views/search/search-home/index.vue")])
    await router.push({ name: "nearby-result", query: { title: "美食", code: "050000" } })
    await flushPromises()

    const wrapper = mountPage(NearbyResult)
    await flushPromises()

    // 空态展示，不渲染列表
    const empty = wrapper.find(".van-empty")
    expect(empty.exists()).toBe(true)
    expect(wrapper.text()).toContain("缺少定位参数")
    expect(wrapper.find(".van-list").exists()).toBe(false)

    // 空态下点搜索也不发起查询
    await wrapper.find(".van-search__action div").trigger("click")
    await flushPromises()
    expect(nearbyResultMap.queryNearby).not.toHaveBeenCalled()

    // 引导按钮返回搜索页（/search 重定向到搜索首页）
    await empty.find("button").trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("search-home")
    wrapper.unmount()
  })

  it("返回入口：左箭头返回上一页，右上图标回到搜索首页", async () => {
    await Promise.all([import("@mars/views/search/search-home/index.vue")])
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountPage(NearbyResult)
    await flushPromises()

    await wrapper.find(".van-nav-bar__left").trigger("click")
    expect(nearbyResultMap.pageNum).toHaveBeenCalled()
    expect(goSpy).toHaveBeenCalledWith(-1)
    goSpy.mockRestore()

    // 右上角图标自身绑定了 @click，需点击图标而非外层 right 容器
    await wrapper.find(".van-nav-bar__right .mars-icon").trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("search-home")
    wrapper.unmount()
  })
})
