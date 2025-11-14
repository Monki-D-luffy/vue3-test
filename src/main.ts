
import './assets/main.css'
// 引入页面布局通用样式
import './assets/page-layouts.css'
// 引入 Element Plus 暗黑变量
import 'element-plus/theme-chalk/dark/css-vars.css'

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
