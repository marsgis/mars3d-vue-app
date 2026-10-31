import { vi } from "vitest"

/**
 * mars3d 命名空间桩（setup.ts 全局 mock "mars3d"）。
 * 本地包 mars3d 体积大且初始化依赖 WebGL，单测环境只能受控适配；
 * 各页面测试用到新 API 时在此追加对应桩，不真实加载引擎。
 */
export const mars3dMock = {
  Log: {
    hasInfo: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  },
  PointTrans: {
    wgs2gcj: vi.fn((v: number[]) => v),
    gcj2wgs: vi.fn((v: number[]) => v),
    wgs2gcj2: vi.fn((v: number[]) => v),
    gcj2wgs2: vi.fn((v: number[]) => v)
  }
}

/** 生成带实例方法的类桩：new Stub() 后实例与原型上均可调用指定方法 */
export function makeClassStub(methods: string[] = [], props: Record<string, unknown> = {}) {
  const Ctor: any = vi.fn(function (this: any) {
    Object.assign(this, props)
    for (const m of methods) {
      if (typeof this[m] === "undefined") {
        this[m] = vi.fn()
      }
    }
  })
  for (const m of methods) {
    Ctor.prototype[m] = vi.fn()
  }
  return Ctor
}

/**
 * 万能链式桩：可调用、可 new、可任意属性访问，属性访问无限深链且同 key 结果稳定。
 * 用于 mars3d 命名空间兜底（页面 map.ts / config/*.ts 顶层会 new mars3d 各类、读各类常量）。
 */
export function createAnyStub(name = "stub"): any {
  const cache: Record<PropertyKey, any> = {}
  const fn: any = vi.fn(function () {
    return instanceProxy
  })
  fn._stubName = name
  const getProp = (_t: any, prop: PropertyKey) => {
    if (prop === "then") {
      return undefined // 避免 await 桩值时被误判为 thenable 挂起
    }
    if (prop === Symbol.toPrimitive) {
      return () => `[stub ${name}]`
    }
    if (prop === Symbol.toStringTag) {
      return name
    }
    if (!(prop in cache)) {
      cache[prop] = createAnyStub(`${name}.${String(prop)}`)
    }
    return cache[prop]
  }
  const instanceProxy: any = new Proxy(function () {}, {
    get: getProp,
    set(_t, prop, value) {
      cache[prop] = value
      return true
    },
    apply() {
      return instanceProxy
    }
  })
  const classProxy: any = new Proxy(fn, {
    get: getProp,
    construct() {
      return instanceProxy
    },
    apply() {
      return instanceProxy
    }
  })
  return classProxy
}

/** 通用地图实例桩：页面 map.ts 的 onMounted(map) 收到的受控地图对象 */
export function createMapStub(): any {
  return createAnyStub("map")
}

export default mars3dMock
