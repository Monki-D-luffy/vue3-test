// src/router/modules/product.ts
import type { RouteRecordRaw } from 'vue-router';

const productRoutes: RouteRecordRaw = {
    path: '/products',
    redirect: { name: 'ProductList' }, // 默认跳转列表
    children: [
        // 1. 产品列表 (入口)
        {
            path: '',
            name: 'ProductList',
            component: () => import('@/views/product/ProductManagement.vue'),
            meta: { title: '产品管理' }
        },
        // 2. 创建向导
        {
            path: 'create',
            name: 'ProductCreate',
            component: () => import('@/views/product/ProductCreateWizard.vue'),
            meta: { title: '创建新产品' }
        },
        // 3. 产品详情工作台 (Context Mode)
        {
            path: ':pid',
            component: () => import('@/views/product/layout/ProductDetailLayout.vue'),
            redirect: { name: 'ProductOverview' },
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
                    meta: { title: '设置' }
                }
            ]
        }
    ]
};

export default productRoutes;