import path from "path"
import type { ConfigEnv } from "vite"
import { defineConfig, loadEnv } from "vite"
import vue from "@vitejs/plugin-vue"
// import legacy from "@vitejs/plugin-legacy"
import eslintPlugin from "vite-plugin-eslint"
import { mars3dPlugin } from "vite-plugin-mars3d"
import pxtoviewport from "postcss-px-to-viewport-8-plugin"
import autoprefixer from "autoprefixer"
import Components from "unplugin-vue-components/vite"
import { VantResolver } from "unplugin-vue-components/resolvers"

export default ({ mode }: ConfigEnv) => {
  const root = process.cwd()
  // 获取 .env 文件里定义的环境变量
  const ENV = loadEnv(mode, root)

  // 仅输出模式名；不得打印 ENV 整体（.env 含云存储凭据等敏感变量）
  console.log(`当前环境信息：`, mode)

  return defineConfig({
    base: ENV.VITE_BASE_URL,
    server: {
      port: 3003
      // proxy: {
      //   // "/v1": "http://localhost:7001"
      //   "/v1": "http://server.mars3d.cn"
      // }
    },
    define: {
      "process.env": {
        mode,
        BASE_URL: ENV.VITE_BASE_URL,
        API_BASE: ENV.VITE_API_URL
      }
    },
    resolve: {
      alias: {
        // 注意：Vite8 (ESM) 下不能使用 __dirname，需使用 import.meta.dirname
        "@mars": path.join(import.meta.dirname, "src")
      },
      extensions: [".js", ".ts", ".jsx", ".tsx", ".json", ".mjs"]
    },
    json: {
      // 支持从 .json 文件中进行按名导入
      namedExports: true,
      stringify: false
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true
        }
      },
      postcss: {
        plugins: [
          autoprefixer(),
          pxtoviewport({ viewportWidth: 375 })
        ]
      }
    },
    build: {
      // 输出路径
      outDir: path.join("./dist", ENV.VITE_BASE_URL),
      // 小于此阈值的导入或引用资源将内联为 base64 编码， 以避免额外的http请求， 设置为 0, 可以完全禁用此项，
      assetsInlineLimit: 4096,
      // 启动 / 禁用 CSS 代码拆分
      cssCodeSplit: true,
      // 构建后是否生成 soutrce map 文件
      sourcemap: false,
      // 自定义rollup-commonjs插件选项
      commonjsOptions: {
        include: /node_modules|packages/
      },
      // 静态资源目录
      assetsDir: "assets",
      // 大文件告警阈值放宽（mars3d-cesium 单库即 4-5MB，已独立分包）
      chunkSizeWarningLimit: 4000,
      // 自定义底层的 Rollup 打包配置
      rollupOptions: {
        output: {
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
          // Vite8 (rolldown) 使用原生 codeSplitting 分组（不支持 manualChunks）
          // priority 高的组先匹配，cesium 必须排在 mars3d 之前，否则会被 mars3d(-[a-z]+)* 误吞
          codeSplitting: {
            groups: [
              { name: "cesium", test: /[\\/]node_modules[\\/]mars3d-cesium[\\/]/, priority: 30 },
              { name: "mars3d", test: /[\\/]node_modules[\\/]mars3d(-[a-z]+)*[\\/]|[\\/]packages[\\/]mars3d[\\/]/, priority: 20 },
              { name: "vant", test: /[\\/]node_modules[\\/](vant|@vant)[\\/]/, priority: 10 },
              { name: "vendor", test: /[\\/]node_modules[\\/]/, priority: 0 }
            ]
          }
        }
      },
      // 当设置为 true, 构建后将会生成 manifest.json 文件
      manifest: false,
      // 设置为 false 可以禁用最小化混淆,或是用来指定是应用哪种混淆器 boolean | 'terser' | 'esbuild'
      minify: "terser",
      // 传递给 Terser 的更多 minify 选项
      terserOptions: {
        compress: {
          drop_console: true, // 删除 console.log
          drop_debugger: true // 删除 debugger
        }
      },
      // 设置为false 来禁用将构建好的文件写入磁盘
      write: true,
      // 默认情况下 若 outDir 在 root 目录下， 则 Vite 会在构建时清空该目录。
      emptyOutDir: true
    },
    plugins: [
      vue(),
      eslintPlugin(),
      // Vite 8(rolldown) 预构建 mars3d-cesium 会挂起导致 dev 卡死，必须走静态资源外链模式
      mars3dPlugin({ useStatic: true }),
      Components({ resolvers: [VantResolver()] })
    ]
  })
}
