<template>
  <mars-pannel customClass="layer-shortcut" :visible="true" :position="props.position">
    <div class="home-handle-item" @click="showLayerPop">
      <div class="thumbnail"></div>
    </div>
  </mars-pannel>
  <mars-popup v-model:show="layersShow">
    <p class="layers-title">底图切换</p>
    <ul class="basemap">
      <li v-for="(item, i) in baseMaps" :key="i" class="basemap-card" :class="{ 'active-card': active === item.id }" @click="changeBaseMaps(item)">
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
    bottom: "30",
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

const opacityObj: any = reactive({})
const layersObj: any = {}

const layerData = ref<any[]>([])
function initLayers() {
  const layers = mapWork.getLayers()
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i] // 创建图层

    if (!layer._hasMapInit && layer.pid === -1 && layer.id !== 99) {
      layer.pid = 99 // 示例中创建的图层都放到99分组下面
    }

    if (layer && layer.pid === -1) {
      const node: any = reactive({
        index: i,
        title: layer.name || `未命名(${layer.type})`,
        key: layer.id,
        id: layer.id,
        pId: layer.pid,
        hasZIndex: layer.hasZIndex,
        hasOpacity: layer.hasOpacity,
        opacity: 100 * (layer.opacity || 0)
      })
      if (layer.hasOpacity) {
        opacityObj[layer.id] = 100 * (layer.opacity || 0)
      }
      node.children = findChild(node, layers)
      layerData.value.push(node)
    }
  }

  console.log("图层数据", layerData.value)
}
function findChild(parent: any, list: any[]) {
  return list
    .filter((item: any) => item.pid === parent.id)
    .reverse()
    .map((item: any, i: number) => {
      const node: any = {
        index: i,
        title: item.name || `未命名(${item.type})`,
        key: item.id,
        id: item.id,
        pId: item.pid,
        hasZIndex: item.hasZIndex,
        hasOpacity: item.hasOpacity,
        opacity: 100 * (item.opacity || 0),
        parent: parent,
        show: item.isAdded && item.show
      }

      if (item.hasOpacity) {
        opacityObj[item.id] = 100 * (item.opacity || 0)
      }
      layersObj[item.id] = item
      node.children = findChild(node, list)

      return node
    })
}

function checkedChange(item: any) {
  if (item?.children.length > 0) {
    item.children.forEach((element) => {
      const layer = layersObj[element.id]
      addLayers(item, layer)
    })
  } else {
    const layer = layersObj[item.id]
    addLayers(item, layer)
  }
}

function addLayers(item, layer) {
  if (layer) {
    if (!layer.isAdded) {
      mapWork.addLayer(layer)
    }
    if (item.show) {
      layer.show = true
      layer.readyPromise.then(function (layer) {
        layer.flyTo()
      })
    } else {
      layer.show = false
    }
  }
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
  background: #f4f4f4;
  font-size: 14px;
  color: #555;
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
  color: #555;
  &:hover {
    .active-card();
  }
  .icon {
    border: 2px solid #fff;
    width: 70px;
    height: 55px;
  }
}

.active-card {
  color: #337fe5 !important;
  .icon {
    border-color: #337fe5;
  }
}
</style>
