/**
 * 全局过滤器
 *
 * @copyright 火星科技 mars3d.cn
 * @author 胡椒 2022-04-11
 */
import dayjs from "dayjs"
import { App } from "vue"

export default function install(app: App) {
  app.config.globalProperties.$filters = {
    timeFilter(time: Date, format = "YYYY-MM-DD HH:mm:ss") {
      return dayjs(time).format(format)
    }
  }
}
