/**
 * 组件中开启 map.ts 生命周期
 * @copyright mars3d.cn
 * @author 火星渣渣灰 2022-02-19
 */
import { inject, onBeforeMount, onBeforeUnmount } from "vue"

export default function useLifecycle(mapWork: any): void {
  const getMapInstance = inject<(() => any) | undefined>("getMapInstance")
  onBeforeMount(() => {
    if (mapWork.onMounted && getMapInstance) {
      const map = getMapInstance()
      if (map) {
        mapWork.onMounted(map)
      }
    }
  })
  onBeforeUnmount(() => {
    if (mapWork.onUnmounted) {
      mapWork.onUnmounted()
    }
  })
}
