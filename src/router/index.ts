import { createRouter, createWebHistory } from 'vue-router'

// 导入创建的组件
import DebugSelect from '../views/DebugSelect.vue'  // 导入调试选择页组件
import LoginView from '../views/Login.vue'          // 导入登录页组件
import AppLayout from '@/layouts/AppLayout.vue'     // 导入布局

import DeviceDashboard from '@/views/DeviceDashboard.vue' // 导入设备看板组件
import DeviceDetails from '@/views/DeviceDetails.vue'     // 导入设备详情
import Overview from '@/views/Overview.vue'               // 导入概览组件 
import ProductManagement from '@/views/ProductManagement.vue' // 导入产品管理组件
import SystemManagement from '@/views/SystemManagement.vue'   // 导入系统管理组件

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LoginView,
    },
    {
      // 不能删除登录页路由,后面的导航守卫需要用到
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/dashboard',
      component: AppLayout, // 父路由使用 AppLayout 布局
      meta: { requiresAuth: true }, // (可选, 但推荐) 标记这个路由需要登录
      // 重定向：访问 /dashboard 时，自动转到 /dashboard/overview
      redirect: '/dashboard/overview',
      children: [
        {
          // 概览页 (我们的新 "首页")
          path: 'overview',
          name: 'overview',
          component: Overview
        },
        {
          // 设备管理页 (我们之前做的)
          path: 'devices', // 把原来的 path: '' 改成 'devices'
          name: 'device-list', // 把 'dashboard-list' 改成 'device-list'
          component: DeviceDashboard
        },
        {
          // 产品管理页
          path: 'products',
          name: 'product-list',
          component: ProductManagement
        },
        {
          // 系统管理页
          path: 'system',
          name: 'system-management',
          component: SystemManagement
        }
      ]
    },
    {
      path: '/debug',
      name: 'debug',
      component: DebugSelect
    }
  ],
})

// --- 全局导航守卫 (重要：控制访问权限) ---
router.beforeEach((to, from, next) => {
  // 1. 从“口袋”(localStorage) 里检查有没有“门票”(token)
  const token = localStorage.getItem('authToken');

  // 2. 逻辑判断
  if (!token && to.path !== '/login') {
    // ----------------------------------------------------
    // 情况A：您没有门票 ( !token )，
    // 并且 您想去的还不是登录页 ( to.path !== '/login' )
    // ----------------------------------------------------

    // 把您“踢”回登录页
    console.log('导航守卫：未登录，跳转到 /login');
    next('/login');

  } else if (token && to.path === '/login') {
    // ----------------------------------------------------
    // 情况B：您有门票 ( token )，
    // 并且 您还想去登录页 ( to.path === '/login' )
    // ----------------------------------------------------

    // 没必要，直接把您“送”回主看板
    console.log('导航守卫：已登录，跳转到 /dashboard');
    next('/dashboard');

  } else {
    // ----------------------------------------------------
    // 情况C：
    // 1. 您没有门票，但您去的就是登录页 (允许)
    // 2. 您有门票，您去的也不是登录页 (允许)
    // ----------------------------------------------------

    // 正常放行
    next();
  }
});
export default router
