/**
 * 服务端接口
 * @copyright mars3d.cn
 * @author 火星渣渣灰
 */

export interface ApiResult<T = any> {
  code: number
  data: T
  message?: string
}

/**
 * 获取用户信息
 * @returns {Promise<ApiResult>} 返回用户信息
 */
export async function getUserInformation(): Promise<ApiResult> {
  try {
    const res = await fetch("/api/user/information")
    return await res.json()
  } catch {
    return { code: 500, data: null, message: "获取用户信息失败" }
  }
}
