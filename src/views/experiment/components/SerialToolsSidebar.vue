<script setup lang="ts">
import { ref } from 'vue'
import { Fold, Expand } from '@element-plus/icons-vue'
import SerialQuickActions from './SerialQuickActions.vue'
// 未来可以在这里引入更多挂件，如：
// import SerialStatsWidget from './SerialStatsWidget.vue'

const isExpanded = ref(true)

const toggle = () => {
    isExpanded.value = !isExpanded.value
}
</script>

<template>
    <div class="tools-rack" :class="{ collapsed: !isExpanded }">
        <div class="rack-header">
            <div class="rack-title" v-if="isExpanded">TOOLKIT</div>
            <el-button circle size="small" class="toggle-btn" @click="toggle">
                <el-icon>
                    <component :is="isExpanded ? Fold : Expand" />
                </el-icon>
            </el-button>
        </div>

        <div class="rack-body" v-show="isExpanded">
            <SerialQuickActions />

        </div>

        <div class="collapsed-icons" v-show="!isExpanded">
        </div>
    </div>
</template>

<style scoped>
.tools-rack {
    width: 280px;
    display: flex;
    flex-direction: column;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    gap: 12px;
}

.tools-rack.collapsed {
    width: 48px;
}

.rack-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 0 4px;
}

.rack-title {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.1em;
}

.toggle-btn {
    margin-left: auto;
    background: transparent;
    border: none;
    color: #94a3b8;
}

.toggle-btn:hover {
    background: rgba(0, 0, 0, 0.03);
    color: #475569;
}

.rack-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    /* 卡片之间的间距 */
    overflow-y: auto;
    padding-bottom: 20px;
}
</style>