<template>
    <div class="device-manager">

        <h1>添加新设备</h1>
        <el-form :model="newDeviceForm" label-width="120px" class="form-section">
            <el-form-item label="设备名称">
                <el-input v-model="newDeviceForm.name" />
            </el-form-item>
            <el-form-item label="设备ID">
                <el-input v-model="newDeviceForm.deviceId" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="addDevice">
                    立即创建
                </el-button>
            </el-form-item>
        </el-form>

        <h1>设备列表</h1>
        <el-table :data="deviceList" stripe class="table-section">
            <el-table-column prop="name" label="设备名称" />
            <el-table-column prop="deviceId" label="设备ID" />
            <el-table-column prop="status" label="状态" />
            <el-table-column prop="lastOnline" label="最后上线时间" />
        </el-table>

    </div>
</template>

<script setup>
// 1. 引入您需要的所有“工具”
import { ref, onMounted } from 'vue' // Vue的核心：ref用于创建响应式数据，onMounted是生命周期钩子
import axios from 'axios' // 用于发起网络请求
import { ElMessage } from 'element-plus' // Element的弹窗提示

// 2. 定义后端 API 地址 (!!请替换为您自己的真实后端地址!!)
const API_BASE_URL = 'http://192.168.1.100/api' // 举个例子

// --- B. 获取并显示数据的逻辑 ---

// 3. 创建一个响应式变量，用于存放从后端拿到的设备列表
//    ref([]) 的意思是它默认是一个空数组。
const deviceList = ref([])

// 4. 定义一个函数，用于从后端获取数据
const fetchDevices = async () => {
    try {
        // 使用 axios 发起 GET 请求
        // 这就是您之前问的 "Ajax" 和 "与后端交互"
        const response = await axios.get(`${API_BASE_URL}/devices`)

        // 5. 将后端返回的数据，赋值给响应式变量
        deviceList.value = response.data.data
        // .value 是在 <script setup> 中访问 ref 变量的固定写法
        // !!注意!!: Vue 的魔力在于，一旦 deviceList.value 被更新，
        // 上面 <template> 中的 <el-table> 会自动重新渲染，显示新数据！

    } catch (error) {
        ElMessage.error('获取设备列表失败')
        console.error(error)
    }
}

// 6. 使用 onMounted 生命周期钩子：
//    告诉 Vue：“当这个组件第一次被加载到页面上时，请自动执行一次 fetchDevices 函数”
onMounted(() => {
    fetchDevices()
})


// --- A. 发送数据的逻辑 ---

// 7. 创建响应式变量，与表单输入框进行“双向绑定”
const newDeviceForm = ref({
    name: '',
    deviceId: ''
})

// 8. 定义一个函数，用于“立即创建”按钮的点击事件
const addDevice = async () => {
    try {
        // 9. 使用 axios 发起 POST 请求，将表单数据 (newDeviceForm.value) 作为 JSON 发送给后端
        await axios.post(`${API_BASE_URL}/devices`, newDeviceForm.value)

        // 10. 成功后的处理
        ElMessage.success('设备添加成功！')

        // 清空表单
        newDeviceForm.value.name = ''
        newDeviceForm.value.deviceId = ''

        // 重新获取一次列表，让新添加的设备显示在表格里
        fetchDevices()

    } catch (error) {
        ElMessage.error('添加设备失败')
        console.error(error)
    }
}

</script>

<style scoped>
/* scoped 样式只会应用在本组件内，不会污染其他页面 */
.device-manager {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.form-section,
.table-section {
    margin-bottom: 40px;
}
</style>