<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Memo, Plus, Close, Check } from '@element-plus/icons-vue'
import ExpCard from '@/components/ExpCard.vue'
import { useSerialPort } from '@/composables/useSerialPort'

// 1. 使用單例中的發送方法
const { send } = useSerialPort()

// --- 【位置 A：持久化數據定義】 ---
interface QuickAction {
    id: string | number
    label: string
    cmd: string
    isHex: boolean
}

const STORAGE_KEY = 'serial_quick_actions_v1'
const actions = ref<QuickAction[]>([])

// 預設指令 (僅在本地無任何數據時加載)
const DEFAULT_ACTIONS: QuickAction[] = [
    { id: 1, label: 'RST', cmd: 'AT+RST', isHex: false },
    { id: 2, label: 'VER', cmd: 'AT+VER?', isHex: false },
    { id: 3, label: 'TEST', cmd: 'AA 55 01', isHex: true },
]

// 組件掛載時讀取本地存儲
onMounted(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
        try {
            actions.value = JSON.parse(saved)
        } catch (e) {
            actions.value = [...DEFAULT_ACTIONS]
        }
    } else {
        actions.value = [...DEFAULT_ACTIONS]
    }
})

// 監聽變動並寫入本地存儲，防止刷新消失
watch(actions, (newVal) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
}, { deep: true })

// --- 【位置 B：新增指令的邏輯控制】 ---
const isAdding = ref(false) // 控制表單顯示/隱藏
const newAction = ref<QuickAction>({ id: '', label: '', cmd: '', isHex: false })

const addAction = () => {
    if (!newAction.value.label || !newAction.value.cmd) return

    actions.value.push({
        ...newAction.value,
        id: Date.now() // 生成唯一標識
    })

    // 重置表單並收起界面
    newAction.value = { id: '', label: '', cmd: '', isHex: false }
    isAdding.value = false
}

const removeAction = (id: string | number) => {
    actions.value = actions.value.filter(a => a.id !== id)
}

const handleAction = (act: QuickAction) => {
    send(act.cmd, !!act.isHex, '快速指令') //
}
</script>

<template>
    <ExpCard title="快速指令" :icon="Memo">
        <template #extra>
            <el-button link size="small" :type="isAdding ? 'info' : 'primary'" @click="isAdding = !isAdding">
                <el-icon v-if="!isAdding">
                    <Plus />
                </el-icon>
                <el-icon v-else>
                    <Close />
                </el-icon>
            </el-button>
        </template>

        <div class="quick-actions-container">
            <transition name="el-zoom-in-top">
                <div v-if="isAdding" class="compact-add-form">
                    <div class="input-row">
                        <el-input v-model="newAction.label" placeholder="標籤" size="small" class="tag-input" />
                        <el-input v-model="newAction.cmd" placeholder="指令" size="small" class="cmd-input" />
                    </div>
                    <div class="op-row">
                        <el-checkbox v-model="newAction.isHex" label="HEX" size="small" />
                        <el-button type="primary" size="small" :icon="Check" circle @click="addAction" />
                    </div>
                </div>
            </transition>

            <div class="action-grid">
                <div v-for="act in actions" :key="act.id" class="action-item" @click="handleAction(act)">
                    <div class="action-tag">
                        <span class="tag-label">{{ act.label }}</span>
                        <span v-if="act.isHex" class="hex-marker">H</span>

                        <div class="tag-delete" @click.stop="removeAction(act.id)">
                            <el-icon>
                                <Close />
                            </el-icon>
                        </div>
                    </div>
                </div>

                <div v-if="actions.length === 0" class="empty-hint">
                    點擊上方 + 號新增指令
                </div>
            </div>
        </div>
    </ExpCard>
</template>

<style scoped>
.quick-actions-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

/* 緊湊表單樣式 */
.compact-add-form {
    padding: 8px;
    background: var(--el-fill-color-light);
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;
    margin-bottom: 4px;
}

.input-row {
    display: flex;
    gap: 4px;
    margin-bottom: 6px;
}

.tag-input {
    width: 70px;
}

.cmd-input {
    flex: 1;
}

.op-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* 網格與標籤樣式 */
.action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
    gap: 8px;
}

.action-tag {
    background: var(--app-bg-canvas);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.tag-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--app-text-sub);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.hex-marker {
    font-size: 9px;
    background: var(--el-color-warning-light-8);
    color: var(--el-color-warning);
    padding: 0 2px;
    border-radius: 3px;
    margin-left: 3px;
    transform: scale(0.8);
}

.action-tag:hover {
    background: var(--app-bg-card);
    color: #6366f1;
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);
    box-shadow: var(--app-glow-primary);
}

.tag-delete {
    position: absolute;
    top: 0;
    right: 0;
    width: 16px;
    height: 16px;
    background: var(--el-color-danger);
    color: white;
    border-radius: 0 8px 0 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    opacity: 0;
    transition: opacity 0.2s;
}

.action-tag:hover .tag-delete {
    opacity: 0.8;
}

.empty-hint {
    grid-column: 1 / -1;
    text-align: center;
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    padding: 10px 0;
}
</style>