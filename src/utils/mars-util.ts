/**
 * 项目内通用 静态Util方法
 *
 * @copyright mars3d.cn
 * @author 木遥 2022-01-01
 */
import * as mars3d from "mars3d"
import dayjs from "dayjs"

/**
 * 判断是否 "经度,纬度" 字符串值
 *
 * @export
 * @param {string} text 传入的字符串
 * @return {boolean} 是否 经度,纬度
 */
export function isLonLat(text: string): boolean {
  const reg = /^-?((0|1?[0-7]?[0-9]?)(([.][0-9]*)?)|180(([.][0]*)?)),-?((0|[1-8]?[0-9]?)(([.][0-9]*)?)|90(([.][0]*)?))$/
  return reg.test(text)
}

/**
 * 设置自动高度值
 * @param {function} callback 窗口大小变化时的回调,返回当前计算完成的高度
 * @param {number} [lose=0] 窗口高度基础上减少的值
 * @param {string} [container="sanbox-warpper"] 窗口id
 * @return {function} 返回清理函数，组件卸载时必须调用，否则会泄漏 resize 监听
 */
export function setAutoHeight(callback: (v: number) => void, lose = 0, container = "sanbox-warpper"): () => void {
  const wapper = document.getElementById(container) || document.body

  let wapperHeight = wapper?.clientHeight || 0
  const result = wapperHeight - lose
  callback(result)

  const resize = () => {
    wapperHeight = wapper?.clientHeight || 0
    const resizeHeight = wapperHeight - lose
    callback(resizeHeight)
  }

  window.addEventListener("resize", resize)

  resize()
  // 返回清理函数，调用方需要在 onUnmounted 中执行，防止内存泄漏
  return () => {
    window.removeEventListener("resize", resize)
  }
}

/**
 *  获取URL参数
 *
 * @export
 * @param {string} parameter url值
 * @return {string | null}  参数值
 */
export function getQueryString(parameter: string): string | null {
  return new URL(window.location.href).searchParams.get(parameter)
}

/**
 * 打开高德地图
 * 起点和终点内皆包含 {lng，lat，addr}  经度，纬度，名称
 * @export
 * @param {*} endPositions 终点信息
 * @param {*} startPositions 起点信息
 */
export function openGaode(endPositions: any, startPositions: any = null, routeType?:string) {
  // 标准无偏坐标（WGS84） 转为 国测局坐标 否则mars3d的与高得的会有所偏差
  const endPoints = mars3d.PointTrans.wgs2gcj([endPositions.lng, endPositions.lat])
  const startPoints = startPositions ? mars3d.PointTrans.wgs2gcj([startPositions.lng, startPositions.lat]) : null

  let url = `http://uri.amap.com/marker?position=${endPoints[0]},${endPoints[1]}&name=${endPositions.addr}&coordinate=gaode&callnative=1`
  if (startPoints) {
    url = `http://m.amap.com/navigation/${routeType}/saddr=${startPoints[0]},${startPoints[1]},${startPositions.name}&daddr=${endPoints[0]},${endPoints[1]},${endPositions.name}&saddr_poiid=${startPositions.key}&saddr_typecode=${startPositions.type}`
  }

  if (window.plus) {
    window.plus.runtime.openURL(url)
  } else {
    location.assign(url)
  }
}

/**
 *  日期过滤
 *
 * @export
 * @param {any} array    传入数组
 * @param {string} key   示例: "info.date.update"
 * @param {string} time  time示例: "1d" "2m"
 * @return {any | null}  返回过滤后的数组
 */
export function fieldTime(array: any, key: string, time: string): any | null {
  let cutTime: any

  switch (true) {
    case time.includes("h"):
      cutTime = parseInt(time.split("h")[0])
      break

    case time.includes("d"):
      cutTime = parseInt(time.split("d")[0]) * 24
      break

    case time.includes("w"):
      cutTime = parseInt(time.split("w")[0]) * 24 * 7
      break

    case time.includes("m"):
      cutTime = parseInt(time.split("m")[0]) * 24 * 30
      break

    case time.includes("y"):
      cutTime = parseInt(time.split("y")[0]) * 24 * 365
      break
  }

  const keyArray = key.split(".")

  return array.filter((item: any) => {
    let x = item
    for (let i = 0; i <= keyArray.length - 1; i++) {
      // 可选链：键路径缺失的脏数据不中断整个过滤
      x = x?.[keyArray[i]]
    }

    // 无时间戳的脏数据不满足"最近 N 时间内"（dayjs(undefined) 会返回当前时间，需显式排除）
    if (x == null) {
      return false
    }

    // 解决IOS不兼容时间格式(2019-09-02 8:00:00)
    // const formartTime = x?.replace(/-/g, "/")

    // let formartTime = x?.replace(/-|T|Z/g, function (matchStr) {
    //   const tokenMap = {
    //     "-": "/",
    //     T: " ",
    //     Z: ""
    //   }

    //   return tokenMap[matchStr]
    // })
    const formartTime = dayjs(x).format("YYYY/MM/DD HH:mm:ss") // 格式化时间

    return (new Date().getTime() - new Date(formartTime).getTime()) / 3600000 <= cutTime
  })
}

