import request from '@/api/core/request'
// 确保引用项目全局定义的 Product 类型 (通常在 src/types/index.ts 或 src/types/product.ts)
import type { Product } from '@/types'

// 1. 定义后端原始 DTO (Data Transfer Object)
// 定义后端原始 DTO (Data Transfer Object)
interface ProductDto {
    // 兼容后端可能返回的两种格式
    productId?: string;
    ProductId?: string;

    productName?: string;
    ProductName?: string;

    productType?: string;
    ProductType?: string;

    productKey?: string;
    ProductKey?: string;

    description?: string;
    Description?: string;
}
// 定义查询参数结构
interface ProductQueryParams {
    pageIndex: number;
    pageSize: number;
    productName?: string;
    productType?: string;
}

/**
 * 获取产品列表 (适配层)
 * ✅ 功能：调用后端 -> 提取 Data -> 字段清洗(Map) -> 返回标准 Product[]
 */
export const fetchProducts = async (params?: any): Promise<Product[]> => {
    const payload: ProductQueryParams = {
        pageIndex: params?.pageIndex || 1,
        pageSize: Math.min(params?.pageSize || 20, 20),
        productName: params?.keyword || undefined
    }

    try {
        // 1. 发起请求
        const res: any = await request.post('/api/Product/GetProducts', payload)

        // 2. 🛡️ 拆解数据包
        // 根据你的日志: {code: 200, data: Array(2), success: true}
        // 我们优先取 res.data
        let rawList: ProductDto[] = [];
        if (Array.isArray(res?.data)) {
            rawList = res.data;
        } else if (Array.isArray(res?.Data)) {
            rawList = res.Data;
        } else if (Array.isArray(res)) {
            rawList = res;
        }

        console.log('📦 Product Raw List:', rawList); // 调试日志：看看原始字段到底是啥

        // 3. 🧼 数据清洗 (兼容大小写)
        return rawList.map(item => ({
            // 优先取小驼峰 (productId)，没有再取大驼峰 (ProductId)
            id: item.productId || item.ProductId || '',
            name: item.productName || item.ProductName || '未命名产品',
            type: item.productType || item.ProductType || 'Normal',
            productKey: item.productKey || item.ProductKey || '',

            nodeType: 0,
            status: 'online',
            description: item.description || item.Description || ''
        })) as Product[]

    } catch (error) {
        console.error('❌ 获取产品列表失败:', error);
        return [];
    }
}

/**
 * 获取产品详情
 */
export const fetchProductDetail = (productId: string) => {
    return request.post('/manager/api/Product/GetProductInfoByProductId', null, {
        params: { productId }
    })
}

/**
 * 获取产品统计概览
 */
export const fetchProductStats = () => {
    // 假设这个接口返回的是标准小驼峰，如果不是，也需要在这里做适配
    return request.get<{
        total: number;
        development: number;
        released: number;
        alert: number;
        totalActiveDevices: number;
    }>('/products/stats/summary');
};

/**
 * 更新产品信息
 */
export const updateProduct = (pid: string, data: Record<string, any>) => {
    return request.put(`/products/${pid}`, data);
};