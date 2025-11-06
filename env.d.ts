// env.d.ts (或者可能是 src/env.d.ts，具体看你项目结构)

/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
declare module 'element-plus/dist/locale/zh-cn.mjs';