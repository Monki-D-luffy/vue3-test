<template>
    <div class="mock-switch" :class="{ 'is-mock': isMock }" @click="toggleMode" title="点击切换数据源 (Real/Mock)">
        <div class="indicator"></div>
        <span class="text">{{ isMock ? 'MOCK' : 'REAL' }}</span>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const STORAGE_KEY = 'USE_MOCK_DATA'
const isMock = ref(localStorage.getItem(STORAGE_KEY) === 'true')

const toggleMode = () => {
    const nextMode = !isMock.value

    ElMessageBox.confirm(
        `确定要切换到【${nextMode ? '模拟数据 Mock' : '真实接口 Real'}】吗？页面将刷新。`,
        '切换数据源',
        {
            confirmButtonText: '立即切换',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(() => {
        localStorage.setItem(STORAGE_KEY, String(nextMode))
        // 强制刷新页面以应用新的 baseURL
        window.location.reload()
    })
}
</script>

<style scoped>
.mock-switch {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    padding: 6px 12px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.mock-switch:hover {
    transform: translateY(-2px);
    background: rgba(0, 0, 0, 0.8);
}

.indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #67c23a;
    /* Real - Green */
    margin-right: 8px;
    box-shadow: 0 0 8px #67c23a;
}

.text {
    color: #fff;
    font-size: 12px;
    font-weight: bold;
    font-family: monospace;
}

/* Mock Mode Style */
.mock-switch.is-mock .indicator {
    background-color: #e6a23c;
    /* Mock - Orange */
    box-shadow: 0 0 8px #e6a23c;
}
</style>