import { describe, it, expect, beforeEach, vi } from "vitest"
import { globalStore, key, type GlobalState, type Point } from "@mars/common/store/global"

import { getUserInformation } from "@mars/common/api"

vi.mock("@mars/common/api", () => ({
  getUserInformation: vi.fn()
}))

const initialState: GlobalState = {
  locate: { name: "我的位置", positions: [117.204844, 31.856972] },
  userToken: "",
  userInformation: null,
  loginRedirect: null,
  userPhone: null
}

describe("store global mutations", () => {
  beforeEach(() => {
    globalStore.replaceState(JSON.parse(JSON.stringify(initialState)))
  })

  it("初始状态符合契约", () => {
    expect(globalStore.state.locate.name).toBe("我的位置")
    expect(globalStore.state.userToken).toBe("")
    expect(globalStore.state.userInformation).toBeNull()
    expect(globalStore.state.loginRedirect).toBeNull()
    expect(globalStore.state.userPhone).toBeNull()
  })

  it("updateLocate 更新当前位置", () => {
    const point: Point = { name: "合肥", positions: [117.2, 31.8], address: "某地" }
    globalStore.commit("updateLocate", point)
    expect(globalStore.state.locate).toEqual(point)
  })

  it("updateUserToken 更新 token", () => {
    globalStore.commit("updateUserToken", "tok-1")
    expect(globalStore.state.userToken).toBe("tok-1")
  })

  it("updateUserInformation 更新用户信息", () => {
    const info = { avatar: "", email: "a@b.cn", id: "1", phone: "13812345678", user_name: "u1" }
    globalStore.commit("updateUserInformation", info)
    expect(globalStore.state.userInformation).toEqual(info)
  })

  it("updateLoginRedirect / updateLoginPhone", () => {
    globalStore.commit("updateLoginRedirect", "/user/login")
    expect(globalStore.state.loginRedirect).toBe("/user/login")
    globalStore.commit("updateLoginPhone", "13812345678")
    expect(globalStore.state.userPhone).toBe("13812345678")
  })
})

describe("store global actions", () => {
  beforeEach(() => {
    globalStore.replaceState(JSON.parse(JSON.stringify(initialState)))
    vi.mocked(getUserInformation).mockReset()
  })

  it("getUserInfo：code 200 时提交 updateUserInformation", async () => {
    const info = { id: "1", user_name: "u1" }
    vi.mocked(getUserInformation).mockResolvedValue({ code: 200, data: info } as any)
    await globalStore.dispatch("getUserInfo")
    expect(globalStore.state.userInformation).toEqual(info)
  })

  it("getUserInfo：非 200 不更新用户信息", async () => {
    vi.mocked(getUserInformation).mockResolvedValue({ code: 500, data: null } as any)
    await globalStore.dispatch("getUserInfo")
    expect(globalStore.state.userInformation).toBeNull()
  })
})

describe("store global 导出契约", () => {
  it("key 为 Symbol 注入键，useGlobalStore 返回 store", () => {
    expect(typeof key).toBe("symbol")
    expect(globalStore).toBeTruthy()
    expect(typeof globalStore.commit).toBe("function")
  })
})
