import "mars3d-cesium/Build/Cesium/Widgets/widgets.css"
import "mars3d/mars3d.css"
import "@mars/common/style/index.less"

import { createApp } from "vue"
import Application from "./App.vue"
import { globalStore, key as globalKey } from "@mars/common/store/global"
import MarsUIInstall from "@mars/components/mars-ui"
import filter from "@mars/utils/filter-util"
import Vant from "vant"
import "vant/lib/index.css"

import { router } from "@mars/routes"
// import VConsole from "vconsole"

// if (process.env.mode === "development") {
//   const vConsole = new VConsole({ theme: "dark" })
// }

const app = createApp(Application)

app.use(router)
app.use(Vant)

app.use(globalStore, globalKey)
app.use(filter)

MarsUIInstall(app, {
  popup: {
    position: "right"
  }
})

app.mount("#app")
