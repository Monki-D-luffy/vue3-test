<template>
    <div class="product-detail-layout h-full flex flex-col bg-[var(--bg-canvas)]">
        <header
            class="bg-[var(--bg-card)] border-b border-[var(--border-base)] px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">

            <div class="flex items-center gap-4">
                <el-button link @click="goBack" class="!text-[var(--text-regular)] hover:!text-[var(--text-primary)]">
                    <el-icon class="mr-1">
                        <ArrowLeft />
                    </el-icon> 返回
                </el-button>

                <el-divider direction="vertical" class="!h-5 !border-[var(--border-base)]" />

                <div v-if="productStore.loading" class="flex items-center gap-3 animate-pulse">
                    <div class="w-8 h-8 bg-[var(--border-base)] rounded-lg"></div>
                    <div class="w-32 h-6 bg-[var(--border-base)] rounded"></div>
                </div>

                <div v-else class="flex items-center gap-3 animate-fade-in">
                    <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <el-icon :size="18">
                            <Cpu />
                        </el-icon>
                    </div>

                    <div class="flex flex-col justify-center leading-none gap-1.5">
                        <div class="flex items-center gap-2">
                            <h1 class="text-sm font-bold text-[var(--text-primary)]">{{
                                productStore.currentProduct?.name || 'Loading...' }}</h1>
                            <el-tag size="small" effect="plain" round :type="statusType">
                                {{ productStore.currentProduct?.status }}
                            </el-tag>
                        </div>
                        <span class="text-[10px] text-[var(--text-secondary)] font-mono tracking-wide">
                            PID: {{ productStore.currentProduct?.id }}
                        </span>
                    </div>
                </div>
            </div>

            <nav class="flex gap-1 bg-[var(--bg-canvas)] p-1 rounded-lg">
                <router-link v-for="tab in tabs" :key="tab.route"
                    :to="{ name: tab.route, params: { pid: route.params.pid } }" custom v-slot="{ navigate, isActive }">
                    <button @click="navigate"
                        class="px-5 py-1.5 text-xs font-medium rounded-md transition-all duration-200" :class="isActive
                            ? 'bg-[var(--bg-card)] text-primary shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]/50'">
                        {{ tab.label }}
                    </button>
                </router-link>
            </nav>

            <div class="flex items-center gap-3">
                <el-button circle size="small" @click="handleRefresh">
                    <el-icon>
                        <Refresh />
                    </el-icon>
                </el-button>
                <el-button type="primary" size="small" plain>
                    <el-icon class="mr-1">
                        <Monitor />
                    </el-icon> 调试终端
                </el-button>
            </div>
        </header>

        <main class="flex-1 overflow-hidden relative">
            <router-view v-slot="{ Component }">
                <transition name="fade-slide" mode="out-in">
                    <component :is="Component" :key="route.fullPath" />
                </transition>
            </router-view>
        </main>
    </div>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProductContext } from '@/stores/productContext';
import { ArrowLeft, Cpu, Refresh, Monitor } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const productStore = useProductContext();

const tabs = [
    { label: '概览仪表盘', route: 'ProductOverview' },
    { label: '功能定义', route: 'ProductDevelop' },
    { label: '固件 OTA', route: 'ProductFirmware' },
    { label: '设置', route: 'ProductSettings' },
];

const statusType = computed(() => {
    const status = productStore.currentProduct?.status;
    if (status === 'RELEASED') return 'success';
    if (status === 'TESTING') return 'warning';
    return 'info';
});

// Auto-Load Context
watch(
    () => route.params.pid as string,
    (newPid) => {
        if (newPid) productStore.initContext(newPid);
    },
    { immediate: true }
);

onUnmounted(() => {
    productStore.clearContext();
});

const goBack = () => router.push({ name: 'ProductManagement' });
const handleRefresh = () => {
    if (route.params.pid) productStore.initContext(route.params.pid as string);
};
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from {
    opacity: 0;
    transform: translateY(4px);
}

.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>