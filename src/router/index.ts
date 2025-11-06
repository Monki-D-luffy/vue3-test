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
      // 懒加载 LoginView
      component: () => import('../views/Login.vue')
    },

    // 3. ▼▼▼ 核心修改：AppLayout 作为根路由 '/' 的组件 ▼▼▼
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
          // 懒加载 Overview
          component: () => import('@/views/Overview.vue')
        },
        {
          path: 'devices', // 匹配 /devices (这就是你的设备列表页)
          name: 'device-list',
          component: () => import('@/views/DeviceDashboard.vue')
        },
        {
          path: 'products', // 匹配 /products
          name: 'product-list',
          component: () => import('@/views/ProductManagement.vue')
        },
        {
          path: 'system', // 匹配 /system
          name: 'system-management',
          component: () => import('@/views/SystemManagement.vue')
        }
      ]
    },
    // ▲▲▲ 修改结束 ▲▲▲

    // 4. 你已删除 Debug 页面，我们也把路由删掉
    /*
    {
      path: '/debug',
      name: 'debug',
      component: DebugSelect
    }
    */
  ],
})

// --- 导航守卫 (同步修改) ---
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