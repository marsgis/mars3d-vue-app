import { test, expect } from "playwright/test"
import { trackPageErrors } from "./helpers"

// 关键链路：用户域（登录/注册/个人中心）。
// 口径（D001）：本机无后端，真实登录提交与鉴权链路不适用；覆盖页面渲染与纯客户端交互。
test.describe("用户域 · 登录与个人中心", () => {
  test("登录页渲染账号密码表单", async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await page.goto("/#/user/login")
    await expect(page.getByText("账号密码登录")).toBeVisible()
    await expect(page.getByPlaceholder("请输入邮箱或手机号")).toBeVisible()
    await expect(page.getByPlaceholder("请输入密码")).toBeVisible()
    await expect(page.locator(".common-button")).toHaveText("登录")
    expect(pageErrors).toEqual([])
  })

  test("登录方式可切换为验证码登录（客户端交互）", async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await page.goto("/#/user/login")
    await page.getByText("验证码登录", { exact: true }).click()
    await expect(page.getByPlaceholder("请输入手机号")).toBeVisible()
    await expect(page.getByPlaceholder("四位数验证码")).toBeVisible()
    expect(pageErrors).toEqual([])
  })

  test("注册页未登录可打开", async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await page.goto("/#/user/register")
    await expect(page.getByPlaceholder("请输入手机号")).toBeVisible()
    await expect(page.getByPlaceholder("请输入至少六位数字并包含字母")).toBeVisible()
    expect(pageErrors).toEqual([])
  })

  test("个人中心渲染用户信息与功能菜单（本地演示默认登录态）", async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await page.goto("/#/user/user-home")
    await expect(page.locator(".user-head-box")).toBeVisible()
    // LOCAL=true 时 cache.ts User.getUser 固定返回演示用户 mars3d，页面恒为已登录分支
    await expect(page.getByText("mars3d")).toBeVisible()
    await expect(page.getByText("帮助中心")).toBeVisible()
    await expect(page.getByText("退出登录")).toBeVisible()
    expect(pageErrors).toEqual([])
  })
})
