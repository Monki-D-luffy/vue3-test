// src/ai/core/useAiContext.ts
import { ref, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import type { AiContext } from '../types';

// 全局单例：存储当前页面主动提供的上下文获取函数
const activePageContextGetter = ref<(() => Promise<any>) | null>(null);

export function useAiContext() {
    const route = useRoute();
    const authStore = useAuthStore();

    // 本地标记：记录当前组件实例是否设置了 Context
    let myGetter: (() => Promise<any>) | null = null;

    // ✅ 关键修复：在 useAiContext 被调用时（setup 阶段）同步注册销毁钩子
    onUnmounted(() => {
        // 只有当全局 Context 是我自己设置的时候，才清理它
        // 防止清理了其他新页面注册的 Context
        if (activePageContextGetter.value === myGetter) {
            activePageContextGetter.value = null;
        }
    });

    /**
     * 【提供者】页面组件调用此方法注册数据源
     * 支持在 await 之后调用
     */
    const setPageContext = (getter: () => Promise<any>) => {
        myGetter = getter; // 标记所有权
        activePageContextGetter.value = getter; // 更新全局状态
    };

    /**
     * 【消费者】AI 组件调用此方法获取完整上下文
     */
    const getGlobalContext = async (): Promise<AiContext> => {
        // 1. 身份与环境信息
        const operatorProfile = {
            name: authStore.userInfo?.nickname || authStore.userInfo?.username || 'Guest',
            role: 'Administrator', // 可根据实际角色字段修改
            id: authStore.userInfo?.id || 'unknown'
        };

        const baseContext = {
            timestamp: new Date().toLocaleString(),
            environment: import.meta.env.MODE,
            operator: operatorProfile,
            currentPage: {
                path: route.path,
                name: String(route.name || 'Unknown'),
                meta: route.meta
            }
        };

        // 2. 获取页面级动态数据
        let pageData = {};
        if (activePageContextGetter.value) {
            try {
                pageData = await activePageContextGetter.value();
            } catch (e) {
                console.warn('AI Context Error:', e);
                pageData = { error: 'Failed to retrieve page data' };
            }
        } else {
            pageData = { note: 'No specific page context registered.' };
        }

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