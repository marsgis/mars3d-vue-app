<template>
  <div class="mars-main-view" id="mars-main-view">
    <div id="centerDiv" class="centerDiv-container">
      <mars-map :url="configUrl" @onload="marsOnload" />
    </div>
    <router-view v-if="loaded"></router-view>
  </div>
</template>

<script setup lang="ts">
/**
 * 渲染主入口
 * @copyright 火星科技 mars3d.cn
 * @author 火星渣渣灰 2022-02-19
 */
import { provide, ref } from "vue"
import MarsMap from "@mars/components/mars-work/mars-map.vue"

const configUrl = `${process.env.BASE_URL}config/config.json?time=${new Date().getTime()}`

let mapInstance: any = null
provide("getMapInstance", () => {
  return mapInstance
})

const emit = defineEmits(["mapLoaded"])

const loaded = ref(false)
const marsOnload = (map: any) => {
  console.log("map构造完成", map)
  mapInstance = map
  emit("mapLoaded", mapInstance)
  loaded.value = true
}
</script>

<style lang="less" scoped>
.mars-main-view {
  height: 100%;
  width: 100%;
  position: relative;
}
.centerDiv-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>
