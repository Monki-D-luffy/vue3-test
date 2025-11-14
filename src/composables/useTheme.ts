// src/composables/useTheme.ts
import { ref, watchEffect } from 'vue'

// 全局单例状态
const isDark = ref(localStorage.getItem('theme') === 'dark')

export function useTheme() {

    const toggleTheme = () => {
        isDark.value = !isDark.value
    }

    // 监听状态变化，直接操作 DOM
    watchEffect(() => {
        const htmlEl = document.documentElement
        if (isDark.value) {
            htmlEl.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            htmlEl.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    })

    return {
        isDark,
        toggleTheme
    }
}