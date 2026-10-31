import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import MarsSelect from "@mars/components/mars-ui/mars-select/index.vue"

const columns = [
  { text: "苹果", value: "apple" },
  { text: "香蕉", value: "banana" }
]

const mountSelect = (modelValue = "", props: Record<string, any> = {}) =>
  mount(MarsSelect, {
    props: { modelValue, label: "水果", ...props },
    attrs: { columns }
  })

describe("mars-select 选择器", () => {
  it("modelValue 匹配 columns 时 cell 显示对应文本", () => {
    const wrapper = mountSelect("apple")
    expect(wrapper.text()).toContain("苹果")
  })

  it("modelValue 无匹配时显示空值", () => {
    const wrapper = mountSelect("nope")
    expect(wrapper.text()).not.toContain("苹果")
    expect(wrapper.text()).not.toContain("香蕉")
  })

  it("点击 cell 后弹出选择器（teleport 到 body）", async () => {
    const wrapper = mountSelect("apple")
    await wrapper.find(".mars-cell").trigger("click")
    expect(document.body.querySelector(".van-popup")).toBeTruthy()
    expect(document.body.querySelector(".van-picker")).toBeTruthy()
  })

  it("确认时关闭弹窗并发出 update:modelValue（join 逗号）与 change", () => {
    const wrapper = mountSelect("apple")
    ;(wrapper.vm as any).onConfirm({ selectedValues: ["banana", "x"] })
    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["banana,x"])
    expect(wrapper.emitted("change")![0]).toEqual([["banana", "x"]])
    expect((wrapper.vm as any).showSelect).toBe(false)
  })

  it("取消时仅关闭弹窗，不发出任何值变更事件", () => {
    const wrapper = mountSelect("apple")
    ;(wrapper.vm as any).onCancel()
    expect(wrapper.emitted("update:modelValue")).toBeUndefined()
    expect(wrapper.emitted("change")).toBeUndefined()
    expect((wrapper.vm as any).showSelect).toBe(false)
  })

  it("label 作为 cell 标题与 picker 标题", () => {
    const wrapper = mountSelect("apple")
    expect(wrapper.text()).toContain("水果")
  })
})
