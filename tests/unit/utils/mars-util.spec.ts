import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  isLonLat,
  setAutoHeight,
  getQueryString,
  openGaode,
  fieldTime,
  sortByKey,
  checkPhone,
  checkPassword,
  checkEmail,
  checkName,
  checkCode,
  logInfo,
  logWarn
} from "@mars/utils/mars-util"
import dayjs from "dayjs"

describe("mars-util 校验规则", () => {
  it("isLonLat：合法经纬度字符串", () => {
    expect(isLonLat("117.2,31.8")).toBe(true)
    expect(isLonLat("117,31")).toBe(true)
    expect(isLonLat("-117.2,-31.8")).toBe(true)
    expect(isLonLat("180,90")).toBe(true)
    expect(isLonLat("180.0,90.0")).toBe(true)
  })

  it("isLonLat：越界/逆序/缺纬度均拒绝", () => {
    expect(isLonLat("200,31.8")).toBe(false)
    expect(isLonLat("31.8,117.2")).toBe(false)
    expect(isLonLat("117.2")).toBe(false)
    expect(isLonLat("")).toBe(false)
    expect(isLonLat("abc,def")).toBe(false)
  })

  it("checkPhone：11 位且第二位为合法号段", () => {
    expect(checkPhone("13812345678")).toBe(true)
    expect(checkPhone("15912345678")).toBe(true)
    expect(checkPhone("12812345678")).toBe(false)
    expect(checkPhone("1381234567")).toBe(false)
    expect(checkPhone("")).toBe(false)
  })

  it("checkPassword：6-30 位且不能纯数字/纯字母", () => {
    expect(checkPassword("abc123")).toBe(true)
    expect(checkPassword("a1".repeat(15))).toBe(true) // 30 位边界
    expect(checkPassword("123456")).toBe(false) // 纯数字
    expect(checkPassword("abcdef")).toBe(false) // 纯字母
    expect(checkPassword("a1b2c")).toBe(false) // 少于 6 位
    expect(checkPassword("a1".repeat(16))).toBe(false) // 超过 30 位
  })

  it("checkEmail：基本邮箱格式", () => {
    expect(checkEmail("ab@b.cn")).toBe(true)
    expect(checkEmail("a@b.c.d")).toBe(true)
    expect(checkEmail("a@b")).toBe(false)
    expect(checkEmail("a.b@b.cn")).toBe(false) // 本地段不允许点号
    expect(checkEmail("")).toBe(false)
  })

  it("checkName：1-8 位中文/字母数字下划线", () => {
    expect(checkName("火")).toBe(true)
    expect(checkName("火星科技平台")).toBe(true) // 6 个中文字符
    expect(checkName("ab_12")).toBe(true)
    expect(checkName("一二三四五六七八")).toBe(true) // 8 位边界
    expect(checkName("一二三四五六七八九")).toBe(false) // 9 位
    expect(checkName("a b")).toBe(false)
    expect(checkName("")).toBe(false)
  })

  it("checkCode：恰好 4 位数字", () => {
    expect(checkCode("1234")).toBe(true)
    expect(checkCode("123")).toBe(false)
    expect(checkCode("12345")).toBe(false)
    expect(checkCode("12a4")).toBe(false)
  })
})

describe("mars-util getQueryString", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/?lng=117.2&name=%E5%90%88%E8%82%A5")
  })
  afterEach(() => {
    window.history.replaceState(null, "", "/")
  })

  it("读取存在的参数", () => {
    expect(getQueryString("lng")).toBe("117.2")
    expect(getQueryString("name")).toBe("合肥")
  })

  it("读取不存在的参数返回 null", () => {
    expect(getQueryString("notexist")).toBeNull()
  })
})

describe("mars-util fieldTime 时间过滤", () => {
  const now = () => dayjs().format("YYYY/MM/DD HH:mm:ss")

  it("按小时窗口过滤（1h）", () => {
    const list = [
      { info: { date: { update: now() } } },
      { info: { date: { update: dayjs().subtract(3, "hour").format("YYYY/MM/DD HH:mm:ss") } } }
    ]
    const result = fieldTime(list, "info.date.update", "1h")
    expect(result).toHaveLength(1)
    expect(result[0].info.date.update).toBe(list[0].info.date.update)
  })

  it("按天窗口过滤（2d）", () => {
    const list = [
      { info: { date: { update: dayjs().subtract(1, "day").format("YYYY/MM/DD HH:mm:ss") } } },
      { info: { date: { update: dayjs().subtract(5, "day").format("YYYY/MM/DD HH:mm:ss") } } }
    ]
    expect(fieldTime(list, "info.date.update", "2d")).toHaveLength(1)
  })

  it("按周/月窗口取值正确", () => {
    const list = [
      { info: { date: { update: dayjs().subtract(20, "day").format("YYYY/MM/DD HH:mm:ss") } } }
    ]
    expect(fieldTime(list, "info.date.update", "1w")).toHaveLength(0) // 20天 > 7天
    expect(fieldTime(list, "info.date.update", "1m")).toHaveLength(1) // 20天 < 30天
  })

  it("键缺失的项被过滤掉，不抛异常", () => {
    const list = [{ other: 1 }, { info: { date: { update: now() } } }]
    expect(fieldTime(list, "info.date.update", "1h")).toHaveLength(1)
  })
})

