<template>
  <mars-pannel customClass="layer-shortcut" :visible="true" :position="props.position">
    <div class="home-handle-item" @click="showLayerPop">
      <div class="thumbnail"></div>
    </div>
  </mars-pannel>
  <mars-popup v-model:show="layersShow">
    <p class="layers-title">底图切换</p>
    <ul class="basemap">
      <li v-for="(item, i) in baseMaps" :key="i" class="basemap-card" :class="{ 'active-card': active === item.id }"
        @click="changeBaseMaps(item)">
        <div><img class="icon" :src="`${item.options.icon || 'img/basemaps/bingAerial.png'}`" /></div>
        <div>{{ item.name }}</div>
      </li>
    </ul>
    <mars-cell center title="是否显示地形">
      <template #right-icon>
        <mars-switch v-model="chkHasTerrain" @change="changeTerrain" />
      </template>
    </mars-cell>
    <template v-for="layerGroup in layerData" :key="layerGroup.id">
      <template v-if="layerGroup.children && layerGroup.children.length > 0">
        <p class="layers-title">{{ layerGroup.title }}</p>
        <template v-for="layer in layerGroup.children" :key="layer.id">
          <mars-cell center :title="layer.title">
            <template #right-icon>
              <mars-switch v-model="layer.show" @change="checkedChange(layer)" />
            </template>
          </mars-cell>
        </template>
      </template>
    </template>
  </mars-popup>
</template>

<script lang="ts" setup>
import { ref, markRaw, onUnmounted, reactive, nextTick } from "vue"
import useLifecycle from "@mars/common/uses/use-lifecycle"
import * as mapWork from "./map"

useLifecycle(mapWork)

interface PositionProp {
  left?: number | string
  right?: number | string
  top?: number | string
  bottom?: number | string
}

interface Props {
  position?: PositionProp
}

const props = withDefaults(defineProps<Props>(), {
  position: () => ({
    top: "70",
    right: "10"
  })
})

const layersShow = ref(false)

const showLayerPop = () => {
  layersShow.value = true
}

const baseMaps = ref<any[]>([])

const active = ref("")

const chkHasTerrain = ref(false)

mapWork.eventTarget.on("mapLoaded", initData)

onUnmounted(() => {
  mapWork.eventTarget.off("mapLoaded", initData)
})

function initData(e: any) {
  baseMaps.value = e.baseMaps.map((m: any) => {
    if (m.isAdded && m.show) {
      active.value = m.id
    }
    return {
      name: m.name,
      id: m.id,
      options: markRaw(m.options)
    }
  })

  chkHasTerrain.value = e.hasTerrain || false

  // 初始化图层
  initLayers()
}

function changeBaseMaps(item: any) {
  mapWork.changeBaseMaps((active.value = item.id))
}

function changeTerrain() {
  mapWork.changeTerrain(chkHasTerrain.value)
}

const layerData = ref<any[]>([])
const opacityObj = ref<{ id: number }>({} as any)
function initLayers() {
  const showIds = [] // 是显示状态的图层id集合
  const openIds = [] // 展开的树节点id集合（如果不想展开，对应图层配置open:false）

  const result = mapWork.getLayrsTree({
    basemaps: false, // 是否取config.json中的basempas
    filter: function (layer) {
      if (!layer.name) {
        return false // 未命名图层不在管理器展示
      }
      return true
    },
    forEach: function (item, layer) {
      item.key = item.id // 树控件api需要的唯一标识
      item.title = item.name || `未命名(${layer.type})` // 树控件api需要的显示文本字段

      item.hasZIndex = layer.hasZIndex // 当前vue绑定使用的属性
      item.hasOpacity = layer.hasOpacity

      // 记录在item中，会导致卡顿
      opacityObj.value[item.id] = layer.opacity ?? 1
      if (item.show) {
        showIds.push(item.id)
      }
      if (item.group && item.open !== false) {
        openIds.push(item.id)
      }
    }
  })

  // 赋予树控件
  layerData.value = result.tree
}

function checkedChange(item: any) {
  const layer = mapWork.getLayerByAttr(item?.key, "id")

  mapWork.updateLayerShow(layer, item.show)

  setTimeout(() => {
    // 单独处理下平台标绘的图片问题
    if (layer.id === 303011) {
      layer.eachGraphic((graphic) => {
        const image = graphic.style.image
        if (image && graphic.style.image.startsWith("/img/")) {
          const img = image.replace("/img/", "img/")
          graphic.setStyle({
            image: img
          })
        }
        const image2 = graphic.style.image2
        if (image2 && graphic.style.image2.startsWith("/img/")) {
          const img = image2.replace("/img/", "img/")
          graphic.setStyle({
            image2: img
          })
        }
      })
    }
    // 单独处理下高德实时路况的代理情况，在手机apk状态下不需要代理
    if (layer.name === "高德实时路况" && process.env.mode === "app") {
      layer.setOptions({ proxy: "" })
    }
  }, 500)
}

</script>

<style scoped lang="less">
.layer-shortcut {
  padding: 8px;

  .thumbnail {
    width: 24px;
    height: 24px;
    overflow: hidden;
    background-image: url("/src/assets/images/menu_top_icon.png");
    background-repeat: no-repeat;
    background-size: 100% 200%;
  }
}

.layers-title {
  width: 100%;
  height: 30px;
  line-height: 30px;
  background: var(--mars-bg-light);
  font-size: 14px;
  color: var(--mars-text-color-secondary);
  box-sizing: border-box;
  padding-left: 10px;
}

.basemap {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
}

.basemap-card {
  width: 30%;
  list-style-type: none;
  text-align: center;
  margin-top: 10px;
  margin-left: 5px;
  cursor: pointer;
  font-size: 12px;
  color: var(--mars-text-color-secondary);

  &:hover {
    .active-card();
  }

  .icon {
    border: 2px solid var(--mars-white);
    width: 70px;
    height: 55px;
  }
}

.active-card {
  color: var(--mars-primary) !important;

  .icon {
    border-color: var(--mars-primary);
  }
}
</style>
