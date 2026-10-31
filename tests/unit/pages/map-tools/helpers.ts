/**
 * map-tools 页面测试本地助手（不改 tests/helpers/page.ts）：
 * - mountToolPage：与 page.ts 的 mountPage 等价，额外安装 filter-util 插件。
 *   visible/volume/slope/clip 列表页与 bookmark 页模板使用 $filters.timeFilter，
 *   该插件仅在 main.ts 安装，mountPage 未装会导致模板渲染抛错。
 * - fire：从被 mock 的 map.ts eventTarget.on 调用记录中取出处理器并触发，
 *   用于驱动 "drawCreatedEditingMeasure" 等页面事件分支。
 */
import { mount } from "@vue/test-utils"
import type { Component } from "vue"
import Vant from "vant"
import MarsUI from "@mars/components/mars-ui"
import filterPlugin from "@mars/utils/filter-util"
import { router } from "@mars/routes"
import { globalStore, key as globalKey } from "@mars/common/store/global"
import { createMapStub } from "../../../mocks/mars3d"

export interface MountToolPageOptions {
  map?: any
  stubs?: Record<string, any>
  [key: string]: any
}

export function mountToolPage(comp: Component, options: MountToolPageOptions = {}) {
  const { map, stubs, ...rest } = options
  return mount(comp as any, {
    attachTo: document.body,
    global: {
      plugins: [Vant, [MarsUI as any, {}], router, [globalStore, globalKey], filterPlugin],
      provide: { getMapInstance: () => map ?? createMapStub() },
      stubs: stubs ?? {}
    },
    ...rest
  })
}

/** 触发页面 setup 中注册到 mapWork.eventTarget 上的事件处理器 */
export function fire(mapWork: { eventTarget: { on: any } }, event: string, payload?: any) {
  const call = (mapWork.eventTarget.on as any).mock.calls.find((c: any[]) => c[0] === event)
  if (!call) {
    throw new Error(`事件 ${event} 未被页面注册`)
  }
  call[1](payload)
}
