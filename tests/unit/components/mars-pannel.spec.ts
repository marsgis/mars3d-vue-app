import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import MarsUI from "@mars/components/mars-ui"
import MarsPannel from "@mars/components/mars-ui/mars-pannel/index.vue"

const mountPannel = (props: Record<string, any> = {}, config: Record<string, any> = {}) =>
  mount(MarsPannel, {
    props,
    slots: { default: "<div>面板内容</div>" },
    global: { plugins: [[MarsUI as any, config]] }
  })

describe("mars-pannel 面板", () => {
  it("visible=false 时 v-show 隐藏，visible=true 时显示", () => {
    const hidden = mountPannel({ visible: false })
    expect(hidden.find(".pannel-box").element.style.display).toBe("none")
    const shown = mountPannel({ visible: true })
    expect(shown.find(".pannel-box").element.style.display).not.toBe("none")
  })

  it("默认插槽内容渲染在面板内", () => {
    const wrapper = mountPannel({ visible: true })
    expect(wrapper.find(".pannel-content").text()).toContain("面板内容")
  })

  it("animation=false 时不加动画类", () => {
    const cls = mountPannel({ visible: true, animation: false }).find(".pannel-box").classes()
    expect(cls.some((c) => c.startsWith("fadein"))).toBe(false)
  })

  it("animation 为字符串时直接用作动画类名", () => {
    const cls = mountPannel({ visible: true, animation: "my-anim" }).find(".pannel-box").classes()
    expect(cls).toContain("my-anim")
  })

  it("右侧/左侧/顶部/底部定位分别对应四向动画类", () => {
    expect(mountPannel({ visible: true, right: 10 }).find(".pannel-box").classes()).toContain("fadein-right")
    expect(mountPannel({ visible: true, left: 10 }).find(".pannel-box").classes()).toContain("fadein-left")
    expect(mountPannel({ visible: true, top: 10 }).find(".pannel-box").classes()).toContain("fadein-down")
    expect(mountPannel({ visible: true, bottom: 10 }).find(".pannel-box").classes()).toContain("fadein-up")
    expect(mountPannel({ visible: true }).find(".pannel-box").classes()).toContain("fadein-center")
  })

  it("挂载后写入定位样式：数字补 px，zIndex 生效", () => {
    const el = mountPannel({ visible: true, left: 10, top: 20, zIndex: 888 }).find(".pannel-box").element as HTMLElement
    expect(el.style.left).toBe("10px")
    expect(el.style.top).toBe("20px")
    expect(String(el.style.zIndex)).toBe("888")
  })

  it("带单位字符串原样写入，纯数字字符串补 px", () => {
    const el = mountPannel({ visible: true, left: "10%", top: "50" }).find(".pannel-box").element as HTMLElement
    expect(el.style.left).toBe("10%")
    expect(el.style.top).toBe("50px")
  })

  it("position 对象展开为四向定位", () => {
    const el = mountPannel({ visible: true, position: { bottom: 30, right: 40 } }).find(".pannel-box").element as HTMLElement
    expect(el.style.bottom).toBe("30px")
    expect(el.style.right).toBe("40px")
  })

  it("宽高写入样式（数字补 px）", () => {
    const el = mountPannel({ visible: true, width: 200, height: 100 }).find(".pannel-box").element as HTMLElement
    expect(el.style.width).toBe("200px")
    expect(el.style.height).toBe("100px")
  })

  it("全局 config.pannel 兜底无默认值的 props（如 width）", () => {
    const el = mountPannel({ visible: true }, { pannel: { width: "300px" } }).find(".pannel-box").element as HTMLElement
    expect(el.style.width).toBe("300px")
  })
})
