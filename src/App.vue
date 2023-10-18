<template>
  <main-view />
</template>

<script setup lang="ts">
import MainView from "@mars/components/mars-work/main-view.vue"
import { useGlobalStore } from "@mars/common/store/global"

const { store: globalStore } = useGlobalStore()


globalStore.dispatch("getUserInfo")
</script>

<style lang="less" scoped></style>
