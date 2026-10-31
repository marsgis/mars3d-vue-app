import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import localforage from "localforage"
import { getLocalJSON } from "@mars/utils/storage-util"

describe("storage-util getLocalJSON", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(async () => {
    vi.restoreAllMocks()
    await localforage.clear()
  })

  it("key 不存在返回默认值", async () => {
    await expect(getLocalJSON("k-none", { a: 1 })).resolves.toEqual({ a: 1 })
  })

  it("合法 JSON 返回解析结果", async () => {
    await localforage.setItem("k-ok", JSON.stringify({ sort: "time", asc: true }))
    await expect(getLocalJSON("k-ok", null)).resolves.toEqual({ sort: "time", asc: true })
  })

  it("存储值为 null 字符串时回退默认值", async () => {
    await localforage.setItem("k-null", "null")
    await expect(getLocalJSON("k-null", "fallback")).resolves.toBe("fallback")
  })

  it("JSON 损坏时 console.error 并回退默认值，不抛异常", async () => {
    await localforage.setItem("k-bad", "{broken")
    await expect(getLocalJSON("k-bad", [1, 2])).resolves.toEqual([1, 2])
    expect(console.error).toHaveBeenCalledTimes(1)
    expect((console.error as any).mock.calls[0][0]).toContain("k-bad")
  })
})
