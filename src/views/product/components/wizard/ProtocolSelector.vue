<template>
    <div class="protocol-container">
        <div class="header">
            <h2 class="title">选择通讯方案</h2>
            <p class="subtitle">决定设备的联网方式与硬件拓扑能力</p>
        </div>

        <el-row :gutter="20">
            <el-col :xs="24" :sm="12" v-for="proto in protocols" :key="proto.value">
                <div class="proto-card" :class="{ active: modelValue === proto.value }"
                    @click="$emit('update:modelValue', proto.value)">
                    <el-tag v-if="proto.recommend" type="success" effect="dark" round size="small"
                        class="recommend-tag">推荐</el-tag>

                    <div class="card-head">
                        <div class="icon-box">
                            <el-icon>
                                <Connection />
                            </el-icon>
                        </div>
                        <span class="card-title">{{ proto.label }}</span>
                    </div>

                    <p class="card-desc">{{ proto.desc }}</p>

                    <div class="tags-row">
                        <span v-for="tag in proto.tags" :key="tag" class="feature-tag">{{ tag }}</span>
                    </div>

                    <div class="check-circle" :class="{ checked: modelValue === proto.value }">
                        <el-icon v-if="modelValue === proto.value">
                            <Check />
                        </el-icon>
                    </div>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { Connection, Check } from '@element-plus/icons-vue';

defineProps<{ modelValue: string }>();
defineEmits(['update:modelValue']);

const protocols = [
    {
        label: 'Wi-Fi + BLE 双模',
        value: 'WIFI_BLE',
        desc: '当前主流方案。支持蓝牙辅助配网，连接成功率高，无需网关即可直连云端。',
        recommend: true,
        tags: ['直连', '高带宽', '蓝牙配网']
    },
    {
        label: 'Wi-Fi 单模',
        value: 'WIFI',
        desc: '成本极低，适合对成本敏感且无需蓝牙辅助配网的设备。',
        recommend: false,
        tags: ['直连', '低成本']
    },
    {
        label: 'BLE Mesh',
        value: 'BLE',
        desc: '适合大规模照明组网。低功耗，响应速度快，需搭配蓝牙网关使用。',
        recommend: false,
        tags: ['需网关', '低功耗', '大规模']
    },
    {
        label: 'Zigbee 3.0',
        value: 'ZIGBEE',
        desc: '工业级稳定性，自组网能力强。适合传感器、门锁等低功耗设备，需网关。',
        recommend: false,
        tags: ['需网关', '极低功耗', '高稳定']
    },
];
</script>

<style scoped>
.protocol-container {
    max-width: 900px;
    margin: 0 auto;
}

.header {
    text-align: center;
    margin-bottom: 32px;
}

.title {
    font-size: 24px;
    color: var(--text-primary);
    margin-bottom: 8px;
}

.subtitle {
    font-size: 14px;
    color: var(--text-secondary);
}

.proto-card {
    position: relative;
    background: var(--bg-card);
    border: 2px solid transparent;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-card);
    height: 100%;
    display: flex;
    flex-direction: column;
}

.proto-card:hover {
    transform: translateY(-4px);
    border-color: var(--border-base);
    box-shadow: var(--shadow-hover);
}

.proto-card.active {
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
}

.recommend-tag {
    position: absolute;
    top: 16px;
    right: 16px;
}

.card-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.icon-box {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.card-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
}

.card-desc {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 24px;
    flex: 1;
    /* 撑满高度 */
}

.tags-row {
    display: flex;
    gap: 8px;
}

.feature-tag {
    font-size: 12px;
    background-color: var(--bg-canvas);
    color: var(--text-regular);
    padding: 4px 8px;
    border-radius: 4px;
}

.check-circle {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid var(--border-base);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.check-circle.checked {
    background-color: var(--el-color-primary);
    border-color: var(--el-color-primary);
    color: white;
}
</style>