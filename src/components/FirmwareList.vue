<template>
    <div class="content-card" style="height: 100%;">
        <div class="card-header">
            <span>固件列表</span>
            <slot name="header-actions"></slot>
        </div>

        <div class="scrollable-list" v-loading="isLoading">
            <div v-if="firmwares.length === 0" class="empty-state">
                <el-empty description="暂无固件数据" :image-size="80" />
            </div>

            <div v-else v-for="(item, index) in firmwares" :key="item.id" class="list-item"
                :class="{ active: activeIndex === index }" @click="handleSelect(index, item)">
                <div class="list-item-icon">
                    <el-icon>
                        <CollectionTag />
                    </el-icon>
                </div>

                <div class="list-item-content">
                    <div class="list-item-title">
                        <span>{{ item.version }}</span>
                        <el-tag size="small" effect="light" round :type="getFirmwareVerifiedStatus(item.verified).type">
                            {{ getFirmwareVerifiedStatus(item.verified).label }}
                        </el-tag>
                    </div>
                    <div class="list-item-subtitle">
                        <span>{{ item.productName }}</span>
                        <span class="dot-separator">●</span>
                        <span>{{ formatDateTime(item.uploadedAt) }}</span>
                    </div>
                </div>

                <div class="item-arrow">
                    <el-icon>
                        <ArrowRight />
                    </el-icon>
                </div>
            </div>
        </div>

        <div class="pagination-footer">
            <AppPagination :total="pagination.total" :page="pagination._page" :limit="pagination._limit"
                layout="prev, pager, next" @page-change="onPageChange" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'
import { CollectionTag, ArrowRight } from '@element-plus/icons-vue'
import type { Firmware, PaginationParams } from '@/types/index' // 请确保 PaginationParams 在 types 里定义了，或者用 any
import AppPagination from '@/components/AppPagination.vue'
import { formatDateTime, getFirmwareVerifiedStatus } from '@/utils/formatters'

const props = defineProps({
    firmwares: {
        type: Array as PropType<Firmware[]>,
        required: true,
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
    },
    pagination: {
        type: Object as PropType<{ _page: number; _limit: number; total: number }>,
        required: true
    },
    // ✨ 新增：控制选中状态
    activeIndex: {
        type: Number,
        default: 0
    }
})

const emit = defineEmits(['page-change', 'select'])

const onPageChange = (newPage: number) => {
    emit('page-change', newPage)
}

const handleSelect = (index: number, item: Firmware) => {
    emit('select', { index, item })
}
</script>

<style scoped>
/* 复用了 page-layouts.css 中的 .content-card, .list-item 等样式 
  这里只写当前组件特有的微调 
*/

.card-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f2f5;
    font-weight: 600;
    color: #303133;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.dot-separator {
    margin: 0 8px;
    color: #dcdfe6;
    font-size: 12px;
}

.item-arrow {
    color: #c0c4cc;
}

.pagination-footer {
    border-top: 1px solid #f0f2f5;
    padding: 8px 16px;
    display: flex;
    justify-content: center;
}
</style>