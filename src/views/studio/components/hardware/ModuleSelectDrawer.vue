<template>
    <el-drawer v-model="visible" title="选择硬件模组" direction="rtl" size="400px" :before-close="handleClose"
        class="studio-drawer">
        <div class="drawer-content">
            <div class="filter-area">
                <el-input v-model="searchKey" placeholder="搜索芯片型号..." prefix-icon="Search" clearable
                    class="tech-input" />
                <div class="chip-tags">
                    <span v-for="arch in ['全部', 'RISC-V', 'Xtensa']" :key="arch" class="filter-tag"
                        :class="{ active: filterArch === arch }" @click="filterArch = arch">
                        {{ arch }}
                    </span>
                </div>
            </div>

            <el-scrollbar class="module-list-scroll">
                <div class="module-grid">
                    <div v-for="mod in filteredModules" :key="mod.id" class="module-card"
                        :class="{ 'is-active': store.selectedModuleId === mod.id }" @click="handleSelect(mod.id)">
                        <div class="card-visual">
                            <el-icon :size="24">
                                <Cpu />
                            </el-icon>
                        </div>
                        <div class="card-info">
                            <div class="name-row">
                                <span class="name">{{ mod.name }}</span>
                                <el-tag v-if="mod.recommended" type="warning" size="small" effect="dark"
                                    class="rec-tag">推荐</el-tag>
                            </div>
                            <div class="meta">{{ mod.vendor }} • {{ mod.architecture }}</div>
                            <div class="specs">
                                <span>{{ mod.flashSize }}MB Flash</span>
                                <span class="divider">|</span>
                                <span>{{ mod.ramSize }}KB RAM</span>
                            </div>
                            <div class="card-actions">
                                <el-link v-if="mod.datasheetUrl" :href="mod.datasheetUrl" target="_blank" type="info"
                                    :underline="false" @click.stop>
                                    <el-icon class="mr-1">
                                        <Document />
                                    </el-icon> 规格书
                                </el-link>
                            </div>
                        </div>
                        <div class="check-mark" v-if="store.selectedModuleId === mod.id">
                            <el-icon><Select /></el-icon>
                        </div>
                    </div>
                </div>
            </el-scrollbar>

            <div class="drawer-footer">
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" class="black-gold-btn" @click="confirmSelection">
                    确认选择
                </el-button>
            </div>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStudioStore } from '@/stores/studioStore';
import { Search, Cpu, Select, Document } from '@element-plus/icons-vue';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue', 'change']);

const store = useStudioStore();
const searchKey = ref('');
const filterArch = ref('全部');

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const filteredModules = computed(() => {
    return store.availableModules.filter(m => {
        const matchSearch = m.name.toLowerCase().includes(searchKey.value.toLowerCase());
        const matchArch = filterArch.value === '全部' || m.architecture === filterArch.value;
        return matchSearch && matchArch;
    });
});

const handleSelect = (id: string) => {
    store.selectModule(id);
};

const handleClose = () => {
    visible.value = false;
};

const confirmSelection = () => {
    visible.value = false;
    emit('change');
};
</script>

<style scoped lang="scss">
/* 保持原有样式不变 */
.drawer-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.filter-area {
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;

    .chip-tags {
        margin-top: 12px;
        display: flex;
        gap: 8px;

        .filter-tag {
            font-size: 12px;
            padding: 4px 12px;
            border-radius: 12px;
            background: #f5f7fa;
            color: #606266;
            cursor: pointer;
            transition: all 0.2s;

            &.active {
                background: #1a1a1a;
                color: #d4a72c;
            }
        }
    }
}

.module-list-scroll {
    flex: 1;
    padding: 16px 0;
}

.module-card {
    display: flex;
    align-items: center;
    padding: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    background: #fff;

    &:hover {
        border-color: #d4a72c;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    &.is-active {
        background: #fffbf0;
        border-color: #d4a72c;

        .card-visual {
            color: #d4a72c;
        }

        .name {
            color: #d4a72c;
        }
    }
}

.card-visual {
    width: 40px;
    height: 40px;
    background: #f5f7fa;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    color: #909399;
}

.card-info {
    flex: 1;

    .name-row {
        display: flex;
        align-items: center;
        margin-bottom: 4px;

        .name {
            font-weight: 600;
            font-size: 14px;
            color: #303133;
        }

        .rec-tag {
            margin-left: 8px;
            height: 16px;
            line-height: 14px;
            font-size: 10px;
        }

    }

    .meta {
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
    }

    .specs {
        font-size: 12px;
        color: #606266;
        font-family: 'JetBrains Mono', monospace;

        .divider {
            margin: 0 6px;
            color: #ddd;
        }
    }

    .card-actions {
        margin-top: 8px;
        display: flex;
        align-items: center;

        .el-link {
            font-size: 12px;
            color: #909399;
            transition: color 0.2s;

            &:hover {
                color: #d4a72c; // 黑金风格悬停色
            }

            .mr-1 {
                margin-right: 4px;
            }
        }
    }
}

.check-mark {
    color: #d4a72c;
    font-weight: bold;
}

.drawer-footer {
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: flex-end;
}

.black-gold-btn {
    background: #1a1a1a;
    border-color: #1a1a1a;
    color: #d4a72c;

    &:hover {
        background: #333;
        border-color: #333;
    }
}
</style>