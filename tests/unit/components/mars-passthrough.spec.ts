import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import Vant from "vant"
import MarsUI from "@mars/components/mars-ui"
import MarsButton from "@mars/components/mars-ui/mars-button/index.vue"
import MarsCell from "@mars/components/mars-ui/mars-cell/index.vue"
import MarsEmpty from "@mars/components/mars-ui/mars-empty/index.vue"
import MarsSwitchCell from "@mars/components/mars-ui/mars-switch-cell/index.vue"

// 33 个透传薄封装的抽样代表：断言 attrs 透传、slot 转发、事件冒泡三条契约
describe("mars-ui 透传组件抽样", () => {
  it("mars-button：attrs 透传给 van-button（type/样式类），slot 内容渲染", () => {
    const wrapper = mount(MarsButton, {
      attrs: { type: "danger" },
      slots: { default: "删除" },
      global: { plugins: [Vant] }
    })
    const btn = wrapper.find("button")
    expect(btn.classes()).toContain("van-button--danger")
    expect(btn.classes()).toContain("mars-button")
    expect(btn.text()).toBe("删除")
  })

  it("mars-button：onClick 事件冒泡可用", async () => {
    const onClick = vi.fn()
    const wrapper = mount(MarsButton, {
      attrs: { onClick },
      global: { plugins: [Vant] }
    })
    await wrapper.find("button").trigger("click")
    expect(onClick).toHaveBeenCalled()
  })

  it("mars-cell：title/value 透传渲染", () => {
    const wrapper = mount(MarsCell, {
      attrs: { title: "标题文字", value: "单元格内容" },
      global: { plugins: [Vant] }
    })
    expect(wrapper.find(".van-cell__title").text()).toBe("标题文字")
    expect(wrapper.find(".van-cell__value").text()).toBe("单元格内容")
  })

  it("mars-empty：description 透传 + 默认 slot 转发", () => {
    const wrapper = mount(MarsEmpty, {
      attrs: { description: "暂无数据" },
      slots: { default: "<div class='slot-mark'>自定义底部</div>" },
      global: { plugins: [Vant] }
    })
    expect(wrapper.text()).toContain("暂无数据")
    expect(wrapper.find(".slot-mark").exists()).toBe(true)
  })

  it("mars-switch-cell：label 进 cell 标题，modelValue 经 attrs 透传控制 van-switch 状态", () => {
    const wrapper = mount(MarsSwitchCell, {
      props: { label: "显示轨迹" },
      attrs: { modelValue: true },
      global: { plugins: [Vant, [MarsUI as any, {}]] }
    })
    expect(wrapper.find(".van-cell__title").text()).toBe("显示轨迹")
    expect(wrapper.find(".van-switch--on").exists()).toBe(true)
  })
})
