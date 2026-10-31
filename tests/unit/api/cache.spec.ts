import { describe, it, expect, vi, beforeEach } from "vitest"
import localforage from "localforage"
import { requestLocal, MARS_MARKER_HISTORY, MARS_COLLECTIONS_POINT } from "@mars/common/api/cache"
import {
  addCollection,
  getCollectionList,
  getCollectionById,
  deleteCollectionById,
  isCollection
} from "@mars/common/api/modules/collection-point"

vi.mock("@mars/components/mars-ui", () => ({
  $showLoading: vi.fn(),
  $hideLoading: vi.fn(),
  $message: vi.fn()
}))

const key = MARS_MARKER_HISTORY

async function seed(rows: any[], k = key) {
  await localforage.setItem(k, JSON.stringify(rows))
}

async function read(k = key): Promise<any[]> {
  return JSON.parse((await localforage.getItem<string>(k)) || "[]")
}

describe("cache requestLocal · 参数与鉴权边界", () => {
  it("缺 localParams 时返回 404", async () => {
    const result = await requestLocal({ method: "get", url: "x/y" } as any)
    expect(result.code).toBe(404)
    expect(result.message).toContain("localParams")
  })

  it("未知 type 返回 404", async () => {
    const result = await requestLocal({ method: "get", url: "x/y", localParams: { type: "patch", apiName: key } } as any)
    expect(result.code).toBe(404)
    expect(result.message).toContain("请求不存在")
  })

  it("本地存储损坏时按空集合处理不抛异常", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    await localforage.setItem(key, "{broken")
    const result = await requestLocal({ method: "get", url: "m/s", localParams: { type: "get", apiName: key } } as any)
    expect(result.code).toBe(200)
    expect(result.data).toEqual([])
    vi.restoreAllMocks()
  })
})

describe("cache requestLocal · get 查询", () => {
  beforeEach(async () => {
    await localforage.clear()
    await seed([
      { id: "a1", type: "point", name: "A" },
      { id: "b2", type: "line", name: "B" },
      { id: "c3", type: "point", name: "C" }
    ])
  })

  it("按 id 查询单条", async () => {
    const result = await requestLocal({ method: "get", url: "m/s", localParams: { type: "get", apiName: key }, data: { id: "b2" } } as any)
    expect(result.code).toBe(200)
    expect(result.data.name).toBe("B")
  })

  it("按 id 查不到返回空值（实现为 undefined，调用方按 falsy 处理）", async () => {
    const result = await requestLocal({ method: "get", url: "m/s", localParams: { type: "get", apiName: key }, data: { id: "zz" } } as any)
    expect(result.code).toBe(200)
    expect(result.data).toBeUndefined()
  })

  it("按 type 过滤", async () => {
    const result = await requestLocal({ method: "get", url: "m/s", localParams: { type: "get", apiName: key }, data: { type: "point" } } as any)
    expect(result.data).toHaveLength(2)
  })

  it("无条件返回全量", async () => {
    const result = await requestLocal({ method: "get", url: "m/s", localParams: { type: "get", apiName: key } } as any)
    expect(result.data).toHaveLength(3)
  })
})

describe("cache requestLocal · put 新增/修改", () => {
  beforeEach(async () => {
    await localforage.clear()
  })

  it("无 id 新增：补齐 id/add_time/update_time 并持久化", async () => {
    const result = await requestLocal({ method: "post", url: "m/i", localParams: { type: "put", apiName: key }, data: { name: "N1" } } as any)
    expect(result.code).toBe(200)
    expect(result.data.id).toBeTruthy()
    expect(result.data.add_time).toBeTruthy()
    const stored = await read()
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe("N1")
  })

  it("无 data 新增：返回 500 缺少写入数据（I006 空值分支回归）", async () => {
    const result = await requestLocal({ method: "post", url: "m/i", localParams: { type: "put", apiName: key } } as any)
    expect(result.code).toBe(500)
    expect(result.message).toContain("缺少写入数据")
    expect(await read()).toHaveLength(0)
  })

  it("有 id 更新：合并字段并刷新 update_time", async () => {
    await seed([{ id: "a1", name: "A", remark: "keep" }])
    const result = await requestLocal({ method: "post", url: "m/u", localParams: { type: "put", apiName: key }, data: { id: "a1", name: "A2" } } as any)
    expect(result.code).toBe(200)
    const stored = await read()
    expect(stored[0]).toMatchObject({ id: "a1", name: "A2", remark: "keep", update_time: expect.any(String) })
  })

  it("有 id 但记录不存在：返回 500 id 不存在且不写入（I018 全量替换丢数据回归）", async () => {
    await seed([{ id: "a1", name: "A" }])
    const result = await requestLocal({ method: "post", url: "m/u", localParams: { type: "put", apiName: key }, data: { id: "nope", name: "X" } } as any)
    expect(result.code).toBe(500)
    expect(result.message).toContain("id不存在")
    expect(await read()).toEqual([{ id: "a1", name: "A" }])
  })
})

