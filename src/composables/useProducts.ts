// src/composables/useProducts.ts
import { ref } from 'vue'
import { fetchProducts as fetchProductsApi } from '@/api/modules/product'
import type { Product } from '@/types'

// 简单的缓存（可选），如果产品列表不常变，可以避免每次切换页面都请求
// const globalProductCache = ref<Product[]>([]) 

export function useProducts() {
    const products = ref<Product[]>([])
    const loading = ref(false)

    const fetchProducts = async () => {
        loading.value = true
        try {
            // 假设 fetchProductsApi 返回的是 Product[]
            // 如果你的 API 也是分页的，这里需要根据实际情况调整
            const res = await fetchProductsApi()
            products.value = Array.isArray(res) ? res : []
        } catch (error) {
            console.error('Failed to fetch products:', error)
            products.value = []
        } finally {
            loading.value = false
        }
    }

    /**
     * 辅助函数：通过 ID 获取产品名称
     * 在表格渲染或导出数据时非常有用
     */
    const getProductName = (id: string): string => {
        const product = products.value.find(p => p.id === id)
        return product ? product.name : '未知产品'
    }

    return {
        products,
        loading,
        fetchProducts,
        getProductName
    }
}