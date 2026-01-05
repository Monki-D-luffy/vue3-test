// src/stores/studioStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { DataPoint } from '@/types/studio';

export const useStudioStore = defineStore('studio', () => {
    // --- State ---
    const dps = ref<DataPoint[]>([]);
    const currentPid = ref<string>('');
    const isLoading = ref(false);
    const isDirty = ref(false); // 标记是否有未保存更改

    // --- Getters ---
    // 按照 ID 排序，标准功能在前
    const sortedDps = computed(() => {
        return [...dps.value].sort((a, b) => {
            if (a.isStandard !== b.isStandard) return a.isStandard ? -1 : 1;
            return a.id - b.id;
        });
    });

    // --- Actions ---

    // 1. 初始化：模拟从后端加载 DP 数据
    const initStudio = async (pid: string) => {
        currentPid.value = pid;
        isLoading.value = true;

        // Mock: 模拟网络请求延迟
        await new Promise(resolve => setTimeout(resolve, 600));

        // Mock: 默认加载一些标准 DP
        if (dps.value.length === 0) {
            dps.value = [
                {
                    id: 1, code: 'switch_led', name: '开关', type: 'Boolean', mode: 'rw', isStandard: true,
                    property: {}
                },
                {
                    id: 2, code: 'work_mode', name: '工作模式', type: 'Enum', mode: 'rw', isStandard: true,
                    property: { range: ['auto', 'sleep', 'strong'] }
                }
            ];
        }

        isLoading.value = false;
        isDirty.value = false;
    };

    // 2. 添加/更新 DP
    const upsertDp = (dp: DataPoint) => {
        const index = dps.value.findIndex(item => item.id === dp.id);
        if (index > -1) {
            dps.value[index] = dp; // 更新
        } else {
            dps.value.push(dp); // 新增
        }
        isDirty.value = true;
    };

    // 3. 删除 DP
    const removeDp = (id: number) => {
        dps.value = dps.value.filter(dp => dp.id !== id);
        isDirty.value = true;
    };

    // 4. 保存到后端 (Mock)
    const saveChanges = async () => {
        isLoading.value = true;
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log('[Studio] Saved DPs:', dps.value);
        isDirty.value = false;
        isLoading.value = false;
        return true; // 保存成功
    };

    return {
        dps,
        sortedDps,
        isLoading,
        isDirty,
        initStudio,
        upsertDp,
        removeDp,
        saveChanges
    };
});