describe("mars-util sortByKey 排序", () => {
  it("数字排序：order=true 倒序、false 正序", () => {
    expect(sortByKey([{ v: 1 }, { v: 3 }, { v: 2 }], "v", true).map((i: any) => i.v)).toEqual([3, 2, 1])
    expect(sortByKey([{ v: 1 }, { v: 3 }, { v: 2 }], "v", false).map((i: any) => i.v)).toEqual([1, 2, 3])
  })

  it("嵌套键排序", () => {
    const list = [{ a: { b: 2 } }, { a: { b: 1 } }, { a: { b: 3 } }]
    expect(sortByKey(list, "a.b", false).map((i: any) => i.a.b)).toEqual([1, 2, 3])
  })

  it("日期字符串排序（order=true 新的在前）", () => {
    const list = [{ t: "2026-01-01" }, { t: "2026-03-01" }, { t: "2026-02-01" }]
    expect(sortByKey(list, "t", true).map((i: any) => i.t)).toEqual([
      "2026-03-01",
      "2026-02-01",
      "2026-01-01"
    ])
  })
})

describe("mars-util setAutoHeight", () => {
  it("容器存在：初始计算高度、响应 resize，清理后停止响应", () => {
    const el = document.createElement("div")
    el.id = "sanbox-warpper"
    Object.defineProperty(el, "clientHeight", { value: 200, configurable: true })
    document.body.appendChild(el)

    const calls: number[] = []
    const cleanup = setAutoHeight((v) => calls.push(v), 50)
    // 初始回调 + resize() 立即补偿各一次，均为 200-50
    expect(calls).toEqual([150, 150])

    Object.defineProperty(el, "clientHeight", { value: 300, configurable: true })
    window.dispatchEvent(new Event("resize"))
    expect(calls).toContain(250)

    const countBefore = calls.length
    cleanup()
    window.dispatchEvent(new Event("resize"))
    expect(calls.length).toBe(countBefore)
    el.remove()
  })

  it("容器缺失时回退 body（clientHeight 0），返回清理函数", () => {
    document.getElementById("sanbox-warpper")?.remove()
    const calls: number[] = []
    const cleanup = setAutoHeight((v) => calls.push(v), 50)
    expect(calls[0]).toBe(-50)
    expect(typeof cleanup).toBe("function")
    cleanup()
  })
})

describe("mars-util openGaode", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    delete (window as any).plus
  })
  afterEach(() => {
    delete (window as any).plus
  })

  it("APP 环境（window.plus）走 openURL，坐标经 wgs2gcj 转换", () => {
    const openURL = vi.fn()
    ;(window as any).plus = { runtime: { openURL } }
    openGaode({ lng: 117.2, lat: 31.8, addr: "合肥" })
    expect(openURL).toHaveBeenCalledTimes(1)
    const url = openURL.mock.calls[0][0] as string
    expect(url).toContain("uri.amap.com/marker")
    expect(url).toContain("117.2,31.8")
    expect(url).toContain("合肥")
  })

  it("带起点时拼导航 URL（含 routeType）", () => {
    const openURL = vi.fn()
    ;(window as any).plus = { runtime: { openURL } }
    openGaode(
      { lng: 117.2, lat: 31.8, addr: "终点", name: "终点名" },
      { lng: 117.1, lat: 31.7, name: "起点名", key: "k1", type: "t1" },
      "drive"
    )
    const url = openURL.mock.calls[0][0] as string
    expect(url).toContain("m.amap.com/navigation/drive")
    expect(url).toContain("saddr=117.1,31.7")
  })

  it("非 APP 环境走 location.assign", () => {
    const assign = vi.spyOn(window.location, "assign").mockImplementation(() => {})
    openGaode({ lng: 117.2, lat: 31.8, addr: "合肥" })
    expect(assign).toHaveBeenCalledTimes(1)
    expect(String(assign.mock.calls[0][0])).toContain("marker")
  })
})

describe("mars-util 日志封装（devProject 开关）", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {})
    localStorage.removeItem("project-debugger")
  })
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.removeItem("project-debugger")
  })

  it("开关关闭时 logInfo/logWarn 不输出", () => {
    logInfo("hello")
    logWarn("warn")
    expect(console.log).not.toHaveBeenCalled()
  })

  it("devProject(true) 打开后，重新加载模块 logInfo/logWarn 输出", async () => {
    ;(window as any).devProject(true)
    expect(localStorage.getItem("project-debugger")).toBe("1")
    vi.resetModules()
    const fresh = await import("@mars/utils/mars-util")
    fresh.logInfo("hello")
    fresh.logWarn("warn")
    expect(console.log).toHaveBeenCalledTimes(2)
  })
})
