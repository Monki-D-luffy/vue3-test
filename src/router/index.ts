// 路由文件
import { createRouter, createWebHistory } from 'vue-router'

// 2. 导入所有布局和页面
import AppLayout from '@/layouts/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      // 懒加载 LoginView (路径不变)
      component: () => import('../views/Login.vue')
    },

    // 3. AppLayout 作为根路由 '/' 的组件 
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      // 访问根目录时，重定向到 /overview (我们的新首页)
      redirect: '/overview',

      // 所有的页面现在都是 AppLayout 的子路由
      children: [
        {
          path: 'overview', // 匹配 /overview
          name: 'overview',
          // 懒加载 Overview (路径不变)
          component: () => import('@/views/Overview.vue')
        },
        {
          path: 'devices', // 匹配 /devices
          name: 'device-list',
          // ✨ (关键修改) 路径已更新
          component: () => import('@/views/device/DeviceDashboard.vue')
        },
        {
          path: 'devices/log', // 匹配 /devices/log
          name: 'device-log',
          // ✨ (关键修改) 路径已更新
          component: () => import('@/views/device/DeviceLog.vue')
        },
        {
          path: 'products', // 匹配 /products
          name: 'product-list',
          // ✨ (关键修改) 路径已更新
          component: () => import('@/views/product/ProductManagement.vue')
        },
        {
          path: 'firmware',
          name: 'firmware',
          component: () => import('@/views/product/FirmwareManagement.vue')
        },
        {
          path: 'system', // 匹配 /system
          name: 'system-management',
          // ✨ (关键修改) 路径已更新
          component: () => import('@/views/system/SystemManagement.vue')
        }
      ]
    },

  ],
})

// --- 导航守卫 ---
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('authToken');
  const isAuthRoute = to.matched.some(record => record.meta.requiresAuth)

  if (isAuthRoute && !token) {
    console.log('导航守卫：未登录，跳转到 /login');
    next('/login');
  } else if (token && to.path === '/login') {
    // 5. 登录后跳转到新的 '首页'
    console.log('导航守卫：已登录，跳转到 /overview');
    next('/overview'); // <-- 从 /dashboard 改为 /overview
  } else {
    next();
  }
});

export default router