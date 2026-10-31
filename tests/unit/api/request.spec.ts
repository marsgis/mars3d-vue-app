import { describe, it, expect, vi, beforeEach } from "vitest"
import request, { REQUEST_ERROR_RESPONSE } from "@mars/common/api/api"
import { requestLocal } from "@mars/common/api/cache"

import { $showLoading, $hideLoading } from "@mars/components/mars-ui"

vi.mock("@mars/common/api/cache", () => ({
  requestLocal: vi.fn()
}))

vi.mock("@mars/components/mars-ui", () => ({
  $showLoading: vi.fn(),
  $hideLoading: vi.fn(),
  $message: vi.fn()
}))

const mockedRequestLocal = vi.mocked(requestLocal)

describe("api request 统一入口（LOCAL 本地模式）", () => {
  beforeEach(() => {
    mockedRequestLocal.mockReset()
    vi.mocked($showLoading).mockClear()
    vi.mocked($hideLoading).mockClear()
  })

  it("本地模式返回 requestLocal 结果", async () => {
    mockedRequestLocal.mockResolvedValue({ code: 200, message: "操作成功", data: { token: "t" } })
    const result = await request({ url: "user/login", method: "post", localParams: { type: "user" }, data: {} })
    expect(result).toEqual({ code: 200, message: "操作成功", data: { token: "t" } })
    expect(mockedRequestLocal).toHaveBeenCalledWith(
      expect.objectContaining({ url: "user/login", localParams: { type: "user" } })
    )
  })

  it("默认展示 loading，结束后隐藏", async () => {
    mockedRequestLocal.mockResolvedValue({ code: 200, message: "ok", data: null })
    await request({ url: "x", method: "get", localParams: { type: "get" } })
    expect($showLoading).toHaveBeenCalledWith("toast")
    expect($hideLoading).toHaveBeenCalledTimes(1)
  })

  it("noloading 时不展示/隐藏 loading", async () => {
    mockedRequestLocal.mockResolvedValue({ code: 200, message: "ok", data: null })
    await request({ url: "x", method: "get", localParams: { type: "get" }, noloading: true })
    expect($showLoading).not.toHaveBeenCalled()
    expect($hideLoading).not.toHaveBeenCalled()
  })

  it("requestLocal 抛错时返回统一兜底对象，不向外抛异常", async () => {
    mockedRequestLocal.mockRejectedValue(new Error("boom"))
    const result = await request({ url: "x", method: "get", localParams: { type: "get" } })
    expect(result).toEqual(REQUEST_ERROR_RESPONSE)
    expect(result.code).toBe(-1)
    expect($hideLoading).toHaveBeenCalledTimes(1) // 失败路径也要隐藏 loading
  })

  it("兜底对象结构稳定（调用方可安全解构）", () => {
    expect(REQUEST_ERROR_RESPONSE).toEqual({ code: -1, message: expect.any(String), data: null })
  })
})
