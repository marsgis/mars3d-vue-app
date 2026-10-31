import { test, expect } from "playwright/test"
import { trackPageErrors } from "./helpers"

// 关键链路：绘制/编辑（图上标绘）、空间分析（图上量算）、保存重载查看（我的标记列表）。
// 绘制落笔依赖真实地图拾取，自动化以面板/弹窗/列表渲染与客户端交互为支持范围。
test.describe("工具页 · 绘制、量算与记录列表", () => {
  test("图上标绘页渲染工具面板", async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await page.goto("/#/plot/add")
    await expect(page.getByText("图上标绘").first()).toBeVisible()
    await expect(page.locator("canvas").first()).toBeVisible()
    // 标绘面板常驻；编辑态面板（删除/属性）v-show 隐藏但同在 DOM，取第一个
    await expect(page.locator(".tools-right-btns").first()).toBeVisible()
    expect(pageErrors).toEqual([])
  })

  test("标绘帮助弹窗可打开", async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await page.goto("/#/plot/add")
    await expect(page.locator(".tools-right-btns").first()).toBeVisible()
    await page.getByText("帮助", { exact: true }).click()
    await expect(page.getByText("图上标绘操作说明")).toBeVisible()
    expect(pageErrors).toEqual([])
  })

  test("图上量算页渲染工具面板", async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await page.goto("/#/analysis/measure")
    await expect(page.getByText("图上量算").first()).toBeVisible()
    await expect(page.locator(".tools-right-btns")).toBeVisible()
    expect(pageErrors).toEqual([])
  })

  test("我的标记列表页渲染筛选栏（本地存储读取链路）", async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await page.goto("/#/marker/list")
    await expect(page.getByText("我的标记").first()).toBeVisible()
    // 筛选/排序下拉渲染（列表数据来自 IndexedDB，空库亦需正常渲染骨架）
    await expect(page.locator(".mars-dropdown-menu").first()).toBeVisible()
    expect(pageErrors).toEqual([])
  })
})
