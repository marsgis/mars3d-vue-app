import * as mars3d from "mars3d"

let map: mars3d.Map = null

// 事件对象，用于抛出事件给vue
export const eventTarget = new mars3d.BaseClass()

// 初始化当前业务
export function onMounted(mapInstance: mars3d.Map) {
  map = mapInstance

  const baseMaps = map.getBasemaps(true)

  const hasTerrain = map.hasTerrain

  eventTarget.fire("mapLoaded", { baseMaps, hasTerrain })
}

// 释放当前业务
export function onUnmounted(): void {
  map = null
}

export function changeBaseMaps(id: string) {
  map.basemap = id
}

export function changeTerrain(value: boolean) {
  map.hasTerrain = value
}

// 获取图层数据
export function getLayrsTree(params) {
  return map.getLayrsTree(params)
}

export function getLayerByAttr(attrValue: string | number, attrName?: string) {
  return map.getLayerByAttr(attrValue, attrName)
}


// 更新图层勾选状态
export function updateLayerShow(layer, show) {
  if (show) {
    if (!layer.isAdded) {
      map.addLayer(layer)
    }
    layer.show = true

    layer.flyTo() // 如果不想勾选定位，注释该行
  } else {
    layer.show = false
  }
}
