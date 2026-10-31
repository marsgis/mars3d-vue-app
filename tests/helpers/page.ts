import { mount } from "@vue/test-utils"
import type { Component } from "vue"
import Vant from "vant"
import MarsUI from "@mars/components/mars-ui"
import { router } from "@mars/routes"
import { globalStore, key as globalKey } from "@mars/common/store/global"
import { createMapStub } from "../mocks/mars3d"

/**
 * P2 页面受控适配层统一挂载器：
 * - 注册 vant + mars-ui 全局组件（页面模板直接使用 mars-* / van-*）
 * - 安装项目真实路由（hash 模式）与 vuex store，页面内 useRouter/useRoute/useGlobalStore 可用
 * - provide("getMapInstance") 返回受控地图桩，页面 map.ts 的 onMounted(map) 被安全桥接
 */
export interface MountPageOptions {
  /** 覆盖默认地图桩（需要断言 map 调用时自建 createMapStub() 传入） */
  map?: any
  stubs?: Record<string, any>
  [key: string]: any
}

export function mountPage(comp: Component, options: MountPageOptions = {}) {
  const { map, stubs, ...rest } = options
  return mount(comp as any, {
    attachTo: document.body,
    global: {
      plugins: [Vant, [MarsUI as any, {}], router, [globalStore, globalKey]],
      provide: { getMapInstance: () => map ?? createMapStub() },
      stubs: stubs ?? {}
    },
    ...rest
  })
}
