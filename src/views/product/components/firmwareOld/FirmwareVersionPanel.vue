<template>
    <div class="firmware-panel">
        <div class="panel-toolbar">
            <div class="left">
                <el-text class="mx-1" type="info">
                    <el-icon>
                        <InfoFilled />
                    </el-icon>
                    仅“验证通过”的固件可用于批量推送
                </el-text>
            </div>
            <div class="right">
                <el-button type="primary" :icon="Upload" @click="isUploadVisible = true">
                    上传新版本
                </el-button>
            </div>
        </div>

        <el-table :data="firmwareList" v-loading="loading" style="width: 100%">
            <el-table-column prop="version" label="版本号" width="120">
                <template #default="{ row, $index }">
                    <span style="font-weight: bold;">{{ row.version }}</span>
                    <el-tag v-if="$index === 0" size="small" type="danger" effect="plain" class="ml-2">Latest</el-tag>
                </template>
            </el-table-column>

            <el-table-column prop="uploadedAt" label="上传时间" width="180">
                <template #default="{ row }">
                    {{ formatDateTime(row.uploadedAt) }}
                </template>
            </el-table-column>

            <el-table-column label="状态" width="120">
                <template #default="{ row }">
                    <el-tag v-if="row.verified" type="success" effect="dark">
                        <el-icon>
                            <CircleCheck />
                        </el-icon> 已验证
                    </el-tag>
                    <el-tag v-else type="warning" effect="plain">
                        未验证
                    </el-tag>
                </template>
            </el-table-column>

            <el-table-column prop="releaseNotes" label="发布说明" min-width="200">
                <template #default="{ row }">
                    <div class="text-ellipsis" :title="row.releaseNotes">{{ row.releaseNotes }}</div>
                </template>
            </el-table-column>

            <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                    <div class="action-group">
                        <div class="status-btn-wrapper">
                            <el-button v-if="!row.verified" type="success" link
                                @click="verifyFirmware(row, refreshData)">
                                通过验证
                            </el-button>
                            <el-button v-else type="info" link disabled>已就绪</el-button>
                        </div>
                        <el-button type="danger" link @click="removeFirmware(row, refreshData)">
                            删除
                        </el-button>
                    </div>
                </template>
            </el-table-column>

            <template #empty>
                <el-empty description="该产品暂无固件，请点击右上角上传" />
            </template>
        </el-table>

        <FirmwareUploadWizard v-model="isUploadVisible" :product="product" @success="refreshData" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Upload, InfoFilled, CircleCheck } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/formatters'
import type { Product } from '@/types'
import FirmwareUploadWizard from './FirmwareUploadWizard.vue'
import { useFirmwareManagement } from '@/composables/useFirmwareManagement'

const props = defineProps<{
    product: Product
}>()

const isUploadVisible = ref(false)

// ✨ 引入 Composable
const {
    loading,
    firmwareList,
    getFirmwares,
    verifyFirmware,
    removeFirmware
} = useFirmwareManagement()

// 封装刷新函数
const refreshData = () => {
    if (props.product?.id) {
        getFirmwares(props.product.id)
    }
}

// 监听 Product ID 变化
watch(() => props.product.id, () => {
    refreshData()
}, { immediate: true })

</script>

<style scoped>
.firmware-panel {
    padding: 0 20px 10px 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.panel-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
}

.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.ml-2 {
    margin-left: 8px;
}

.action-group {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    /* 左对齐，配合定宽容器 */
}

.status-btn-wrapper {
    width: 75px;
    /* 设定一个足够放下“通过验证”的宽度 */
    display: flex;
    justify-content: center;
    /* 让按钮在定宽容器内居中，美观一些 */
    margin-right: 10px;
    /* 确保和删除按钮之间有固定间距 */
}
</style>