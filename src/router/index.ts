import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

// 导入创建的组件
import DeviceManager from '@/views/DeviceManager.vue'
import DeviceDashboard from '@/views/DeviceDashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },

    // 添加新路由
    {
      path: '/devices', // 访问的 URL
      name: 'devices',  // 路由的名字
      component: DeviceManager // 对应的组件
    },
    {
      path: '/dashboard', // 这是新页面的 URL
      name: 'dashboard',
      component: DeviceDashboard
    },
  ],
})

export default router
