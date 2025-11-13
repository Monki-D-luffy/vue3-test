<template>
    <div class="dashboard-header">
        <el-row :gutter="20">
            <el-col :span="8">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon bg-blue">
                            <el-icon>
                                <Files />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="label">固件版本库</div>
                            <div class="value">{{ total }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="8">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-content">
                        <div class="stat-icon bg-green">
                            <el-icon>
                                <CircleCheck />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <div class="label">已验证版本</div>
                            <div class="value">{{ verifiedCount }}</div>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="8">
                <el-button type="primary" size="large" class="action-btn" icon="Upload" @click="$emit('upload')">
                    上传新固件
                </el-button>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { Files, CircleCheck, Upload } from '@element-plus/icons-vue'

defineProps({
    total: {
        type: Number,
        default: 0
    },
    verifiedCount: {
        type: Number,
        default: 0
    }
})

defineEmits(['upload'])
</script>

<style scoped>
/* 这里的样式复用了 page-layouts.css 中的 .stat-card，但增加了一些局部微调 */
.stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 4px 0;
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
}

.bg-blue {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.bg-green {
    background: linear-gradient(135deg, #10b981, #059669);
}

.stat-info .label {
    font-size: 13px;
    color: #909399;
}

.stat-info .value {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin-top: 4px;
}

.action-btn {
    width: 100%;
    height: 100%;
    font-size: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}
</style>