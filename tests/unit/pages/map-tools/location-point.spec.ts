import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import LocationPoint from "@mars/views/camera/location-point/index.vue"
import * as mapWork from "@mars/views/camera/location-point/map"
import { $message } from "@mars/components/mars-ui"
import { mountPage } from "../../../helpers/page"
import { fire } from "./helpers"

// 原生 alert 已替换为项目统一的 $message toast（I026/I030），mock 保留组件能力
vi.mock("@mars/components/mars-ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mars/components/mars-ui")>()
  return {
    ...actual,
    $message: vi.fn()
  }
})

vi.mock("@mars/views/camera/location-point/map", () => {
  const eventTarget = { on: vi.fn(), off: vi.fn(), fire: vi.fn() }
  return {
    eventTarget,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    getMapCenterPositions: vi.fn(() => ({ jd: 116.397428, wd: 39.90923, gd: 50 })),
    marsUtilFormtNum: vi.fn((v: number, num: number) => Number(v).toFixed(num)),
    marsPointTrans: vi.fn((v: number) => ({ degree: Math.floor(v), minute: 30, second: 0 })),
    marsProj4Trans: vi.fn((pos: any) => pos),
    marsDms2degree: vi.fn((d: number, m: number, s: number) => Number(d) + Number(m) / 60 + Number(s) / 3600),
    bindMourseClick: vi.fn(),
    updateMarker: vi.fn()
  }
})

const fireEvt = (event: string, payload?: any) => fire(mapWork as any, event, payload)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(mapWork.getMapCenterPositions).mockReturnValue({ jd: 116.397428, wd: 39.90923, gd: 50 } as any)
})

const inputByPlaceholder = (wrapper: any, placeholder: string) => wrapper.findAll("input").find((i: any) => i.attributes("placeholder") === placeholder)!

describe("location-point 坐标定位", () => {
  it("渲染冒烟：标题、三种坐标页签、拾取/定位按钮、初始经纬度", async () => {
    const wrapper = mountPage(LocationPoint)
    // van-tabs 标题/面板在子组件挂载注册后的重渲染中才出现，需 flush
    await flushPromises()
    expect(wrapper.text()).toContain("坐标定位")
    expect(wrapper.text()).toContain("十进制")
    expect(wrapper.text()).toContain("度分秒")
    expect(wrapper.text()).toContain("平面坐标")
    expect(wrapper.text()).toContain("图上拾取")
    expect(inputByPlaceholder(wrapper, "请输入经度").element.value).toBe("116.397428")
    expect(inputByPlaceholder(wrapper, "请输入纬度").element.value).toBe("39.909230")
    wrapper.unmount()
  })

  it("坐标定位校验分流：空值/越界提示，合法值才 updateMarker", async () => {
    const wrapper = mountPage(LocationPoint)
    await flushPromises()
    const lng = inputByPlaceholder(wrapper, "请输入经度")
    const lat = inputByPlaceholder(wrapper, "请输入纬度")
    const alt = inputByPlaceholder(wrapper, "请输入高程")
    const submitBtn = wrapper.findAll("button").find((b) => b.text().includes("坐标定位"))!
    // 空值
    await lng.setValue("")
    await lat.setValue("")
    await alt.setValue("")
    await submitBtn.trigger("click")
    // alert 已替换为 $message toast
    expect(vi.mocked($message)).toHaveBeenLastCalledWith("坐标不能为空")
    // 经度越界
    await lng.setValue("200")
    await lat.setValue("40")
    await alt.setValue("50")
    await submitBtn.trigger("click")
    expect(vi.mocked($message)).toHaveBeenLastCalledWith("请输入有效的经度值！")
    // 纬度越界
    await lng.setValue("116")
    await lat.setValue("95")
    await submitBtn.trigger("click")
    expect(vi.mocked($message)).toHaveBeenLastCalledWith("请输入有效的纬度值！")
    // 合法值（blur 更新内部经纬度）
    await lng.setValue("116.5")
    await lng.trigger("blur")
    await lat.setValue("40.2")
    await lat.trigger("blur")
    await submitBtn.trigger("click")
    expect(mapWork.updateMarker).toHaveBeenCalledWith(true, 116.5, 40.2, 50)
    wrapper.unmount()
  })

  it("度分秒页签非法输入提交被拦截：缺项提示且不调用 updateMarker（I026）", async () => {
    const wrapper = mountPage(LocationPoint)
    await flushPromises()
    // 切到「度分秒」页签
    const dmsTab = wrapper.findAll(".van-tab").find((t) => t.text() === "度分秒")!
    await dmsTab.trigger("click")
    await flushPromises()
    // 页签切换后度分秒面板回填初始值，清空经度度字段模拟缺项
    const dmsInputs = wrapper.findAll("input").filter((i: any) => i.attributes("placeholder") === "请输入")
    expect(dmsInputs.length).toBeGreaterThanOrEqual(6)
    await dmsInputs[0].setValue("")
    const submitBtn = wrapper.findAll("button").find((b) => b.text().includes("坐标定位"))!
    await submitBtn.trigger("click")
    expect(vi.mocked($message)).toHaveBeenLastCalledWith("请输入完整的度分秒坐标")
    expect(mapWork.updateMarker).not.toHaveBeenCalledWith(true, expect.anything(), expect.anything(), expect.anything())
    wrapper.unmount()
  })

  it("clickMap 事件：回填十进制面板并落定位标记（不居中）", async () => {
    const wrapper = mountPage(LocationPoint)
    await flushPromises()
    fireEvt("clickMap", { point: { lng: 100.5, lat: 20.3, alt: 8 } })
    await flushPromises()
    expect(inputByPlaceholder(wrapper, "请输入经度").element.value).toBe("100.500000")
    expect(mapWork.updateMarker).toHaveBeenCalledWith(false, 100.5, 20.3, 8)
    wrapper.unmount()
  })

  it("点击「图上拾取」进入图上取点模式", async () => {
    const wrapper = mountPage(LocationPoint)
    await wrapper.findAll("button").find((b) => b.text().includes("图上拾取"))!.trigger("click")
    expect(mapWork.bindMourseClick).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