/**
 *  字段排序
 *
 * @export
 * @param {any} array       传入数组
 * @param {string} key      示例: "info.date.updatetime"
 * @param {boolean} order   正倒序
 * @return {any | null}     返回排序后的数组
 */
export function sortByKey(array: any, key: string, order: boolean): any | null {
  const keyArray = key.split(".")

  return array.sort(function (a, b) {
    let x = a
    let y = b
    for (let i = 0; i <= keyArray.length - 1; i++) {
      // 可选链：键路径缺失的脏数据不使排序崩溃
      x = x?.[keyArray[i]]
      y = y?.[keyArray[i]]
    }

    let result: any
    if (!isNaN(Date.parse(x)) && isNaN(x)) {
      result = order ? new Date(y).getTime() - new Date(x).getTime() : new Date(x).getTime() - new Date(y).getTime()
    } else {
      result = order ? y - x : x - y
    }

    return result
  })
}

/**
 *  手机号校验
 *
 * @export
 * @param {string} phone
 * @return {boolean}  是否通过校验
 */
export function checkPhone(phone: string): boolean {
  return /^1[3|4|5|7|8|9][0-9]{9}$/.test(phone)
}

/**
 *  密码校验
 *
 * @export
 * @param {string} password
 * @return {boolean}  请输入6位以上的密码
 */
export function checkPassword(password: string): boolean {
  return /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,30}$/.test(password)
}

/**
 *  邮箱校验
 *
 * @export
 * @param {string} email
 * @return {boolean}  是否通过邮箱校验
 */
export function checkEmail(email: string): boolean {
  return /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(email)
}

/**
 *  用户名校验
 *
 * @export
 * @param {string} name
 * @return {boolean}  是否通过1-8位用户名校验
 */
export function checkName(name: string): boolean {
  return /^[\u4E00-\u9FA5\uF900-\uFA2D|\w]{1,8}$/.test(name)
}

/**
 *  验证码校验
 *
 * @export
 * @param {string} code
 * @return {boolean}  是否通过4位数验证码校验
 */
export function checkCode(code: string): boolean {
  return /^[0-9]{4}$/.test(code)
}


// @ts-ignore 需要开启时请F12控制台执行：window.devProject()
window.devProject = function (open = true) {
  localStorage.setItem("project-debugger", open ? "1" : "0")
}

// 是否打印开发日志
const hasWriteLog = localStorage.getItem("project-debugger") === "1"
mars3d.Log.hasInfo(hasWriteLog)

// 打印普通日志信息,方便开发调试
export function logInfo(...sources) {
  if (!hasWriteLog) {
    return
  }

  // eslint-disable-next-line no-console
  console.log("%c %s", "padding: 2px 1px; border-radius: 3px 0 0 3px; color: #fff; background: rgba(17, 106, 48, 0.85);", ...sources)
}

// 打印警告日志信息,方便开发调试
export function logWarn(...sources) {
  if (!hasWriteLog) {
    return
  }

  // eslint-disable-next-line no-console
  console.log(
    "%c %s",
    "padding: 2px 1px; border-radius: 0 3px 3px 0; color: #fff; background: rgba(181, 27, 29, 0.8); font-weight: bold;",
    ...sources
  )
}

export const aloneTypeStyle = {
  fixedRoute: [["clockLoop"], "label", "billboard", "point", "model", "circle", "coneTrack", "path", "polyline", "wall"],
  route: [["clockLoop"], "label", "billboard", "point", "model", "circle", "coneTrack", "path", "polyline", "wall"],
  satellite: [["tle1", "tle2"], "model", "label", "billboard", "point", "path"]
}
