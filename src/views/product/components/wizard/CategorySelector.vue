<template>
    <div class="selector-container">
        <div class="sidebar">
            <div v-for="group in groups" :key="group.id" class="nav-item" :class="{ active: activeGroup === group.id }"
                @click="activeGroup = group.id">
                <div class="nav-indicator" v-if="activeGroup === group.id"></div>
                <el-icon :size="18">
                    <component :is="group.icon" />
                </el-icon>
                <span class="nav-label">{{ group.label }}</span>
            </div>
        </div>

        <div class="content-area">
            <div class="content-header">
                <h3 class="group-title">{{ getActiveGroupLabel() }}</h3>
                <p class="group-desc">选择具体的设备类型以加载标准功能模版</p>
            </div>

            <el-row :gutter="16">
                <el-col :xs="12" :sm="8" :md="6" v-for="item in getActiveItems()" :key="item.value">
                    <div class="item-card" :class="{ active: modelValue === item.value }"
                        @click="handleSelect(item.value)">
                        <div class="icon-circle" :style="{ color: item.color, backgroundColor: item.bg }">
                            <el-icon>
                                <component :is="item.icon" />
                            </el-icon>
                        </div>
                        <span class="item-label">{{ item.label }}</span>
                    </div>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
    Sunny, Odometer, Cpu, Lock, Switch, VideoCamera,
    Mic, Connection, Operation, Lightning, Bell
} from '@element-plus/icons-vue';
// 变动点 1: 移除了 Check 图标的引入

defineProps<{ modelValue: string }>();
const emit = defineEmits(['update:modelValue', 'select']);

const activeGroup = ref('electric');

const groups = [
    { id: 'electric', label: '电工照明', icon: Sunny },
    { id: 'security', label: '安防传感', icon: VideoCamera },
    { id: 'appliances', label: '生活家电', icon: Mic },
    { id: 'network', label: '网络控制', icon: Connection },
];

// 变动点 3: 为每个产品项增加了专属的 color (图标色) 和 bg (背景浅色)
const itemsMap: Record<string, any[]> = {
    electric: [
        { label: '智能灯泡', value: 'LIGHT', icon: Sunny, color: '#e6a23c', bg: 'rgba(230,162,60,0.1)' }, // 橙色
        { label: '智能插座', value: 'SOCKET', icon: Operation, color: '#409eff', bg: 'rgba(64,158,255,0.1)' }, // 蓝色
        { label: '墙壁开关', value: 'SWITCH', icon: Switch, color: '#409eff', bg: 'rgba(64,158,255,0.1)' },
        { label: '场景面板', value: 'PANEL', icon: Operation, color: '#9b59b6', bg: 'rgba(155,89,182,0.1)' }, // 紫色
        { label: '幻彩灯带', value: 'STRIP', icon: Lightning, color: '#e6a23c', bg: 'rgba(230,162,60,0.1)' },
    ],
    security: [
        { label: '智能门锁', value: 'LOCK', icon: Lock, color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' }, // 青色
        { label: '监控摄像', value: 'CAMERA', icon: VideoCamera, color: '#67c23a', bg: 'rgba(103,194,58,0.1)' }, // 绿色
        { label: '门磁传感器', value: 'SENSOR', icon: Odometer, color: '#409eff', bg: 'rgba(64,158,255,0.1)' },
        { label: '烟雾报警', value: 'SMOKE', icon: Bell, color: '#f56c6c', bg: 'rgba(245,108,108,0.1)' }, // 红色
    ],
    appliances: [
        { label: '空气净化器', value: 'OTHER', icon: Mic, color: '#909399', bg: 'rgba(144,147,153,0.1)' }, // 灰色
        { label: '扫地机器人', value: 'ROBOT', icon: Operation, color: '#409eff', bg: 'rgba(64,158,255,0.1)' },
    ],
    network: [
        { label: '边缘网关', value: 'GATEWAY', icon: Cpu, color: '#9b59b6', bg: 'rgba(155,89,182,0.1)' },
        { label: '路由器', value: 'ROUTER', icon: Connection, color: '#409eff', bg: 'rgba(64,158,255,0.1)' },
    ]
};

const getActiveItems = () => itemsMap[activeGroup.value] || [];
const getActiveGroupLabel = () => groups.find(g => g.id === activeGroup.value)?.label;

const handleSelect = (val: string) => {
    emit('update:modelValue', val);
    emit('select', val);
};
</script>

<style scoped>
.selector-container {
    display: flex;
    height: 500px;
    background-color: var(--bg-card);
    border: 1px solid var(--border-base);
    border-radius: 12px;
    overflow: hidden;
}

/* 左侧侧边栏 (保持不变) */
.sidebar {
    width: 200px;
    background-color: var(--bg-canvas);
    border-right: 1px solid var(--border-base);
    padding: 8px 0;
    flex-shrink: 0;
}

.nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    cursor: pointer;
    color: var(--text-regular);
    transition: all 0.2s;
}

.nav-item:hover {
    background-color: rgba(0, 0, 0, 0.03);
}

.nav-item.active {
    background-color: var(--bg-card);
    color: var(--el-color-primary);
    font-weight: 600;
}

.nav-indicator {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background-color: var(--el-color-primary);
}

/* 右侧内容区 (保持不变) */
.content-area {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
}

.content-header {
    margin-bottom: 20px;
}

.group-title {
    margin: 0;
    font-size: 18px;
    color: var(--text-primary);
}

.group-desc {
    margin: 4px 0 0 0;
    font-size: 12px;
    color: var(--text-secondary);
}

/* --- 卡片样式核心修改 --- */
.item-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    /* 默认透明边框，为渐变做准备 */
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    /* 默认背景 */
    background-color: var(--bg-card);
    /* 确保背景不溢出圆角 */
    background-clip: padding-box;
    margin-bottom: 16px;
}

.item-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-card);
    /* Hover 时显示一个浅色边框引导 */
    border-color: var(--el-color-primary-light-7);
}

/* 变动点 2: 选中状态 - 渐变边框框 */
.item-card.active {
    /* 技巧：使用两层背景实现圆角渐变边框。
     第一层是卡片背景色，裁剪到 padding-box。
     第二层是渐变色，裁剪到 border-box。
  */
    background-image: linear-gradient(var(--bg-card), var(--bg-card)),
        linear-gradient(135deg, var(--el-color-primary), var(--el-color-success));
    background-origin: border-box;
    background-clip: padding-box, border-box;

    /* 选中时添加更强的阴影和轻微的内部色调 */
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15),
        inset 0 0 0 1px var(--el-color-primary-light-9);
    transform: translateY(-2px);
}

.icon-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    /* 默认背景色移除，由内联样式接管 */
    /* background-color: var(--bg-canvas); */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    /* 默认颜色移除，由内联样式接管 */
    /* color: var(--text-secondary); */
    margin-bottom: 12px;
    transition: transform 0.2s;
}

.item-card:hover .icon-circle {
    transform: scale(1.1);
    /* 移除 hover 变色，保持原有彩色 */
    /* color: var(--el-color-primary); */
}

.item-label {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
}

/* 变动点 1: 移除了 check-badge 的样式 */
</style>