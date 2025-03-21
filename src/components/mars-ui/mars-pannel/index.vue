<template>
  <div class="pannel-box" :class="[customClass, animationClass]" ref="pannelBox" v-show="mergeProps.visible">
    <div class="pannel-content">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * pannel面板
 * @copyright 火星科技 mars3d.cn
 * @author 火星渣渣灰 2022-02-19
 */
import { onMounted, ref, computed } from "vue"
import { getConfig } from "../index"

const CONFIG = getConfig()
let globalConfig: Record<string, any> = {}
if (CONFIG.pannel) {
  globalConfig = CONFIG.pannel
}

interface Position {
  left?: number | string // 定位 left值
  right?: number | string // 定位right值
  top?: number | string // 定位top值
  bottom?: number | string // 定位bottom值
}

interface Props {
  warpper?: string // 容器id 默认是app，将作为定位的参照元素，一般不需要修改
  visible?: boolean // 是否显示
  animation?: boolean | string // 开场动画 false 或 class

  width?: number | string // 初始宽度
  height?: number | string // 初始高度
  left?: number | string // 定位 left值
  right?: number | string // 定位right值
  position?: Position

  top?: number | string // 定位top值
  bottom?: number | string // 定位bottom值
  zIndex?: number // 层级
  customClass?: string // 自定义class
  beforeClose?: () => Promise<any> | boolean | void
}
const props = withDefaults(defineProps<Props>(), {
  warpper: "app",
  visible: false,
  animation: true,
  zIndex: 999
})

const mergeProps = computed(() => {
  const newProps: Props = {}

  for (const k in props) {
    if (props[k] === undefined) {
      newProps[k] = globalConfig[k]
    } else {
      newProps[k] = props[k]
    }
  }

  if (newProps.position) {
    newProps.left = newProps.position.left
    newProps.right = newProps.position.right
    newProps.top = newProps.position.top
    newProps.bottom = newProps.position.bottom
  }
  return newProps
})

const animationClass = computed(() => {
  if (props.animation === false) {
    return ""
  }
  if (typeof props.animation === "string") {
    return props.animation
  }
  const right = getCssNumber(mergeProps.value.right)
  if (right && right >= 0 && right < 100) {
    return "fadein-right"
  }
  const left = getCssNumber(mergeProps.value.left)
  if (left || (left >= 0 && left < 100)) {
    return "fadein-left"
  }
  const top = getCssNumber(mergeProps.value.top)
  if (left || (top >= 0 && top < 100)) {
    return "fadein-down"
  }
  const bottom = getCssNumber(mergeProps.value.bottom)
  if (bottom || (bottom >= 0 && bottom < 100)) {
    return "fadein-up"
  }
  return "fadein-center"
})

function getCssNumber(value: number | string) {
  if (typeof value === "number") {
    return value
  }
  if (typeof value === "string") {
    if (/^[0-9]*$/.test(value)) {
      return Number(value)
    }
    if (value.endsWith("px")) {
      value = value.replace("px", "")
      return Number(value)
    }
  }
  return null
}

onMounted(() => {
  initPosition()
  initSize()
})

const pannelBox = ref()

// 初始化位置
function initPosition() {
  const pannelStyle = pannelBox.value.style
  // 层级位置
  pannelStyle.zIndex = mergeProps.value.zIndex
  // 横向位置初始化
  if (mergeProps.value.left !== undefined) {
    pannelStyle.left = antoUnit(mergeProps.value.left)
  } else if (mergeProps.value.right !== undefined) {
    pannelStyle.right = antoUnit(mergeProps.value.right)
    pannelStyle.left = "initial"
  }
  // 纵向位置初始化
  if (mergeProps.value.top !== undefined) {
    pannelStyle.top = antoUnit(mergeProps.value.top)
  }
  if (mergeProps.value.bottom !== undefined) {
    pannelStyle.bottom = antoUnit(mergeProps.value.bottom)
  }
}

// 初始化大小
function initSize() {
  const pannelStyle = pannelBox.value.style
  if (mergeProps.value.width) {
    pannelStyle.width = antoUnit(mergeProps.value.width)
  }
  if (!mergeProps.value.top || !mergeProps.value.bottom) {
    if (mergeProps.value.height) {
      pannelStyle.height = antoUnit(mergeProps.value.height)
    }
  }
}

// 处理传入的单位问题
function antoUnit(value: number | string) {
  if (typeof value === "number" || (typeof value === "string" && /^[0-9]*$/.test(value))) {
    return `${value}px`
  } else {
    return value
  }
}
</script>
<script lang="ts">
export default {
  name: "mars-pannel"
}
</script>

<style lang="less" scoped>
.pannel-box {
  position: absolute;
  padding: 4px 4px;
  border-radius: 4px;
  z-index: 1000;
  background-color: #fff;
  box-sizing: border-box;

  .pannel-content {
    overflow-y: auto;
    width: 100%;
    height: 100%;
  }
}

/**下面是 5个 动画 */
@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translate3d(100%, 0, 0);
  }

  to {
    opacity: 1;
    transform: none;
  }
}
.fadein-right {
  -webkit-animation-duration: 1s;
  animation-duration: 1s;
  -webkit-animation-fill-mode: both;
  animation-fill-mode: both;
  -webkit-animation-name: fadeInRight;
  animation-name: fadeInRight;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translate3d(-100%, 0, 0);
  }

  to {
    opacity: 1;
    transform: none;
  }
}
.fadein-left {
  -webkit-animation-duration: 1s;
  animation-duration: 1s;
  -webkit-animation-fill-mode: both;
  animation-fill-mode: both;
  -webkit-animation-name: fadeInLeft;
  animation-name: fadeInLeft;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    -webkit-transform: translate3d(0, 100%, 0);
    transform: translate3d(0, 100%, 0);
  }

  to {
    opacity: 1;
    -webkit-transform: none;
    transform: none;
  }
}

.fadein-up {
  -webkit-animation-duration: 1s;
  animation-duration: 1s;
  -webkit-animation-fill-mode: both;
  animation-fill-mode: both;
  -webkit-animation-name: fadeInUp;
  animation-name: fadeInUp;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    -webkit-transform: translate3d(0, -100%, 0);
    transform: translate3d(0, -100%, 0);
  }

  to {
    opacity: 1;
    -webkit-transform: none;
    transform: none;
  }
}
.fadein-down {
  -webkit-animation-duration: 1s;
  animation-duration: 1s;
  -webkit-animation-fill-mode: both;
  animation-fill-mode: both;
  -webkit-animation-name: fadeInDown;
  animation-name: fadeInDown;
}

@keyframes fadeInCenter {
  from {
    opacity: 0;
    transform: scale(0.1);
  }

  to {
    opacity: 1;
    transform: none;
  }
}
.fadein-center {
  -webkit-animation-duration: 1s;
  animation-duration: 1s;
  -webkit-animation-fill-mode: both;
  animation-fill-mode: both;
  -webkit-animation-name: fadeInCenter;
  animation-name: fadeInCenter;
}
</style>
