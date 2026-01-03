import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useStudioStore = defineStore('studio', () => {
    // --- State ---
    const activeStep = ref(0)
    const isLoading = ref(false)

    // 步骤定义的路由映射 (确保路由名称与此匹配)
    const steps = [
        { title: '功能定义', routeName: 'ProductFunction', path: 'function' },
        { title: '面板设计', routeName: 'ProductPanel', path: 'panel' },
        { title: '硬件开发', routeName: 'ProductHardware', path: 'hardware' },
        { title: '产品配置', routeName: 'ProductConfig', path: 'config' },
        { title: '测试发布', routeName: 'ProductTest', path: 'test' }
    ]

    // --- Actions ---
    function setStep(index: number) {
        if (index >= 0 && index < steps.length) {
            activeStep.value = index
        }
    }

    function setLoading(loading: boolean) {
        isLoading.value = loading
    }

    // 根据路由名称自动同步步骤 (在 Layout 中调用)
    function syncStepByRouteName(name: string) {
        const index = steps.findIndex(s => s.routeName === name)
        if (index !== -1) {
            activeStep.value = index
        }
    }

    return {
        activeStep,
        isLoading,
        steps,
        setStep,
        setLoading,
        syncStepByRouteName
    }
})