<!--
  地图渲染组件 (建议使用mars3d地图的地方都用该组件)
  @copyright 火星科技 mars3d.cn
  @author 木遥 2024-12-03
-->
<template>
  <div :id="withKeyId" class="mars3d-container"></div>
</template>
<script setup lang="ts">
import { computed, onUnmounted, onMounted, toRaw } from "vue"
import { $message } from "@mars/components/mars-ui/index"
import { getQueryString } from "@mars/utils/mars-util"
import * as mars3d from "mars3d"

const $alert = alert
// const $message = alert

const props = withDefaults(
  defineProps<{
    mapKey?: string // 多个地图时,可传入key区分地图
    url?: string // 传入的地图构造参数url，可为空，只传options
    options?: any // 传入的地图构造参数options，可覆盖url内的参数
  }>(),
  {
    mapKey: "default",
    url: undefined,
    options: undefined
  }
)

// 用于存放地球组件实例
let map: mars3d.Map // 地图对象

// 使用用户传入的 mapKey 拼接生成 withKeyId 作为当前显示容器的id
const withKeyId = computed(() => `mars3d-container-${props.mapKey}`)

// onload事件将在地图渲染后触发
const emit = defineEmits(["onload"])

const initMars3d = async () => {
  // 获取配置
  let mapOptions
  if (props.url) {
    // 存在url时才读取
    mapOptions = await mars3d.Util.fetchJson({ url: props.url })
  }

  if (props.options) {
    // 存在叠加的属性时
    let exOptions
    if (props.options.then) {
      exOptions = toRaw(await props.options)
    } else {
      exOptions = toRaw(props.options)
    }

    if (mapOptions) {
      mapOptions = mars3d.Util.merge(mapOptions, exOptions) // 合并配置
    } else {
      mapOptions = exOptions
    }
  }
  // logInfo("地图构造参数", mapOptions)

  map = new mars3d.Map(withKeyId.value, mapOptions)

  // 二三维切换不用动画
  if (map.viewer.sceneModePicker) {
    map.viewer.sceneModePicker.viewModel.duration = 0.0
  }

  // webgl渲染失败后，刷新页面
  // map.on(mars3d.EventType.renderError, async () => {
  //   await $alert("程序内存消耗过大，请重启浏览器")
  //   window.location.reload()
  // })

  onMapLoad() // map构造完成后的一些处理

  emit("onload", map)
}

// map构造完成后的一些处理，可以按需注释和选用
function onMapLoad() {
  // Mars3D地图内部使用，如右键菜单弹窗
  // @ts-ignore
  window.globalAlert = $alert
  // @ts-ignore
  window.globalMsg = $message

  // 用于 config.json 中 西藏垭口 图层的详情按钮 演示
  // @ts-ignore
  window.showPopupDetails = (item: any) => {
    $alert(item.NAME)
  }

  // 【测试】 用于 config.json中配置的图层，绑定额外方法和参数
  const tiles3dLayer = map.getLayerById(204012) // 上海市区
  if (tiles3dLayer) {
    tiles3dLayer.options.onSetOpacity = function (opacity: number) {
      tiles3dLayer.style = {
        color: {
          conditions: [
            ["${floor} >= 200", "rgba(45, 0, 75," + 0.5 * opacity + ")"],
            ["${floor} >= 100", "rgba(170, 162, 204," + opacity + ")"],
            ["${floor} >= 50", "rgba(224, 226, 238," + opacity + ")"],
            ["${floor} >= 25", "rgba(252, 230, 200," + opacity + ")"],
            ["${floor} >= 10", "rgba(248, 176, 87," + opacity + ")"],
            ["${floor} >= 5", "rgba(198, 106, 11," + opacity + ")"],
            ["true", "rgba(127, 59, 8," + opacity + ")"]
          ]
        }
      }
    }
  }
}


onMounted(() => {
  initMars3d()
})

// 组件卸载之前销毁mars3d实例
onUnmounted(() => {
  if (map) {
    map.destroy()
    map = null
  }
  // logInfo("map销毁完成", map)
})
</script>

<style lang="less">
</style>
