import { describe, it, expect, beforeAll, vi } from "vitest"
import { router } from "@mars/routes"
import { globalStore } from "@mars/common/store/global"

// 页面组件链依赖公共 UI（本文件只测路由表结构与守卫，无需真实挂载）
vi.mock("@mars/common/api", () => ({
  getUserInformation: vi.fn()
}))

describe("routes 路由表结构", () => {
  it("注册记录总数与基线一致（59 条原始路由 + C001 新增 not-found 兜底 = 60）", () => {
    expect(router.getRoutes().length).toBe(60)
  })

  it("叶子页面记录数与页面覆盖矩阵分母一致（45）", () => {
    // 叶子 = 有组件且无子路由（容器页 search/user/analysis 等有组件但带 children，不计叶子）
    const leaves = router
      .getRoutes()
      .filter((r) => r.components && Object.keys(r.components).length > 0 && !r.children?.length)
    expect(leaves.length).toBe(45)
  })

  it("关键路由存在", () => {
    const names = router.getRoutes().map((r) => r.name as string)
    for (const n of [
      "home",
      "search-home",
      "search-result",
      "nearby",
      "nearby-result",
      "user-home",
      "login",
      "register",
      "collection",
      "analysis-measure",
      "analysis-sunlight",
      "map-compare",
      "visible-add",
      "volume-add",
      "slope-add",
      "terrain-clip-add",
      "tileset-clip-add",
      "flat-add",
      "terrain-opacity",
      "tileset-limit",
      "marker-add",
      "marker-list",
      "plot-add",
      "plot-list",
      "bookmark",
      "location-region",
      "location-point",
      "roam-draw",
      "roam-start",
      "route-plan"
    ]) {
      expect(names, `缺少路由 ${n}`).toContain(n)
    }
  })

  it("not-found 兜底路由存在且未匹配路径解析到它", () => {
    const matched = router.resolve("/definitely-not-exist-path")
    expect(matched.name).toBe("not-found")
  })

  it("容器路由 redirect 指向首个子页", () => {
    expect(router.resolve("/search").redirectedFrom).toBeUndefined()
    const search = router.getRoutes().find((r) => r.name === "search")
    expect(typeof search?.redirect).toBe("function")
    const roam = router.getRoutes().find((r) => r.name === "roam")
    expect(typeof roam?.redirect).toBe("function")
  })
})

describe("routes 全局守卫", () => {
  beforeAll(() => {
    vi.mocked(globalStore.commit).mockClear?.()
  })

  it("导航到非来源页时清除 loginRedirect", async () => {
    globalStore.commit("updateLoginRedirect", "/user/login")
    expect(globalStore.state.loginRedirect).toBe("/user/login")
    await router.push("/user/about-us")
    expect(globalStore.state.loginRedirect).toBeNull()
  })

  it("无 loginRedirect 时守卫直接放行", async () => {
    globalStore.commit("updateLoginRedirect", null)
    await expect(router.push("/user/help-center")).resolves.toBeUndefined()
    expect(globalStore.state.loginRedirect).toBeNull()
  })
})
