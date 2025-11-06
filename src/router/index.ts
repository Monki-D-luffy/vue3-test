import { createRouter, createWebHistory } from 'vue-router'

// 导入创建的组件
import DebugSelect from '../views/DebugSelect.vue'  // 导入调试选择页组件
import LoginView from '../views/Login.vue'          // 导入登录页组件
import AppLayout from '@/layouts/AppLayout.vue'     // 导入布局
import DeviceDashboard from '@/views/DeviceDashboard.vue' // 导入设备看板组件
import DeviceDetails from '@/views/DeviceDetails.vue'     // 导入设备详情

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
      children: [
        {
          // 当访问 /dashboard 时，
          // 在 AppLayout 的 <RouterView> 中渲染 DeviceDashboard
          path: '', // path 为空，表示这是 /dashboard 的默认子路由
          name: 'dashboard-list',
          component: DeviceDashboard
        },
        {
          // 当访问 /dashboard/details/:id 时，
          // 在 AppLayout 的 <RouterView> 中渲染 DeviceDetails
          path: 'details/:id', // 注意这里没有开头的 '/'
          name: 'device-details',
          component: DeviceDetails,
          props: true // 允许组件通过 props 接收路由参数 (:id)
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
