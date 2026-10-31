import path from "path"
import { defineConfig } from "playwright/test"

// E2E 专用浏览器缓存目录：与依赖安装策略一致，Chromium 统一放在 AI 工作区 .cache 下，
// 避免写到用户主目录（沙箱环境无权限时安装失败）。已显式设置时尊重外部值。
process.env.PLAYWRIGHT_BROWSERS_PATH ||= "E:\\IT工作\\mars3d平台\\code-app\\.cache\\playwright-browsers"

// 真实浏览器端到端测试配置（第4步 P3 关键链路）。
// 三维地图页面 WebGL 上下文重，workers 固定 1 串行执行，避免多实例争抢 GPU。
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  // trace/失败截图产物放工作区 .cache，不污染项目目录
  outputDir: path.join(import.meta.dirname, "../.cache/26102801/e2e-results"),
  use: {
    baseURL: "http://localhost:3003",
    viewport: { width: 414, height: 896 }, // 移动端 App 布局
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3003",
    reuseExistingServer: true,
    timeout: 180_000
  }
})
