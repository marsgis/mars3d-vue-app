import type { RouteRecordRaw } from "vue-router"
import { createRouter, createWebHashHistory } from "vue-router"
import { globalStore } from "@mars/common/store/global"

const routes: RouteRecordRaw[] = [
  { name: "home", path: "/", component: () => import("@mars/views/home/index.vue") }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from) => {
  if (globalStore.state.loginRedirect && globalStore.state.loginRedirect !== from.fullPath) {
    globalStore.commit("updateLoginRedirect", null)
  }
  return true
})
