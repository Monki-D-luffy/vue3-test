// src/router/modules/product.ts
import type { RouteRecordRaw } from 'vue-router';

const productRoutes: RouteRecordRaw = {
    path: '/products',
    redirect: { name: 'ProductManagement' }, // 修复：统一重定向名称
    children: [
        // 1. 产品列表 (入口)
        {
            path: '',
            name: 'ProductManagement',
            component: () => import('@/views/product/ProductManagement.vue'),
            meta: { title: '产品管理' }
        },
        // 2. 创建向导
        {
            path: 'create',
            name: 'ProductCreate',
            component: () => import('@/views/product/ProductCreateWizard.vue'),
            meta: { title: '创建新产品', activeMenu: 'ProductManagement' }
        },
        // 3. Studio 开发工作台 (新架构)
        {
            path: ':pid/studio',
            component: () => import('@/layouts/StudioLayout.vue'),
            redirect: { name: 'ProductFunction' },
            meta: {
                activeMenu: 'ProductManagement',
                requiresAuth: true,
                isFullScreen: true, // ✅ 核心标记：告诉 AppLayout "请消失"
            },
            children: [
                {
                    path: 'function',
                    name: 'ProductFunction',
                    component: () => import('@/views/studio/ProductFunction.vue'),
                    meta: { title: '1. 功能定义', step: 0 }
                },
                {
                    path: 'panel',
                    name: 'ProductPanel',
                    component: () => import('@/views/studio/ProductPanel.vue'),
                    meta: { title: '2. 面板设计', step: 1 }
                },
                {
                    path: 'hardware',
                    name: 'ProductHardware',
                    component: () => import('@/views/studio/ProductHardware.vue'),
                    meta: { title: '3. 硬件开发', step: 2 }
                },
                {
                    path: 'config',
                    name: 'ProductConfig',
                    component: () => import('@/views/studio/ProductConfig.vue'),
                    meta: { title: '4. 产品配置', step: 3 }
                },
                {
                    path: 'test',
                    name: 'ProductTest',
                    component: () => import('@/views/studio/ProductTest.vue'),
                    meta: { title: '5. 测试发布', step: 4 }
                }
            ]
        },
        // 4. 产品详情工作台 (原有架构，保持兼容)
        {
            path: ':pid',
            component: () => import('@/views/product/layout/ProductDetailLayout.vue'),
            redirect: { name: 'ProductOverview' },
            meta: { activeMenu: 'ProductManagement' },
            children: [
                {
                    path: 'overview',
                    name: 'ProductOverview',
                    component: () => import('@/views/product/detail/ProductOverview.vue'),
                    meta: { title: '产品概览' }
                },
                {
                    path: 'develop',
                    name: 'ProductDevelop',
                    component: () => import('@/views/product/detail/ProductDevelop.vue'),
                    meta: { title: '功能定义' }
                },
                {
                    path: 'firmware',
                    name: 'ProductFirmware',
                    component: () => import('@/views/product/detail/ProductFirmware.vue'),
                    meta: { title: '固件管理' }
                },
                {
                    path: 'settings',
                    name: 'ProductSettings',
                    component: () => import('@/views/product/detail/ProductSettings.vue'),
                    meta: { title: '产品设置' }
                }
            ]
        }
    ]
};

export default productRoutes;