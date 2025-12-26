// src/composables/useAiContext.ts
import { ref, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
// ✅ 引入 Auth Store 获取当前登录用户信息
import { useAuthStore } from '@/stores/authStore';

// 全局状态：存储当前活动页面的数据获取函数
const activePageContextGetter = ref<(() => Promise<any>) | null>(null);

export function useAiContext() {
    const route = useRoute();
    const authStore = useAuthStore();

    /**
     * 【提供者调用】
     * 页面组件调用此方法，注册自己的数据源
     */
    const setPageContext = (getter: () => Promise<any>) => {
        activePageContextGetter.value = getter;
        
        // 自动清理逻辑
        onUnmounted(() => {
            if (activePageContextGetter.value === getter) {
                activePageContextGetter.value = null;
            }
        });
    };

    /**
     * 【消费者调用】
     * AI 组件调用此方法，聚合“身份信息”、“路由信息”和“页面数据”
     */
    const getGlobalContext = async () => {
        // 1. 获取当前操作员画像 (Operator Profile)
        const operatorProfile = {
            name: authStore.userInfo?.nickname || authStore.userInfo?.username || 'Guest',
            role: 'Administrator', // 这里可以根据 authStore.userInfo.roles 动态获取
            id: authStore.userInfo?.id || 'unknown'
        };

        // 2. 基础路由上下文
        const baseContext = {
            timestamp: new Date().toLocaleString(),
            environment: import.meta.env.MODE, // 'development' or 'production'
            operator: operatorProfile, // 👈 AI 现在知道你在跟谁说话了
            currentPage: {
                path: route.path,
                name: String(route.name || 'Unknown'),
                meta: route.meta
            }
        };

        // 3. 尝试获取页面级详细上下文 (Page Context)
        let pageData = {};
        if (activePageContextGetter.value) {
            try {
                pageData = await activePageContextGetter.value();
            } catch (e) {
                console.warn('AI Context Error: Failed to get page data', e);
                pageData = { error: 'Failed to retrieve page data' };
            }
        } else {
            pageData = { note: 'No specific page context registered.' };
        }

        // 4. 合并返回
        return {
            system: baseContext,
            activeView: pageData
        };
    };

    return {
        setPageContext,
        getGlobalContext
    };
}