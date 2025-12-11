<template>
    <div class="page-container">
        <PageMainHeader title="产品管理" subtitle="定义与管理 IoT 设备的产品模型与物模型">
            <template #actions>
                <el-button type="primary" icon="Plus" @click="handleCreate">
                    创建产品
                </el-button>
            </template>
        </PageMainHeader>

        <div class="filter-card card-base mb-4">
            <el-input v-model="searchKeyword" placeholder="输入产品名称或 Key..." class="filter-item-input" clearable
                @keyup.enter="handleSearch">
                <template #prefix><el-icon>
                        <Search />
                    </el-icon></template>
            </el-input>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button plain @click="handleReset">重置</el-button>
        </div>

        <div class="card-base table-card">
            <el-table :data="tableData" v-loading="loading" style="width: 100%">
                <el-table-column prop="name" label="产品名称" min-width="180" />
                <el-table-column prop="productKey" label="Product Key" width="200" show-overflow-tooltip />
                <el-table-column prop="nodeType" label="节点类型" width="120">
                    <template #default="{ row }">
                        <el-tag :type="row.nodeType === 1 ? 'success' : 'info'">
                            {{ row.nodeType === 1 ? '直连设备' : '网关子设备' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="deviceCount" label="设备数量" align="center" width="100" />
                <el-table-column prop="createTime" label="创建时间" width="180" />

                <el-table-column label="操作" width="220" fixed="right">
                    <template #default>
                        <el-button link type="primary">查看</el-button>
                        <el-button link type="primary">功能定义</el-button>
                        <el-button link type="danger">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
                <el-pagination layout="total, prev, pager, next" :total="100" background />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageMainHeader from '@/components/PageMainHeader.vue'
import { Search, Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const searchKeyword = ref('')
// 模拟数据，实际请从 API 获取
const tableData = ref([
    { id: 1, name: '智能温湿度传感器', productKey: 'a1G8s9f...', nodeType: 1, deviceCount: 234, createTime: '2024-03-20 10:00:00' },
    { id: 2, name: '工业网关 X1', productKey: 'b2K9d0a...', nodeType: 0, deviceCount: 12, createTime: '2024-03-19 15:30:00' },
])

const handleSearch = () => { console.log('Searching...') }
const handleReset = () => { searchKeyword.value = '' }
const handleCreate = () => { console.log('Create new product') }
</script>

<style scoped>
.page-container {
    padding-bottom: 40px;
}

.mb-4 {
    margin-bottom: 16px;
}

/* 筛选栏样式微调 */
.filter-card {
    padding: 16px 24px;
    background: var(--app-bg-card);
    display: flex;
    gap: 12px;
}

.filter-item-input {
    width: 240px;
}

.table-card {
    background: var(--app-bg-card);
    padding: 24px;
    min-height: 500px;
}

.pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>