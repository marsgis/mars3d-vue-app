<template>
  <van-popup class="mars-popup" :position="globalConfig.position" :style="globalConfig.style" v-bind="attrs">
    <template v-for="(comp, name) in slots" :key="name" v-slot:[name]>
      <component :is="comp" />
    </template>
  </van-popup>
</template>
<script lang="ts">
import { useAttrs, useSlots, defineComponent } from "vue"
import { getConfig } from "../index"

export default defineComponent({
  name: "mars-popup",
  inheritAttrs: false,
  setup() {
    const attrs = useAttrs()
    const slots = useSlots()
    const CONFIG = getConfig()
    // console.log(attrs)
    let globalConfig: Record<string, any> = {}
    if (CONFIG.popup) {
      const popProps: Record<string, any> = {}
      globalConfig = CONFIG.popup
      if (globalConfig.position === "right") {
        popProps.style = {
          width: "80%",
          height: "100%"
        }
      } else if (globalConfig.position === "bottom") {
        popProps.style = {
          width: "100%",
          height: "50%"
        }
      }
      globalConfig = {
        ...popProps,
        ...globalConfig
      }
      // console.log(globalConfig)
    }
    return {
      attrs,
      slots,
      globalConfig
    }
  }
})
</script>
<style lang="less">
.mars-popup {
  &.van-popup--right {
    max-width: 300px;
  }
}
</style>
