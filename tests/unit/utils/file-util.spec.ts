import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest"
import { readJSON, uploadFilebyOSS } from "@mars/utils/file-util"

const { putSpy, ossCtorSpy } = vi.hoisted(() => ({
  putSpy: vi.fn(),
  ossCtorSpy: vi.fn()
}))

vi.mock("ali-oss", () => ({
  default: class {
    constructor(opts: any) {
      ossCtorSpy(opts)
    }

    put = putSpy
  }
}))

describe("file-util uploadFilebyOSS", () => {
  beforeAll(() => {
    vi.stubEnv("VITE_OSS_ACCESS_KEY_ID", "test-key")
    vi.stubEnv("VITE_OSS_ACCESS_KEY_SECRET", "test-secret")
    vi.stubEnv("VITE_OSS_REGION", "oss-cn-test")
    vi.stubEnv("VITE_OSS_BUCKET", "test-bucket")
  })

  beforeEach(() => {
    putSpy.mockReset()
    ossCtorSpy.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("密钥未配置时直接返回失败且不建 OSS 客户端", async () => {
    vi.stubEnv("VITE_OSS_ACCESS_KEY_ID", "")
    const file = new File(["x"], "a.png")
    const result = await uploadFilebyOSS(file as File)
    expect(result.success).toBe(false)
    expect((result as any).errMsg).toContain("未配置")
    expect(ossCtorSpy).not.toHaveBeenCalled()
    vi.stubEnv("VITE_OSS_ACCESS_KEY_ID", "test-key")
  })

  it("上传成功（status 200）返回 url 与 name，扩展名合法透传", async () => {
    putSpy.mockResolvedValue({ res: { status: 200 }, url: "https://oss/x.png", name: "x.png" })
    const file = new File(["data"], "photo.PNG")
    const result = await uploadFilebyOSS(file as File)
    expect(result.success).toBe(true)
    expect((result as any).url).toBe("https://oss/x.png")
    expect(ossCtorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ region: "oss-cn-test", bucket: "test-bucket" })
    )
    const key = putSpy.mock.calls[0][0] as string
    expect(key.startsWith("mars-app/")).toBe(true)
    expect(key.endsWith(".png")).toBe(true) // 大写扩展名转小写
  })

  it("非法/超长扩展名回退 bin", async () => {
    putSpy.mockResolvedValue({ res: { status: 200 }, url: "https://oss/x.bin", name: "x.bin" })
    const file = new File(["data"], "no-ext.averylongextension")
    await uploadFilebyOSS(file as File)
    const key = putSpy.mock.calls[0][0] as string
    expect(key.endsWith(".bin")).toBe(true)
  })

  it("上传响应非 200 返回失败", async () => {
    putSpy.mockResolvedValue({ res: { status: 500 }, url: "", name: "" })
    const file = new File(["data"], "a.png")
    const result = await uploadFilebyOSS(file as File)
    expect(result.success).toBe(false)
    expect((result as any).errMsg).toBe("文件上传失败")
  })

  it("上传抛错时异常上抛（由调用方兜底）", async () => {
    putSpy.mockRejectedValue(new Error("network down"))
    const file = new File(["data"], "a.png")
    await expect(uploadFilebyOSS(file as File)).rejects.toThrow("network down")
  })
})

describe("file-util readJSON", () => {
  beforeEach(() => {
    // happy-dom 未实现 alert，读JSON 失败路径会调用它
    vi.stubGlobal("alert", vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("合法 json 文件解析为对象", async () => {
    const file = new File([JSON.stringify({ a: 1, list: [1, 2] })], "marker.json")
    await expect(readJSON(file as any)).resolves.toEqual({ a: 1, list: [1, 2] })
  })

  it("非 json 后缀：alert 提示并 reject", async () => {
    const file = new File(["{}"], "marker.txt")
    await expect(readJSON(file as any)).rejects.toThrow("文件类型不合法")
    expect(vi.mocked(window.alert).mock.calls.length).toBe(1)
  })

  it("内容不是合法 JSON：reject 解析错误", async () => {
    const file = new File(["{broken"], "marker.json")
    await expect(readJSON(file as any)).rejects.toBeInstanceOf(Error)
  })

  it("无 name 的 Blob 按空名处理 → 类型不合法", async () => {
    const blob = new Blob(["{}"])
    await expect(readJSON(blob as any)).rejects.toThrow("文件类型不合法")
  })
})
