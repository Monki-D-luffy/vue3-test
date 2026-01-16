import request from '@/api/core/request'
import type { ProductDetail } from '@/types/product'

// 定义产品接口类型
interface ProductQueryParams {
    pageIndex: number;
    pageSize: number;
    productName?: string;
    productType?: string;
}

/**
 * 获取产品列表 (真实后端)
 * 对应文档: /manager/api/Product/GetProducts
 */
export const fetchProducts = (params?: any) => {
    const payload: ProductQueryParams = {
        pageIndex: params?.pageIndex || 1,
        // 后端限制 pageSize 最大 20
        pageSize: Math.min(params?.pageSize || 20, 20),
        productName: params?.keyword || undefined
    }

    return request.post('/api/Product/GetProducts', payload)
}

/**
 * 获取产品详情
 * ✨ Fix: 使用 post 请求（后端要求），并正确使用 imported ProductDetail 类型（如果需要泛型支持）
 * 这里 request.post 的泛型取决于 request.ts 的定义，通常不需要显式传入 <ProductDetail> 除非你想强制转换返回类型
 */
export const fetchProductDetail = (productId: string) => {
    // 假设后端接口路径为 GetProductInfoByProductId，且接受 productId 作为 query 参数
    return request.post<ProductDetail>('/manager/api/Product/GetProductInfoByProductId', null, {
        params: { productId }
    })
}

// 保持其他原有方法，或者根据需要逐步替换

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
    return request.put(`/products/${pid}`, data);
};