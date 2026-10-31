import { test, expect } from "playwright/test"
import { trackPageErrors } from "./helpers"

// 关键链路：路由守卫与兜底重定向（未知路由不白屏，回首页）
test.describe("路由兜底", () => {
  test("未知路由重定向首页", async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await page.goto("/#/this-route-not-exist")
    await expect(page).toHaveURL(/#\/$/)
    await expect(page.locator(".home-search-bar")).toBeVisible()
    expect(pageErrors).toEqual([])
  })
})
