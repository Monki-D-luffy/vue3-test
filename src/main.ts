// 1. 在最顶上添加这一行，来启用 MOCK API
//    我们只希望它在开发环境下运行，所以加一个判断
// if (import.meta.env.DEV) {
//   import('./mock')
// }
import './mock/index.ts'

import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 1. 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 2. 注册 Element Plus
app.use(ElementPlus)

app.mount('#app')
