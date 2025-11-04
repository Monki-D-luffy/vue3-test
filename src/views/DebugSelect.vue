<template>
    <div class="debug-container">

        <h1>选择框隔离测试</h1>

        <el-select v-model="isBound" placeholder="是否绑定" clearable style="width: 20px; font-size: 16px;">
            <el-option label="已绑定" :value="'true'" />
            <el-option label="未绑定" :value="'false'" />
        </el-select>

        <hr>

        <h3>手动修改 v-model 的值：</h3>
        <el-button @click="setBound('true')">设为 "已绑定" (字符串 'true')</el-button>
        <el-button @click="setBound('false')">设为 "未绑定" (字符串 'false')</el-button>
        <el-button @click="setBound('')">设为 "空" (空字符串 '')</el-button>
        <el-button @click="setBound(null)">设为 "null"</el-button>

        <hr>

        <h3>当前 v-model (isBound) 的状态：</h3>
        <pre>
      值: {{ isBound }}
      类型: {{ typeof isBound }}
    </pre>

    </div>
</template>

<script setup>
import { ref } from 'vue'

// 1. 我们只创建这一个变量
//    初始值设为空字符串 ''
//    这完全对应您之前的 filters.isBound
const isBound = ref('')

// 2. 这是您“手动修改”功能的函数
const setBound = (value) => {
    isBound.value = value
}
</script>

<style scoped>
.debug-container {
    padding: 40px;
    font-family: sans-serif;
}

hr {
    margin: 20px 0;
}

pre {
    background-color: #f4f4f4;
    padding: 10px;
    border-radius: 4px;
}
</style>