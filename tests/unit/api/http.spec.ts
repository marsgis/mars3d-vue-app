import { describe, it, expect, vi, beforeEach } from "vitest"

import { requestHttp } from "@mars/common/api/http"
import { $message } from "@mars/components/mars-ui"
import { router } from "@mars/routes"
import { globalStore } from "@mars/common/store/global"

const { instance } = vi.hoisted(() => ({
  instance: {
    request: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

vi.mock("axios", () => ({
  default: { create: vi.fn(() => instance) }
}))

vi.mock("@mars/components/mars-ui", () => ({
  $message: vi.fn()
}))

vi.mock("@mars/routes", () => ({
  router: {
    currentRoute: { value: { fullPath: "/current-page" } },
    replace: vi.fn()
  }
}))

// 拦截器在 http.ts 模块加载时已注册，import 完成后立即从 mock 调用参数中恢复处理函数
const [requestInterceptor] = instance.interceptors.request.use.mock.calls[0]
const [responseSuccess, responseError] = instance.interceptors.response.use.mock.calls[0]

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.removeItem("mars-user-token")
  globalStore.commit("updateLoginRedirect", null)
})

describe("http 请求拦截器", () => {
  it("localStorage 有 token 时注入 Authorization 头", () => {
    localStorage.setItem("mars-user-token", "tok-123")
    const config = { headers: {} as any }
    const result = requestInterceptor(config)
    expect(result.headers.Authorization).toBe("tok-123")
  })

  it("无 token 时不注入 Authorization 头", () => {
    const config = { headers: {} as any }
    const result = requestInterceptor(config)
    expect(result.headers.Authorization).toBeUndefined()
  })
})

describe("http 响应拦截器", () => {
  it("业务码 200 正常透传响应", () => {
    const response = { data: { code: 200, data: {} } }
    expect(responseSuccess(response)).toBe(response)
  })

  it("业务码 401：记录 loginRedirect、提示并跳转登录页", async () => {
    const response = { data: { code: 401 } }
    await expect(responseSuccess(response)).rejects.toThrow("未登录")
    expect(globalStore.state.loginRedirect).toBe("/current-page")
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect($message).toHaveBeenCalledWith("请登录后再试")
    expect(router.replace).toHaveBeenCalledWith({ name: "login" })
  })

  it("业务码 403 同样触发跳转登录", async () => {
    await expect(responseSuccess({ data: { code: 403 } })).rejects.toThrow("未登录")
    expect(router.replace).toHaveBeenCalledWith({ name: "login" })
  })

  it("HTTP 层错误：提示并继续 reject", async () => {
    const error = new Error("network")
    await expect(responseError(error)).rejects.toBe(error)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect($message).toHaveBeenCalledWith("请求出错,请稍后再试")
  })
})

describe("http requestHttp", () => {
  it("返回响应体 data", async () => {
    instance.request.mockResolvedValue({ data: { code: 200, data: { ok: 1 } } })
    const result = await requestHttp({ url: "/x", method: "get" } as any)
    expect(result).toEqual({ code: 200, data: { ok: 1 } })
  })

  it("透传请求配置给 axios 实例", async () => {
    instance.request.mockResolvedValue({ data: {} })
    const options = { url: "/y", method: "post", data: { a: 1 } }
    await requestHttp(options as any)
    expect(instance.request).toHaveBeenCalledWith(options)
  })
})
