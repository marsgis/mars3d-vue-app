import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import MarkerAdd from "@mars/views/draw/marker/add/index.vue"
import { router } from "@mars/routes"
import { mountPage } from "../../../helpers/page"
import { addMarkerPointHistory } from "@mars/common/api"

// 页面 map.ts 为项目内文件，vi.mock 可靠拦截；eventTarget 用真实监听器注册表以便模拟图层事件
const mapWorkMock = vi.hoisted(() => {
  const listeners: Record<string, ((data?: any) => void)[]> = {}
  const fire = (evt: string, data?: any) => (listeners[evt] || []).forEach((cb) => cb(data))
  return {
    eventTarget: {
      on: vi.fn((evt: string, cb: (data?: any) => void) => {
        ;(listeners[evt] = listeners[evt] || []).push(cb)
      }),
      off: vi.fn(),
      fire
    },
    fire,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    endDraw: vi.fn(),
    clearDraw: vi.fn(),
    clearMarkerGraphic: vi.fn(),
    onClickMarkerAdd: vi.fn(),
    transformToArray: vi.fn(),
    getGraphicStyle: vi.fn(),
    endSurePointAttr: vi.fn(),
    onChangeGraphicStyle: vi.fn(),
    flyToMarkerPoint: vi.fn()
  }
})
vi.mock("@mars/views/draw/marker/add/map", () => mapWorkMock)

// setup 顶层会请求样式 json，mock 掉避免真实网络请求；ali-oss 导入重且单测不会真正上传，一并 mock
vi.mock("axios", () => ({ default: { get: vi.fn().mockResolvedValue({ data: {} }) } }))
vi.mock("@mars/utils/file-util", () => ({ uploadFilebyOSS: vi.fn() }))

vi.mock("@mars/common/api", () => ({
  addMarkerPointHistory: vi.fn(),
  updateMarkerPointHistory: vi.fn(),
  getMarkerPointHistoryList: vi.fn(),
  getMarkerPointHistoryById: vi.fn(),
  deleteMarkerPointHistoryById: vi.fn(),
  addHistoricalRecords: vi.fn(),
  updateHistoryRecords: vi.fn(),
  getHistoricalRecordsList: vi.fn(),
  getHistoricalRecordsById: vi.fn(),
  deleteHistoricalRecordsById: vi.fn()
}))

const mockedAdd = vi.mocked(addMarkerPointHistory)

beforeEach(() => {
  vi.clearAllMocks()
})

/** 打开「点」绘制完成后的属性表单：选点绘制 -> 模拟图层 drawCreated 事件 */
async function openMarkerForm() {
  mapWorkMock.onClickMarkerAdd.mockResolvedValue({ id: "g1", positionShow: [116.39, 39.9, 10] })
  const wrapper = mountPage(MarkerAdd)
  const dotItem = wrapper.findAll(".home-handle-item").find((el) => el.text().includes("点"))!
  await dotItem.trigger("click")
  await flushPromises()
  mapWorkMock.fire("drawCreated", { graphicId: "g1", graphicType: "billboard" })
  await flushPromises()
  return wrapper
}

describe("marker-add 我的标记新增", () => {
  it("渲染冒烟：导航标题、点/线/面/列表四个入口与提示按钮", () => {
    const wrapper = mountPage(MarkerAdd)
    expect(wrapper.text()).toContain("我的标记")
    expect(wrapper.findAll(".home-handle-item").length).toBeGreaterThanOrEqual(4)
    expect(wrapper.text()).toContain("点")
    expect(wrapper.text()).toContain("线")
    expect(wrapper.text()).toContain("面")
    expect(wrapper.text()).toContain("列表")
    expect(wrapper.text()).toContain("提示")
    wrapper.unmount()
  })

  it("点击「列表」进入 marker-list 路由", async () => {
    // 目标为嵌套路由子页：导航会懒加载父壳 + 子页，动态 import 属宏任务，flushPromises 覆盖不到，需一并预加载
    await import("@mars/views/draw/marker/index.vue")
    await import("@mars/views/draw/marker/list/index.vue")
    const wrapper = mountPage(MarkerAdd)
    const listItem = wrapper.findAll(".home-handle-item").find((el) => el.text().includes("列表"))!
    await listItem.trigger("click")
    await flushPromises()
    // 防御性等待导航落定（懒加载/初始导航可能引入宏任务）
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe("marker-list"), { timeout: 5000 })
    wrapper.unmount()
  })

  it("点击「点」开始绘制：调用 onClickMarkerAdd，drawCreated 后编辑面板与属性表单出现", async () => {
    const wrapper = await openMarkerForm()
    expect(mapWorkMock.onClickMarkerAdd).toHaveBeenCalledWith("billboard")
    // 编辑面板（删除/属性）所在 pannel 由 v-show 控制显示
    const attrItem = wrapper.findAll(".home-handle-item").find((el) => el.text().includes("属性"))!
    const panel = (attrItem.element as HTMLElement).closest(".pannel-box") as HTMLElement
    expect(panel.style.display).not.toBe("none")
    // 绘制完成后未填写名称，自动打开属性表单
    const nameInput = wrapper.findAll("input").find((i) => i.attributes("placeholder") === "点击输入标记的名称")
    expect(nameInput).toBeTruthy()
    wrapper.unmount()
  })

  it("表单提交成功：调用新增接口（含位置与图片字段）并提示保存成功", async () => {
    mockedAdd.mockResolvedValue({ code: 200, data: { id: "mk-1" } } as any)
    const wrapper = await openMarkerForm()
    const nameInput = wrapper.findAll("input").find((i) => i.attributes("placeholder") === "点击输入标记的名称")!
    await nameInput.setValue("测试标记")
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mapWorkMock.endSurePointAttr).toHaveBeenCalled()
    expect(mockedAdd).toHaveBeenCalledTimes(1)
    const payload = mockedAdd.mock.calls[0][0] as any
    expect(payload.name).toBe("测试标记")
    expect(payload.type).toBe("billboard")
    expect(payload.point).toBe(JSON.stringify([116.39, 39.9, 10]))
    expect(payload.images).toBe("[]")
    expect(payload.fileimages).toBeUndefined()
    expect(document.body.textContent).toContain("保存成功")
    wrapper.unmount()
  })

  it("表单提交失败（code!=200）提示保存失败，请重试", async () => {
    mockedAdd.mockResolvedValue({ code: 500 } as any)
    const wrapper = await openMarkerForm()
    const nameInput = wrapper.findAll("input").find((i) => i.attributes("placeholder") === "点击输入标记的名称")!
    await nameInput.setValue("测试标记")
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(document.body.textContent).toContain("保存失败，请重试")
    wrapper.unmount()
  })
})
