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
                    <el-button v-if="!row.verified" type="success" link @click="handleVerify(row)">
                        通过验证
                    </el-button>
                    <el-button v-else type="info" link disabled>
                        已就绪
                    </el-button>

                    <el-button type="danger" link @click="handleDelete(row)">
                        删除
                    </el-button>
                </template>
            </el-table-column>

            <template #empty>
                <el-empty description="该产品暂无固件，请点击右上角上传" />
            </template>
        </el-table>

        <FirmwareUploadWizard v-model="isUploadVisible" :product="product" @success="loadData" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, InfoFilled, CircleCheck } from '@element-plus/icons-vue'
import { fetchFirmwares, updateFirmware, deleteFirmware } from '@/api'
import { formatDateTime } from '@/utils/formatters'
import type { Product, Firmware } from '@/types'
import FirmwareUploadWizard from './FirmwareUploadWizard.vue'

const props = defineProps<{
    product: Product
}>()

const loading = ref(false)
const firmwareList = ref<Firmware[]>([])
const isUploadVisible = ref(false)

const loadData = async () => {
    if (!props.product?.id) return

    loading.value = true
    try {
        const res = await fetchFirmwares({
            _page: 1,
            _limit: 100,
            productId: props.product.id,
            _sort: 'uploadedAt',
            _order: 'desc'
        })
        firmwareList.value = res.items
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false
    }
}

const handleVerify = async (row: Firmware) => {
    try {
        await ElMessageBox.confirm(
            `确认将版本 ${row.version} 标记为"验证通过"吗？\n标记后，该版本将出现在批量升级的候选列表中。`,
            '验证确认',
            { confirmButtonText: '通过验证', type: 'success' }
        )

        await updateFirmware(row.id, { verified: true })
        ElMessage.success(`版本 ${row.version} 已就绪`)
        loadData()
    } catch (e) {
        // cancel
    }
}

const handleDelete = async (row: Firmware) => {
    try {
        await ElMessageBox.confirm(
            `确定删除版本 ${row.version} 吗？此操作不可恢复。`,
            '删除警告',
            { confirmButtonText: '删除', type: 'warning' }
        )
        await deleteFirmware(row.id)
        ElMessage.success('删除成功')
        loadData()
    } catch (e) {
        // cancel
    }
}

watch(() => props.product.id, () => {
    loadData()
}, { immediate: true })

</script>

<style scoped>
.firmware-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.panel-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 10px;
}

.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.ml-2 {
    margin-left: 8px;
}
</style>