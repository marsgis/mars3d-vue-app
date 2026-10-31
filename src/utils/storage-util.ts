/**
 * 本地存储工具（localforage 读取容错）
 * @copyright mars3d.cn
 */
import localforage from "localforage"

/**
 * 读取本地 JSON 存储并容错解析
 * - key 不存在或 JSON 损坏时返回 defaultValue，不会抛异常
 * - 用于各列表页恢复"排序/筛选"等用户偏好，损坏时回退默认偏好即可
 * @param key localforage 存储键（各列表页请使用与页面语义一致的 key，勿跨页复制复用）
 * @param defaultValue 解析失败/不存在时的兜底值
 */
export async function getLocalJSON<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const raw = await localforage.getItem<string>(key)
    if (!raw) {
      return defaultValue
    }
    return JSON.parse(raw) || defaultValue
  } catch (err) {
    console.error(`本地存储[${key}]解析失败，已回退默认值`, err)
    return defaultValue
  }
}
