declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $filters: {
      timeFilter: (time: Date, format?: string) => string
    }
  }
}

export {}
