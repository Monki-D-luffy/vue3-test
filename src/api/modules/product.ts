import request from '@/utils/request'
import type { Product } from '@/types'

// 获取产品列表
export const fetchProducts = async (): Promise<Product[]> => {
    // 泛型请求：假设后端返回 { data: Product[], code: 200 ... } 或直接返回数组
    // 这里使用 any 稍微宽容一点，适配不同的 request 封装
    const res = await request.get<any, any>('/products')

    // 兼容逻辑：如果是数组直接返回，如果是对象取 data
    return Array.isArray(res) ? res : (res.data || [])
}