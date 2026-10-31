import { describe, it, expect, vi, beforeEach } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import Bookmark from "@mars/views/camera/bookmark/index.vue"
import * as api from "@mars/common/api"
import * as mapWork from "@mars/views/camera/bookmark/map"
import { mountToolPage } from "./helpers"

vi.mock("@mars/common/api", () => ({
  getHistoricalRecordsList: vi.fn(),
  getHistoricalRecordsById: vi.fn(),
  addHistoricalRecords: vi.fn(),
  updateHistoryRecords: vi.fn(),
  deleteHistoricalRecordsById: vi.fn()
}))
vi.mock("@mars/views/camera/bookmark/map", () => ({
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
  getPosition: vi.fn(),
  flytoView: vi.fn()
}))

const now = Date.now()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(mapWork.getPosition).mockReturnValue([100, 20, 5])
  vi.mocked(api.addHistoricalRecords).mockResolvedValue({ code: 200, data: { id: "n1" } } as any)
  vi.mocked(api.deleteHistoricalRecordsById).mockResolvedValue({ code: 200 } as any)
})

function mountWith(listData: any[]) {
  vi.mocked(api.getHistoricalRecordsList).mockResolvedValue({
    code: 200,
    data: listData
  } as any)
  return mountToolPage(Bookmark)
}

// content.position 真实结构为 map.getCameraView() 的相机视角对象（页面定位校验按 lng/lat 判定）
const validView = { lng: 116, lat: 39, alt: 0, heading: 0, pitch: -90, roll: 0 }

describe("bookmark 视角书签", () => {
  it("渲染冒烟：标题、书签列表项、添加按钮", async () => {
    const wrapper = mountWith([
      { id: "b1", title: "视角书签记录1", update_time: now, content: JSON.stringify({ name: "家", position: validView }) }
    ])
    await flushPromises()
    expect(wrapper.text()).toContain("视角书签")
    expect(wrapper.text()).toContain("家")
    expect(wrapper.text()).toContain("添加")
    // 列表项经 $filters.timeFilter 渲染时间标签
    expect(wrapper.find(".van-cell__label").text()).not.toBe("")
    wrapper.unmount()
  })

  it("点击列表项：flytoView 定位并返回上一页", async () => {
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountWith([
      { id: "b1", title: "视角书签记录1", update_time: now, content: JSON.stringify({ name: "家", position: validView }) }
    ])
    await flushPromises()
    await wrapper.find(".van-swipe-cell .van-cell").trigger("click")
    expect(mapWork.flytoView).toHaveBeenCalledWith(validView)
    expect(goSpy).toHaveBeenCalledWith(-1)
    goSpy.mockRestore()
    wrapper.unmount()
  })

  it("坏数据书签：content 解析失败或缺 position 字段时提示收藏数据异常，不定位不返回（I026）", async () => {
    const goSpy = vi.spyOn(router, "go").mockImplementation(() => {})
    const wrapper = mountWith([
      { id: "b1", title: "坏数据1", update_time: now, content: "{bad-json" }, // JSON 解析失败
      { id: "b2", title: "坏数据2", update_time: now, content: JSON.stringify({ name: "无位置" }) } // 缺 position 字段
    ])
    await flushPromises()
    const cells = wrapper.findAll(".van-swipe-cell .van-cell")
    expect(cells.length).toBe(2)
    // 解析失败的项：页面预解析兜底为 null，点击不崩溃并提示
    await cells[0].trigger("click")
    expect(mapWork.flytoView).not.toHaveBeenCalled()
    expect(goSpy).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain("收藏数据异常")
    // 缺 position 字段的项：同样拦截
    await cells[1].trigger("click")
    expect(mapWork.flytoView).not.toHaveBeenCalled()
    expect(goSpy).not.toHaveBeenCalled()
    goSpy.mockRestore()
    wrapper.unmount()
  })

  it("点击「删除」：调用删除接口并刷新列表", async () => {
    const wrapper = mountWith([
      { id: "b1", title: "视角书签记录1", update_time: now, content: JSON.stringify({ name: "家", position: [116, 39, 0] }) }
    ])
    await flushPromises()
    vi.mocked(api.getHistoricalRecordsList).mockClear()
    await wrapper.findAll(".van-swipe-cell__right button")[0].trigger("click")
    await flushPromises()
    expect(api.deleteHistoricalRecordsById).toHaveBeenCalledWith("b1")
    expect(api.getHistoricalRecordsList).toHaveBeenCalledTimes(1) // 删除后刷新
    wrapper.unmount()
  })

  it("添加书签：名称为空提示；重新打开后输入合法名称落库并刷新", async () => {
    const wrapper = mountWith([])
    await flushPromises()
    const addBtn = () => wrapper.findAll("button").find((b) => b.text().includes("添加"))!
    // 空名称分支（确认后弹窗关闭）
    await addBtn().trigger("click")
    const dialog = wrapper.find(".van-dialog")
    expect(dialog.text()).toContain("添加视角书签")
    await dialog.find(".van-dialog__confirm").trigger("click")
    await flushPromises()
    expect(document.body.querySelector(".mars-message")).toBeTruthy()
    expect(api.addHistoricalRecords).not.toHaveBeenCalled()
    // 合法名称分支：重新打开弹窗再输入
    await addBtn().trigger("click")
    const dialog2 = wrapper.find(".van-dialog")
    await dialog2.find("input").setValue("办公室")
    await dialog2.find(".van-dialog__confirm").trigger("click")
    await flushPromises()
    expect(api.addHistoricalRecords).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(api.addHistoricalRecords).mock.calls[0][0] as any
    expect(payload.type).toBe("bookmark")
    expect(payload.name).toBe("办公室")
    const content = JSON.parse(payload.content)
    expect(content.name).toBe("办公室")
    expect(content.position).toEqual([100, 20, 5])
    expect(api.getHistoricalRecordsList).toHaveBeenCalled() // 添加成功后刷新
    wrapper.unmount()
  })

  it("重名书签：提示「命名重复请重试」，不落库", async () => {
    const wrapper = mountWith([
      { id: "b1", title: "视角书签记录1", update_time: now, content: JSON.stringify({ name: "家", position: [116, 39, 0] }) }
    ])
    await flushPromises()
    await wrapper.findAll("button").find((b) => b.text().includes("添加"))!.trigger("click")
    const dialog = wrapper.find(".van-dialog")
    await dialog.find("input").setValue("家")
    await dialog.find(".van-dialog__confirm").trigger("click")
    await flushPromises()
    expect(document.body.textContent).toContain("命名重复请重试")
    expect(api.addHistoricalRecords).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
