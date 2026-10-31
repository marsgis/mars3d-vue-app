/**
 * mars-ui 组件全局配置
 * @copyright mars3d.cn
 * @author 火星渣渣灰
 */

let marsUIConfig: Record<string, any> = {}

export function setConfig(config: Record<string, any> = {}) {
  marsUIConfig = config
}

export const getConfig = () => {
  return marsUIConfig
}
