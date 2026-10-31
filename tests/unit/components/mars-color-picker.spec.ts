import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import MarsColorPicker from "@mars/components/mars-ui/mars-color-picker/index.vue"

const inputValue = (wrapper: any) => (wrapper.find("input").element as HTMLInputElement).value

describe("mars-color-picker 颜色选择", () => {
  it("rgba 模型值转换为 hex 显示", () => {
    const wrapper = mount(MarsColorPicker, { props: { modelValue: "rgba(255,0,0,1)" } })
    expect(inputValue(wrapper)).toBe("#ff0000")
  })

  it("已是 hex 的模型值直通显示", () => {
    const wrapper = mount(MarsColorPicker, { props: { modelValue: "#00ff00" } })
    expect(inputValue(wrapper)).toBe("#00ff00")
  })

  it("超出 0-255 的通道被 clamp", () => {
    const wrapper = mount(MarsColorPicker, { props: { modelValue: "rgba(300,-20,99,1)" } })
    expect(inputValue(wrapper)).toBe("#ff0063")
  })

  it("输入新颜色时发出 update:modelValue 与 change（hex + rgba 双值）", async () => {
    const wrapper = mount(MarsColorPicker, { props: { modelValue: "#ff0000" } })
    await wrapper.find("input").setValue("#00ff00")
    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["#00ff00"])
    const change = wrapper.emitted("change")![0]
    expect(change[0]).toBe("#00ff00")
    expect(change[1]).toEqual({ hex: "#00ff00", rgba: "rgba(0,255,0,1)" })
  })

  it("模型值变化时回写输入框（watchEffect）", async () => {
    const wrapper = mount(MarsColorPicker, { props: { modelValue: "rgba(0,0,255,1)" } })
    expect(inputValue(wrapper)).toBe("#0000ff")
    await wrapper.setProps({ modelValue: "rgba(255,255,0,1)" })
    expect(inputValue(wrapper)).toBe("#ffff00")
  })
})
