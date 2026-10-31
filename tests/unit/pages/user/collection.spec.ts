import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { flushPromises } from "@vue/test-utils"

import Collection from "@mars/views/user/collection/index.vue"
import { getCollectionList, deleteCollectionById } from "@mars/common/api"
import { $dialog } from "@mars/components/mars-ui"
import { router } from "@mars/routes"
import { mountPage } from "../../../helpers/page"

vi.mock("@mars/common/api", () => ({
  login: vi.fn(),
  getCode: vi.fn(),
  loginWithCode: vi.fn(),
  getUserInformation: vi.fn(),
  updateUserInformation: vi.fn(),
  checkLogin: vi.fn(),
  loginOut: vi.fn(),
  register: vi.fn(),
  resetPassword: vi.fn(),
  destroyAccount: vi.fn(),
  addCollection: vi.fn(),
  getCollectionList: vi.fn(),
  getCollectionById: vi.fn(),
  deleteCollectionById: vi.fn(),
  isCollection: vi.fn()
}))

// 仅替换 $dialog 为受控 mock（确认分支可控），其余导出（组件、$message）保持真实实现
vi.mock("@mars/components/mars-ui", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, $dialog: vi.fn() }
})

const mockedGetList = vi.mocked(getCollectionList)
const mockedDelete = vi.mocked(deleteCollectionById)
const mockedDialog = vi.mocked($dialog)

const POINT = { type: "mars_point", id: "p1", info: JSON.stringify({ name: "点A", address: "地址A" }) }

beforeEach(() => {
  mockedGetList.mockReset()
  mockedDelete.mockReset()
  mockedDialog.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("collection 收藏列表", () => {
  it("空列表渲染：标题、收藏点/收藏路线 tab 与空状态", async () => {
    mockedGetList.mockResolvedValue({ code: 200, data: [] } as any)
    const wrapper = mountPage(Collection)
    await flushPromises()
    expect(wrapper.text()).toContain("我的收藏")
    expect(wrapper.text()).toContain("收藏点")
    expect(wrapper.text()).toContain("收藏路线")
    expect(wrapper.find(".van-empty").exists()).toBe(true)
    wrapper.unmount()
  })

  it("收藏点列表：渲染名称与地址", async () => {
    mockedGetList.mockResolvedValue({ code: 200, data: [POINT] } as any)
    const wrapper = mountPage(Collection)
    await flushPromises()
    expect(wrapper.text()).toContain("点A")
    expect(wrapper.text()).toContain("地址A")
    wrapper.unmount()
  })

  it("单条 info 解析失败时跳过该条，不影响其余收藏展示", async () => {
    mockedGetList.mockResolvedValue({
      code: 200,
      data: [{ type: "mars_point", id: "p0", info: "{bad-json" }, { type: "mars_point", id: "p2", info: JSON.stringify({ name: "点B", address: "" }) }]
    } as any)
    const wrapper = mountPage(Collection)
    await flushPromises()
    expect(wrapper.text()).toContain("点B")
    expect(wrapper.findAll(".van-swipe-cell")).toHaveLength(1)
    wrapper.unmount()
  })

  it("点击删除：确认对话框后调用 deleteCollectionById 并重新拉取列表", async () => {
    // 修改说明：删除增加二次确认，用例补 $dialog 确认步骤
    mockedDialog.mockResolvedValue("confirm" as any)
    mockedGetList.mockResolvedValue({ code: 200, data: [POINT] } as any)
    mockedDelete.mockResolvedValue({ code: 200, message: "ok" } as any)
    const wrapper = mountPage(Collection)
    await flushPromises()
    const delBtn = wrapper.findAll("button").find((b) => b.text().includes("删除"))!
    await delBtn.trigger("click")
    await flushPromises()
    expect(mockedDialog).toHaveBeenCalledWith(expect.objectContaining({ title: "提示", message: "确定删除该记录吗？" }))
    expect(mockedDelete).toHaveBeenCalledWith("p1")
    expect(mockedGetList).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it("点击删除：取消对话框不调用删除接口", async () => {
    mockedDialog.mockRejectedValue("cancel" as any)
    mockedGetList.mockResolvedValue({ code: 200, data: [POINT] } as any)
    const wrapper = mountPage(Collection)
    await flushPromises()
    const delBtn = wrapper.findAll("button").find((b) => b.text().includes("删除"))!
    await delBtn.trigger("click")
    await flushPromises()
    expect(mockedDelete).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("删除失败（code != 200）：确认后提示错误且不刷新列表", async () => {
    mockedDialog.mockResolvedValue("confirm" as any)
    mockedGetList.mockResolvedValue({ code: 200, data: [POINT] } as any)
    mockedDelete.mockResolvedValue({ code: 500, message: "err" } as any)
    const wrapper = mountPage(Collection)
    await flushPromises()
    const delBtn = wrapper.findAll("button").find((b) => b.text().includes("删除"))!
    await delBtn.trigger("click")
    await flushPromises()
    expect(mockedGetList).toHaveBeenCalledTimes(1)
    expect(document.body.textContent).toContain("删除失败请重试")
    wrapper.unmount()
  })

  it("收藏路线缺 line 字段时兜底展示「-」，不崩溃", async () => {
    // 修改说明：getLineName 增加缺失/异常数据防护
    mockedGetList.mockResolvedValue({
      code: 200,
      data: [{ type: "mars_line", id: "l1", info: JSON.stringify({ routeType: "driving" }) }]
    } as any)
    const wrapper = mountPage(Collection)
    await flushPromises()
    await wrapper.findAll(".van-tab")[1].trigger("click")
    await flushPromises()
    expect(wrapper.find(".van-swipe-cell").exists()).toBe(true)
    expect(wrapper.text()).toContain("-")
    wrapper.unmount()
  })

  it("收藏点 tab 下点击右上角新增，跳转 search-home", async () => {
    mockedGetList.mockResolvedValue({ code: 200, data: [] } as any)
    const pushSpy = vi.spyOn(router, "push").mockImplementation((() => Promise.resolve(undefined)) as any)
    const wrapper = mountPage(Collection)
    await flushPromises()
    await wrapper.find(".van-nav-bar__right .mars-icon").trigger("click")
    expect(pushSpy).toHaveBeenCalledWith({ name: "search-home" })
    wrapper.unmount()
  })
})
