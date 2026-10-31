import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import { defineComponent, h } from "vue"
import useLifecycle from "@mars/common/uses/use-lifecycle"

function makeWrapper(mapWork: any) {
  return defineComponent({
    setup() {
      useLifecycle(mapWork)
      return () => h("div")
    }
  })
}

describe("use-lifecycle 地图生命周期桥接", () => {
  it("提供地图实例且 mapWork.onMounted 存在时，挂载即回调并传入地图", () => {
    const map = { id: "fake-map" }
    const onMounted = vi.fn()
    const wrapper = mount(makeWrapper({ onMounted }), {
      global: { provide: { getMapInstance: () => map } }
    })
    expect(onMounted).toHaveBeenCalledTimes(1)
    expect(onMounted).toHaveBeenCalledWith(map)
    wrapper.unmount()
  })

  it("getMapInstance 返回 null 时 onMounted 不被调用", () => {
    const onMounted = vi.fn()
    const map = null
    const wrapper = mount(makeWrapper({ onMounted }), {
      global: { provide: { getMapInstance: () => map } }
    })
    expect(onMounted).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("未注入 getMapInstance（非地图容器内）时不回调", () => {
    const onMounted = vi.fn()
    const wrapper = mount(makeWrapper({ onMounted }))
    expect(onMounted).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("卸载时调用 mapWork.onUnmounted 清理资源", () => {
    const onUnmounted = vi.fn()
    const map = { id: "m" }
    const wrapper = mount(makeWrapper({ onMounted: vi.fn(), onUnmounted }), {
      global: { provide: { getMapInstance: () => map } }
    })
    expect(onUnmounted).not.toHaveBeenCalled()
    wrapper.unmount()
    expect(onUnmounted).toHaveBeenCalledTimes(1)
  })

  it("mapWork 缺少 onMounted/onUnmounted 时不抛异常", () => {
    const map = { id: "m" }
    const wrapper = mount(makeWrapper({}), {
      global: { provide: { getMapInstance: () => map } }
    })
    expect(() => wrapper.unmount()).not.toThrow()
  })
})
