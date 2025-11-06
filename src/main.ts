
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// EL1. 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// EL2. 从 element-plus 导入中文语言包 ▼▼▼
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// EL3. 注册 Element Plus
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
