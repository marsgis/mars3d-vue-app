import path from "path"
import vue from "@vitejs/plugin-vue"
import Components from "unplugin-vue-components/vite"
import { VantResolver } from "unplugin-vue-components/resolvers"
import { defineConfig } from "vitest/config"

// 单元/组件测试专用配置（与 vite.config.ts 分离，避免 mars3d/eslint 插件进入测试链）
export default defineConfig({
  resolve: {
    alias: [
      {
        // 测试运行时把本地包 mars3d 整体替换为桩模块（真实包依赖 WebGL/Canvas 无法在 Node 执行；
        // vi.mock 对外部化/file: 依赖不可靠，alias 是唯一稳定拦截点）
        find: /^mars3d$/,
        replacement: path.join(import.meta.dirname, "tests/mars3d-stub.ts")
      },
      { find: "@mars", replacement: path.join(import.meta.dirname, "src") }
    ],
    extensions: [".js", ".ts", ".jsx", ".tsx", ".json", ".mjs"]
  },
  plugins: [vue(), Components({ resolvers: [VantResolver()] })],
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.spec.ts"],
    css: false,
    // 路由跳转类测试需懒加载整条页面依赖图（vite-node 首次 transform 是宏任务级耗时），
    // 全量并发时单测可超过默认 5s，放宽到 20s
    testTimeout: 20000,
    // 覆盖率全量运行下，页面路由跳转触发的懒加载组件可能跨过环境拆除窗口（EnvironmentTeardownError 噪音，
    // vitest 自身标注"not a bug"），放宽拆除等待让在途导入收尾
    teardownTimeout: 30000,
    // 内联 vant 与本地包 mars3d（file:packages/mars3d）：
    // 外部化模块不走 vite-node 管道，vi.mock 拦截不到，mars3d 真实包会因 WebGL/Canvas 缺失崩溃；
    // inline 按 id 匹配 packages 路径，避免误伤 node_modules 下的 mars3d-cesium
    server: {
      deps: {
        inline: [/vant/, /[\\/]packages[\\/]mars3d[\\/]/]
      }
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.{ts,vue,js}"],
      exclude: [
        "src/assets/**",
        "src/common/style/**",
        "src/**/*.d.ts",
        "src/main.ts",
        "tests/**"
      ],
      reportsDirectory: "coverage"
    }
  }
})
