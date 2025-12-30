// src/stores/productContext.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ProductDetail } from '@/types/product';

export const useProductContext = defineStore('productContext', () => {
    const currentProduct = ref<ProductDetail | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // MOCK: 模拟获取详情
    async function initContext(pid: string) {
        if (currentProduct.value?.id === pid) return;

        loading.value = true;
        error.value = null;
        try {
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 600));

            // Mock Data
            currentProduct.value = {
                id: pid,
                name: pid === '101' ? '智能温湿度传感器 Pro' : 'AI 视觉边缘网关',
                category: pid === '101' ? 'SENSOR' : 'GATEWAY',
                protocol: pid === '101' ? 'BLE' : 'WIFI',
                status: 'DEVELOPMENT',
                activeDeviceCount: pid === '101' ? 1240 : 56,
                alertCount: 0,
                description: '高性能工业级采集设备，支持 BLE Mesh 组网与远程 OTA。',
                createTime: Date.now() - 10000000,
                lastUpdateTime: Date.now(),
                updateTime: Date.now(),
                currentFirmwareVersion: 'v2.0.1'
            } as ProductDetail; // 强制断言以匹配 mock

        } catch (err: any) {
            error.value = err.message || 'Failed to load product';
        } finally {
            loading.value = false;
        }
    }

    function clearContext() {
        currentProduct.value = null;
        error.value = null;
    }

    return { currentProduct, loading, error, initContext, clearContext };
});