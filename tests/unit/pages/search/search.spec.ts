import { describe, it, expect, vi } from "vitest"
import { flushPromises } from "@vue/test-utils"

import { router } from "@mars/routes"
import SearchIndex from "@mars/views/search/index.vue"
import { mountPage } from "../../../helpers/page"

// 容器壳会渲染 search-home → poi-list → quick-point，quick-point 挂载时会请求收藏列表，受控兜底
vi.mock("@mars/common/api", () => ({
  getCollectionList: vi.fn().mockResolvedValue({ code: 200, data: [] }),
  getUserInformation: vi.fn().mockResolvedValue({ code: 200, data: {} })
}))

describe("search 搜索容器壳", () => {
  it("/search 重定向到 search-home，且容器内嵌套 router-view 渲染出搜索首页", async () => {
    // 预加载子路由组件，避免首次懒加载的宏任务级耗时
    await Promise.all([import("@mars/views/search/search-home/index.vue")])
    await router.push("/search")
    await flushPromises()
    expect(router.currentRoute.value.name).toBe("search-home")

    const wrapper = mountPage(SearchIndex)
    await flushPromises()
    // 子页面内容经容器 router-view 渲染：搜索框（占位符）与快捷选点面板均出现
    expect(wrapper.find(".mars-search input").attributes("placeholder")).toBe("请输入搜索关键词")
    expect(wrapper.text()).toContain("我的位置")
    wrapper.unmount()
  })
})
