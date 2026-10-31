import "fake-indexeddb/auto"
import { afterAll } from "vitest"

/**
 * 全局测试环境初始化。
 * 注意：mars3d 的替换不走 vi.mock（setupFiles 中的 mock 不跨测试文件生效，且 file: 本地包
 * 会被 vite-node 外部化），而是由 vitest.config.ts 的 resolve.alias 指向 tests/mars3d-stub.ts。
 */

// 页面级用例通过真实路由跳转（如注册成功后进首页）会触发懒加载页面图及其 SFC 样式块的
// 独立请求；coverage 运行下这些在途请求可能晚于环境拆除完成，产生 EnvironmentTeardownError
// 噪音（vitest 自身标注 not a bug，且会使退出码非 0）。每文件收尾前留出固定窗口让其完成。
afterAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, 500))
})
