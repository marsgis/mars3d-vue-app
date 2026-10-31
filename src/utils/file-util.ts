/**
 * 文件处理相关 静态Util方法
 *
 * @copyright mars3d.cn
 * @author 木遥 2022-01-01
 */
import OSS from "ali-oss"
import { v4 as uuidV4 } from "uuid"

export async function uploadFilebyOSS(file: File) {
  const accessKeyId = import.meta.env.VITE_OSS_ACCESS_KEY_ID
  const accessKeySecret = import.meta.env.VITE_OSS_ACCESS_KEY_SECRET
  if (!accessKeyId || !accessKeySecret) {
    return {
      success: false,
      errMsg: "未配置 OSS 上传密钥，请在环境变量中设置 VITE_OSS_ACCESS_KEY_ID 和 VITE_OSS_ACCESS_KEY_SECRET"
    }
  }

  const client = new OSS({
    region: import.meta.env.VITE_OSS_REGION || "oss-cn-shanghai",
    accessKeyId,
    accessKeySecret,
    bucket: import.meta.env.VITE_OSS_BUCKET || "marsgis-demo"
  })
  const rawExt = (file.name.split(".").pop() || "bin").toLowerCase()
  const ext = /^[a-z0-9]{1,8}$/.test(rawExt) ? rawExt : "bin"
  const result = await client.put(`mars-app/${uuidV4()}.${ext}`, file, {})
  if (result.res.status === 200) {
    return {
      success: true,
      url: result.url,
      name: result.name
    }
  } else {
    return {
      success: false,
      errMsg: "文件上传失败"
    }
  }
}

/**
 * 读取json文件内容
 *
 * @template T 返回的数据类型
 * @param {*} file 文件选择框选择的文件对象
 * @return {*}  {Promise<T>}
 */
export function readJSON<T>(file: Blob & { name?: string }): Promise<T> {
  return new Promise((resolve, reject) => {
    const fileName = file?.name || ""
    const fileType = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase()
    if (fileType !== "json") {
      const message = "文件类型不合法,请选择json格式标注文件！"
      alert(message)
      reject(new Error(message))
      return
    }

    if (!window.FileReader) {
      reject(new Error("当前浏览器不支持读取本地文件"))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => {
      reject(reader.error || new Error("读取文件失败"))
    }
    reader.onloadend = () => {
      try {
        resolve(JSON.parse(String(reader.result)) as T)
      } catch (error) {
        reject(error)
      }
    }
    reader.readAsText(file, "UTF-8")
  })
}

function clone(obj: any, removeKeys: any, level: any): any {
  // 避免死循环，拷贝的层级最大深度
  if (level == null) {
    level = 9
  }
  if (removeKeys == null) {
    removeKeys = ["_layer"]
  }

  if (obj === null || typeof obj !== "object") {
    return obj
  }

  // Handle Date
  if (isDate(obj)) {
    const copy = new Date()
    copy.setTime(obj.getTime())
    return copy
  }

  // Handle Array
  if (isArray(obj) && level >= 0) {
    const copy = []
    for (let i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i], removeKeys, level - 1)
    }
    return copy
  }

  // Handle Object
  if (typeof obj === "object" && level >= 0) {
    try {
      const copy: any = {}
      for (const attr in obj) {
        if (typeof obj[attr] === "function") {
          continue
        }
        if (removeKeys.indexOf(attr) !== -1) {
          continue
        }

        if (obj.hasOwnProperty(attr)) {
          copy[attr] = clone(obj[attr], removeKeys, level - 1)
        }
      }
      return copy
    } catch (e) {
      console.error(e)
    }
  }
  return obj
}
function isArray(obj: any) {
  if (typeof Array.isArray === "function") {
    return Array.isArray(obj)
  } else {
    return Object.prototype.toString.call(obj) === "[object Array]"
  }
}
function isDate(obj: any) {
  return typeof obj === "object" && obj.constructor === Date
}
