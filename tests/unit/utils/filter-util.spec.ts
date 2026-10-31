import { describe, it, expect } from "vitest"
import install from "@mars/utils/filter-util"

describe("filter-util 全局过滤器安装", () => {
  it("install 后 globalProperties.$filters.timeFilter 可用", () => {
    const globalProperties: any = {}
    const app: any = { config: { globalProperties } }
    install(app)
    expect(typeof globalProperties.$filters.timeFilter).toBe("function")
  })

  it("timeFilter 默认格式 YYYY-MM-DD HH:mm:ss", () => {
    const globalProperties: any = {}
    install({ config: { globalProperties } } as any)
    const date = new Date("2026-01-02T03:04:05")
    expect(globalProperties.$filters.timeFilter(date)).toBe("2026-01-02 03:04:05")
  })

  it("timeFilter 支持自定义格式", () => {
    const globalProperties: any = {}
    install({ config: { globalProperties } } as any)
    const date = new Date("2026-01-02T03:04:05")
    expect(globalProperties.$filters.timeFilter(date, "YYYY年MM月DD日")).toBe("2026年01月02日")
  })
})
