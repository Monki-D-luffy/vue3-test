<!-- 统计卡片 -->
<template>
    <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
            <div class="stat-item">
                <div class="stat-icon" :class="colorTheme">
                    <el-icon>
                        <component :is="iconComponent" />
                    </el-icon>
                </div>
                <div class="stat-info">
                    <span class="label">{{ label }}</span>
                    <span class="value">{{ value }}</span>
                </div>
            </div>
        </el-card>
    </el-col>
</template>

<script setup>
import { defineProps } from 'vue'

// 1. 定义这个组件接收哪些参数
defineProps({
    label: {
        type: String,
        required: true
    },
    value: {
        type: [String, Number],
        required: true
    },
    // 2. 我们可以直接把图标组件本身作为 prop 传进来
    iconComponent: {
        type: Object, // Vue 组件是 Object 类型
        required: true
    },
    // 3. 用一个 prop 来控制颜色主题
    colorTheme: {
        type: String,
        default: 'blue-bg' // 默认是蓝色
    }
})
</script>

<style scoped>
/* 4. 把 DeviceDashboard.vue 里的
   所有 stat-card 相关的样式 "剪切" 到这里
*/
.stat-card :deep(.el-card__body) {
    padding: 20px;
}

.stat-item {
    display: flex;
    align-items: center;
}

.stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 20px;
}

.stat-icon .el-icon {
    font-size: 30px;
    color: #fff;
}

/* 5. 把所有颜色定义都移过来 */
.blue-bg {
    background: linear-gradient(135deg, #36d1dc, #5b86e5);
}

.green-bg {
    background: linear-gradient(135deg, #67b26f, #4ca2cd);
}

.purple-bg {
    background: linear-gradient(135deg, #f6d365, #fda085);
}

.stat-info {
    display: flex;
    flex-direction: column;
}

.stat-info .label {
    font-size: 14px;
    color: #909399;
}

.stat-info .value {
    font-size: 28px;
    font-weight: bold;
    color: #303133;
    margin-top: 5px;
}
</style>