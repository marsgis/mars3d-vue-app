import { describe, it, expect } from "vitest"
import { flushPromises } from "@vue/test-utils"
import { router } from "@mars/routes"

import Home from "@mars/views/home/index.vue"
import { mountPage } from "../../helpers/page"

// 首页挂载的外层地图工具组件（tools-shortcut/layer-shortcut/auto-locate/auto-navigation）
// 由组件层专项覆盖，此处 stub 后聚焦页面自身模板与导航行为
const stubs = {
  ToolsShortcut: true,
  LayerShortcut: true,
  AutoLocate: true,
  AutoNavigation: true
}

describe("home 首页", () => {
  it("渲染顶部面板：用户头像入口与搜索栏", () => {
    const wrapper = mountPage(Home, { stubs })
    expect(wrapper.find(".home-top").exists()).toBe(true)
    expect(wrapper.find(".home-search-bar").text()).toContain("点击输入关键词")
    expect(wrapper.find(".mars-image").exists()).toBe(true)
    wrapper.unmount()
  })

  it("点击搜索栏跳转 search（容器路由 redirect 到 search-home）", async () => {
    // 预加载目标路由组件：vite-node 首次懒加载整条依赖图是宏任务级耗时，
    // 预载后导航收尾全部在微任务内，flushPromises 即可等待完成
    await Promise.all([import("@mars/views/search/index.vue"), import("@mars/views/search/search-home/index.vue")])
    const wrapper = mountPage(Home, { stubs })
    await wrapper.find(".home-search-bar").trigger("click")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("search-home")
    wrapper.unmount()
  })

  it("无用户头像时展示默认图", () => {
    const wrapper = mountPage(Home, { stubs })
    expect(wrapper.html()).toContain("img/project/user/login.png")
    wrapper.unmount()
  })
})
