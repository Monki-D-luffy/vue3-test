<script setup lang="ts">
import { ref } from 'vue'
import { Memo, Plus, MoreFilled } from '@element-plus/icons-vue'
import ExpCard from '@/components/ExpCard.vue'
import { useSerialPort } from '@/composables/useSerialPort'

const { send } = useSerialPort()

// TODO: 未来接入 Pinia 或 LocalStorage 持久化
const actions = ref([
    { id: 1, label: 'RST', cmd: 'AT+RST', desc: 'System Reset' },
    { id: 2, label: 'VERSION', cmd: 'AT+VER?', desc: 'Check Firmware' },
    { id: 3, label: 'LOG:ON', cmd: 'AT+LOG=ON', desc: 'Enable Logs' },
    { id: 4, label: 'LOG:OFF', cmd: 'AT+LOG=OFF', desc: 'Disable Logs' },
    { id: 5, label: 'BOOT', cmd: 'AT+BOOT', desc: 'Enter Bootloader' },
])

const handleAction = (cmd: string) => {
    send(cmd, false, 'Quick Action')
}
</script>

<template>
    <ExpCard title="Quick Actions" :icon="Memo">
        <template>
            <el-button link size="small"><el-icon>
                    <MoreFilled />
                </el-icon></el-button>
        </template>

        <div class="action-grid">
            <div v-for="item in actions" :key="item.id" class="action-tag" @click="handleAction(item.cmd)"
                :title="item.desc">
                {{ item.label }}
            </div>

            <div class="action-tag add-btn">
                <el-icon>
                    <Plus />
                </el-icon>
            </div>
        </div>
    </ExpCard>
</template>

<style scoped>
.more-btn {
    /* 变量：次要文字 */
    color: var(--app-text-sub);
}

.more-btn:hover {
    color: #6366f1;
    /* 这里的交互色可以保留特定颜色，或者定义 var(--app-color-primary) */
}

.action-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.action-tag {
    /* 变量：次要背景色 (如果没有定义 app-bg-sub，这里可以用 canvas 背景) */
    background: var(--app-bg-canvas);
    border: 1px solid transparent;
    border-radius: 10px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 12px;
    font-weight: 600;
    /* 变量：次要文字 */
    color: var(--app-text-sub);

    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

/* 悬浮态：高级微光 */
.action-tag:hover {
    background: var(--app-bg-card);
    /* 变白 */
    /* 这一块涉及具体的品牌色交互，建议保留颜色值或提取为 --app-color-primary */
    color: #6366f1;
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);
    /* 变量：发光阴影 */
    box-shadow: var(--app-glow-primary);
}

.action-tag:active {
    transform: scale(0.96);
    background: var(--app-bg-canvas);
}

/* 装饰性光斑 */
.action-tag::before {
    content: "";
    position: absolute;
    right: -10px;
    bottom: -10px;
    width: 30px;
    height: 30px;
    /* 这里的光斑颜色也可以提取，但作为装饰细节，硬编码也可以 */
    background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s;
}

.action-tag:hover::before {
    opacity: 1;
}

.add-btn {
    border: 1px dashed var(--app-text-sub);
    background: transparent;
    opacity: 0.5;
}

.add-btn:hover {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.05);
    color: #6366f1;
    box-shadow: none;
    opacity: 1;
}
</style>