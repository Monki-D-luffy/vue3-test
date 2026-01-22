// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

// 1. 统一使用 @ 别名导入布局，保持风格一致
import AppLayout from '@/layouts/AppLayout.vue'
import productRoutes from './modules/product'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login', // 规范：PascalCase
      // 规范：统一使用 @/views 别名，取代相对路径 ../
      component: () => import('@/views/Login.vue')
    },

    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      // 访问根目录重定向到 Overview
      redirect: { name: 'Overview' },

      children: [
        {
          path: 'overview',
          name: 'Overview', // 规范：PascalCase
          component: () => import('@/views/dashboard/ExpOverview.vue')
        },
        {
          path: 'devices',
          name: 'DeviceList', // 规范：PascalCase (原 devices-list)
          component: () => import('@/views/device/DeviceList.vue'),
          meta: { title: '设备页' }
        },
        {
          path: 'devices/log',
          name: 'DeviceLog', // 规范：PascalCase (原 device-log)
          component: () => import('@/views/device/DeviceLog.vue')
        },
        // {
        //   path: 'products',
        //   name: 'ProductManagement', // 规范：与组件文件名保持一致 (原 product-list)
        //   component: () => import('@/views/product/ProductManagement.vue')
        // },
        productRoutes,
        {
          path: 'system',
          name: 'SystemManagement', // 规范：PascalCase
          component: () => import('@/views/system/SystemManagement.vue')
        },
        {
          path: 'firmware',
          name: 'FirmwareManagement',
          component: () => import('@/views/product/FirmwareManagement.vue'),
          meta: {
            title: '固件管理',
            requiresAuth: true
          }
        },
        {
          path: 'ota-test',
          name: 'OTATest',
          component: () => import('@/views/ota/OTATest.vue'),
          meta: { title: 'OTA 测试台', requiresAuth: true }
        },
        {
          path: 'serial',
          name: 'SerialTerminal',
          component: () => import('@/views/experiment/SerialTerminal.vue'),
          meta: { title: '串口终端 (Lab)' }
        },
      ]
    },
    // 404 页面
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    },
  ],
})

// --- 导航守卫 ---
router.beforeEach((to, from, next) => {
  // 关键点：Key 必须与 authStore/request.ts 中的保持一致！
  const token = localStorage.getItem('authToken')

  // 如果去往 "非登录页" 且 "没有 Token"
  if (to.path !== '/login' && !token) {
    console.warn(`[Router] 🛑 拦截跳转: ${to.path} (未检测到 authToken)`)
    next('/login')
  }
  // 如果去往 "登录页" 且 "已有 Token" -> 自动跳回首页
  else if (to.path === '/login' && token) {
    console.log(`[Router] 🔄 已登录，重定向到首页`)
    next('/')
  }
  else {
    next()
  }
})

export default router