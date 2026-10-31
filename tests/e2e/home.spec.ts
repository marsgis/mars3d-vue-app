import { test, expect } from "playwright/test"
import { trackPageErrors } from "./helpers"

// 关键链路：场景打开（三维地球渲染）+ 首页要素 + 图层/工具面板操作
test.describe("首页 · 场景打开与图层操作", () => {
  test("打开首页渲染三维场景与首页要素", async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await page.goto("/#/")
    await expect(page).toHaveTitle("Mars3D三维地球APP")
    // Cesium 三维画布渲染
    await expect(page.locator("canvas").first()).toBeVisible()
    // 顶部搜索栏与快捷入口挂载
    await expect(page.locator(".home-search-bar")).toContainText("点击输入关键词")
    await expect(page.locator(".tools-shortcut .home-handle-item")).toBeVisible()
    await expect(page.locator(".layer-shortcut .home-handle-item")).toBeVisible()
    expect(pageErrors).toEqual([])
  })

  test("图层面板可打开并渲染底图切换", async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await page.goto("/#/")
    await expect(page.locator("canvas").first()).toBeVisible()
    await page.locator(".layer-shortcut .home-handle-item").click()
    await expect(page.locator(".layers-title").first()).toHaveText("底图切换")
    await expect(page.locator(".basemap-card").first()).toBeVisible()
    expect(pageErrors).toEqual([])
  })

  test("工具面板可打开并渲染工具入口", async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await page.goto("/#/")
    await expect(page.locator("canvas").first()).toBeVisible()
    await page.locator(".tools-shortcut .home-handle-item").click()
    await expect(page.locator(".tools-title")).toContainText("工具")
    expect(pageErrors).toEqual([])
  })
})
