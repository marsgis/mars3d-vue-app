import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"

import MarsIcon from "@mars/components/mars-ui/mars-icon/index.vue"

// 桩掉图标库全量导入，只验证「图标名→渲染函数查找→svg 输出」链路
// NotExistIcon: undefined —— 显式声明缺失图标键，让容错分支（typeof render !== "function"）可被触达
vi.mock("@icon-park/svg", () => ({
  Home: (opts: any) => `<svg data-theme="${opts.theme}" data-size="${opts.size}"></svg>`,
  Search: (opts: any) => `<svg data-fill="${opts.fill}"></svg>`,
  NotExistIcon: undefined
}))

describe("mars-icon 图标组件", () => {
  it("图标名转 PascalCase 后查找渲染函数并输出 svg", () => {
    const wrapper = mount(MarsIcon, { props: { icon: "home", width: 20 } })
    expect(wrapper.find("svg").exists()).toBe(true)
    expect(wrapper.html()).toContain('data-theme="outline"')
    expect(wrapper.html()).toContain('data-size="20"')
  })

  it("color 通过 fill 传入渲染函数", () => {
    const wrapper = mount(MarsIcon, { props: { icon: "search", color: "#ff0000" } })
    expect(wrapper.html()).toContain('data-fill="#ff0000"')
  })

  it("图标名不存在时渲染空串，不抛异常", () => {
    const wrapper = mount(MarsIcon, { props: { icon: "not-exist-icon" } })
    expect(wrapper.find("svg").exists()).toBe(false)
    expect(wrapper.vm.svgComponent).toBe("")
  })

  it("默认尺寸 14", () => {
    const wrapper = mount(MarsIcon, { props: { icon: "home" } })
    expect(wrapper.html()).toContain('data-size="14"')
  })
})
