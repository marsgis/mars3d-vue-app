import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import LocationRegion from "@mars/views/camera/location-region/index.vue"
import axios from "axios"
import * as mapWork from "@mars/views/camera/location-region/map"
import { mountPage } from "../../../helpers/page"

vi.mock("axios", () => {
  const get = vi.fn()
  // http.ts 模块加载时调用 axios.create 并注册拦截器，需一并模拟
  const create = vi.fn(() => ({
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    request: vi.fn(async () => ({ data: { code: 200, data: null } }))
  }))
  return { default: { get, create }, get, create }
})
vi.mock("@mars/views/camera/location-region/map", () => ({
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
  goHome: vi.fn(),
  centerAtRegion: vi.fn(),
  closeGeojsonLayerPopup: vi.fn()
}))

const provinceFeature = (name: string, adcode: number) => ({ properties: { name, adcode, level: "province" } })
const provinces = [provinceFeature("北京市", 110000), provinceFeature("上海市", 310000), provinceFeature("广东省", 440000)]
const cities = [provinceFeature("北京市", 110000), { properties: { name: "朝阳区", adcode: 110105, level: "district" } }]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(axios.get).mockImplementation(async (url: string) => {
    if (url.includes("100000_full")) { return { data: { features: provinces } } }
    if (url.includes("110000_full")) { return { data: { features: cities } } }
    return { data: { features: [] } }
  })
})

describe("location-region 地区导航", () => {
  it("渲染冒烟：加载省份数据并按地区分组展示", async () => {
    const wrapper = mountPage(LocationRegion)
    await flushPromises()
    expect(wrapper.text()).toContain("地区导航")
    expect(wrapper.text()).toContain("华 北")
    expect(wrapper.text()).toContain("北京市")
    expect(wrapper.text()).toContain("华 东")
    expect(wrapper.text()).toContain("上海市")
    expect(axios.get).toHaveBeenCalledWith("https://data.mars3d.cn/file/geojson/areas/100000_full.json")
    wrapper.unmount()
  })

  it("点击省份：定位省份并拉取下级城市列表", async () => {
    const wrapper = mountPage(LocationRegion)
    await flushPromises()
    await wrapper.findAll(".location-region-item").find((i) => i.text() === "北京市")!.trigger("click")
    await flushPromises()
    expect(mapWork.centerAtRegion).toHaveBeenCalledWith(provinces[0])
    expect(wrapper.find(".van-nav-bar__title").text()).toBe("北京市")
    // 城市页签出现下级列表
    expect(wrapper.text()).toContain("朝阳区")
    expect(axios.get).toHaveBeenCalledWith("https://data.mars3d.cn/file/geojson/areas/110000_full.json")
    wrapper.unmount()
  })

  it("点击区县：直接定位该区县", async () => {
    const wrapper = mountPage(LocationRegion)
    await flushPromises()
    await wrapper.findAll(".location-region-item").find((i) => i.text() === "北京市")!.trigger("click")
    await flushPromises()
    vi.mocked(mapWork.centerAtRegion).mockClear()
    await wrapper.findAll(".location-region-item").find((i) => i.text() === "朝阳区")!.trigger("click")
    await flushPromises()
    expect(mapWork.centerAtRegion).toHaveBeenCalledWith(cities[1])
    wrapper.unmount()
  })

  it("顶部导航返回重新打开选择面板；点「全国」页签复位并 goHome", async () => {
    const wrapper = mountPage(LocationRegion)
    await flushPromises()
    // 顶部 nav-bar 左箭头：goBackChoiceCity → 重新打开面板 + 关闭图层弹窗
    const navBars = wrapper.findAll(".van-nav-bar__left")
    await navBars[0].trigger("click")
    expect(mapWork.closeGeojsonLayerPopup).toHaveBeenCalledTimes(1)
    // 点击「全国」页签：复位状态并 goHome
    await wrapper.findAll(".van-tab").find((t) => t.text().includes("全国"))!.trigger("click")
    await flushPromises()
    expect(mapWork.goHome).toHaveBeenCalledTimes(1)
    expect(wrapper.find(".van-nav-bar__title").text()).toBe("地区导航")
    wrapper.unmount()
  })
})
