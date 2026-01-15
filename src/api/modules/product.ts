// src/api/modules/product.ts
import request from '@/api/core/request';
import type { ProductDetail, ProductListItem, ProductQueryParams } from '@/types/product';

// 获取产品列表 (支持搜索、筛选、分页)
export const fetchProducts = (params?: ProductQueryParams) => {
    return request.get<{ items: ProductListItem[]; total: number }>('/products', {
        params: {
            ...params,
            _sort: 'createTime',
            _order: 'desc'
        }
    });
};

// 获取单个产品详情
export const fetchProductDetail = (pid: string) => {
    return request.get<ProductDetail>(`/products/${pid}`);
};

// 获取产品统计概览 (调用 mock-server 的自定义聚合接口)
export const fetchProductStats = () => {
    return request.get<{
        total: number;
        development: number;
        released: number;
        alert: number;
        totalActiveDevices: number;
    }>('/products/stats/summary');
};

// 更新产品信息 (用于保存草稿、发布产品)
// 支持 Partial<ProductDetail>，即只更新部分字段
export const updateProduct = (pid: string, data: Partial<ProductDetail> & Record<string, any>) => {
    return request.patch(`/products/${pid}`, data);
};