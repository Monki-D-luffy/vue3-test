<!-- 筛选功能 -->
<template>
    <el-card class="filter-card" shadow="never">
        <el-form :inline="true" class="filter-form">
            <el-form-item>
                <el-select v-model="filtersModel.isBound" placeholder="是否绑定" clearable>
                    <el-option label="已绑定" :value="'true'" />
                    <el-option label="未绑定" :value="'false'" />
                </el-select>
            </el-form-item>
            <el-form-item label="全部产品">
                <el-select v-model="filtersModel.productId" placeholder="全部产品" clearable>
                </el-select>
            </el-form-item>
            <el-form-item label="时间区间">
                <el-date-picker v-model="filtersModel.dateRange" type="daterange" range-separator="至"
                    start-placeholder="开始日期" end-placeholder="结束日期" unlink-panels />
            </el-form-item>
            <el-form-item class="search-input">
                <el-input v-model="filtersModel.keyword" placeholder="设备ID / 名称 / PUUID / SN码" clearable />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="$emit('search')">搜索</el-button>
                <el-button @click="$emit('reset')">重置</el-button>
            </el-form-item>
        </el-form>
    </el-card>
</template>

<script setup>
import { defineModel, defineEmits } from 'vue'

// 1. 使用 defineModel() 来创建一个支持 v-model 的 "filtersModel"
// 父组件将这样使用：<DeviceFilterBar v-model:filters="filters" ... />
const filtersModel = defineModel('filters')

// 2. 声明本组件会发出的事件
defineEmits(['search', 'reset'])
</script>

<style scoped>
/* 3. 把 DeviceDashboard.vue 中所有
     和 .filter-form 相关的样式 "剪切" 到这里 
*/
.filter-card {
    margin-bottom: 20px;
}

.filter-form .el-form-item {
    margin-bottom: 10px;
}

.filter-form .search-input {
    min-width: 200px;
}

.filter-form .el-form-item .el-select {
    width: 150px;
}

.filter-form .el-form-item .el-input {
    width: 500px;
}
</style>