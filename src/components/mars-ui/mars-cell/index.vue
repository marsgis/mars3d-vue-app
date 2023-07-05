<template>
  <van-cell class="mars-cell" center v-bind="attrs">
    <template v-for="(comp, name) in slots" :key="name" v-slot:[name]>
      <component :is="comp" />
    </template>
  </van-cell>
</template>
<script lang="ts">
import { useAttrs, useSlots, defineComponent } from "vue"
export default defineComponent({
  name: "mars-cell",
  inheritAttrs: false,
  setup() {
    const attrs = useAttrs()
    const slots = useSlots()
    return {
      attrs,
      slots
    }
  }
})
</script>
<style lang="less">
.mars-cell.van-cell {
  align-items: center;
  .mars-icon {
    margin-right: 5px;
  }
  .van-cell__title {
    font-size: 12px;
    font-family: PingFang SC;
    font-weight: 500;
    color: #19212f;
  }
  .van-cell__value {
    font-size: 12px;
    font-family: DIN;
    font-weight: 500;
    color: #19212f;
  }
}
</style>