describe("cache requestLocal · post 匹配查询", () => {
  beforeEach(async () => {
    await localforage.clear()
    await seed([
      { id: "a1", key: "K1", info: JSON.stringify({ targetId: "t9" }) },
      { id: "b2", key: "K2" }
    ])
  })

  it("按顶层字段匹配第一条", async () => {
    const result = await requestLocal({ method: "post", url: "m/c", localParams: { type: "post", apiName: key }, data: { key: "K2" } } as any)
    expect(result.data.id).toBe("b2")
  })

  it("按 info JSON 内字段匹配", async () => {
    const result = await requestLocal({ method: "post", url: "m/c", localParams: { type: "post", apiName: key }, data: { targetId: "t9" } } as any)
    expect(result.data.id).toBe("a1")
  })

  it("无匹配返回 null", async () => {
    const result = await requestLocal({ method: "post", url: "m/c", localParams: { type: "post", apiName: key }, data: { key: "nope" } } as any)
    expect(result.data).toBeNull()
  })

  it("无 data 返回第一条，空集合返回 null", async () => {
    const result = await requestLocal({ method: "post", url: "m/c", localParams: { type: "post", apiName: key } } as any)
    expect(result.data.id).toBe("a1")
    await localforage.setItem(key, "[]")
    const empty = await requestLocal({ method: "post", url: "m/c", localParams: { type: "post", apiName: key } } as any)
    expect(empty.data).toBeNull()
  })
})

describe("cache requestLocal · delete 删除", () => {
  beforeEach(async () => {
    await localforage.clear()
    await seed([{ id: "a1" }, { id: "b2" }, { id: "c3" }])
  })

  it("单 id 删除并持久化", async () => {
    const result = await requestLocal({ method: "post", url: "m/d", localParams: { type: "delete", apiName: key }, data: { id: "a1" } } as any)
    expect(result.code).toBe(200)
    expect((await read()).map((i: any) => i.id)).toEqual(["b2", "c3"])
  })

  it("逗号分隔批量删除", async () => {
    await requestLocal({ method: "post", url: "m/d", localParams: { type: "delete", apiName: key }, data: { id: "a1,c3" } } as any)
    expect((await read()).map((i: any) => i.id)).toEqual(["b2"])
  })

  it("无 data 时不删除任何记录", async () => {
    await requestLocal({ method: "post", url: "m/d", localParams: { type: "delete", apiName: key } } as any)
    expect(await read()).toHaveLength(3)
  })
})

describe("cache requestLocal · user 反射接口", () => {
  it("自有方法可反射调用", async () => {
    const result = await requestLocal({ method: "get", url: "user/login", localParams: { type: "user" } } as any)
    expect(result.code).toBe(200)
    expect(result.data).toEqual({ token: "" })
  })

  it("getUser 返回固定用户信息", async () => {
    const result = await requestLocal({ method: "get", url: "user/getUser", localParams: { type: "user" } } as any)
    expect(result.code).toBe(200)
    expect(result.data.user_name).toBe("mars3d")
  })

  it("不存在的方法返回 404", async () => {
    const result = await requestLocal({ method: "get", url: "user/notExists", localParams: { type: "user" } } as any)
    expect(result.code).toBe(404)
  })

  it("原型链属性（constructor）被白名单拦截（I006 反射回归）", async () => {
    const result = await requestLocal({ method: "get", url: "user/constructor", localParams: { type: "user" } } as any)
    expect(result.code).toBe(404)
    expect(result.data).toBeNull()
  })
})

describe("api modules · collection-point 全链路（module → request → cache → localforage）", () => {
  beforeEach(async () => {
    await localforage.clear()
  })

  it("addCollection → getCollectionList → getCollectionById → deleteCollectionById", async () => {
    const add = await addCollection({ name: "收藏点1", type: "point" })
    expect(add.code).toBe(200)
    const id = add.data.id

    const list = await getCollectionList()
    expect(list.code).toBe(200)
    expect(list.data).toHaveLength(1)

    const one = await getCollectionById(id)
    expect(one.data.name).toBe("收藏点1")

    const del = await deleteCollectionById(id)
    expect(del.code).toBe(200)
    expect((await getCollectionList()).data).toHaveLength(0)
  })

  it("isCollection 匹配已收藏项", async () => {
    await addCollection({ name: "P1", type: "point", key: "PK1" })
    const hit = await isCollection({ key: "PK1" })
    expect(hit.data).not.toBeNull()
    const miss = await isCollection({ key: "NONE" })
    expect(miss.data).toBeNull()
  })

  it("collection 与 marker 历史使用不同存储键互不干扰", async () => {
    await addCollection({ name: "C1" })
    const marker = await requestLocal({ method: "get", url: "m/s", localParams: { type: "get", apiName: MARS_COLLECTIONS_POINT } } as any)
    expect(marker.data).toHaveLength(1)
    const markerList = await requestLocal({ method: "get", url: "m/s", localParams: { type: "get", apiName: MARS_MARKER_HISTORY } } as any)
    expect(markerList.data).toHaveLength(0)
  })
})
