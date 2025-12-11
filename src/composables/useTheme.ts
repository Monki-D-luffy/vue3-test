// src/composables/useTheme.ts
import { ref, watchEffect } from 'vue'

const THEME_KEY = 'app-theme-preference'

// 全局单例状态，保证所有组件看到的状态一致
const isDark = ref(localStorage.getItem(THEME_KEY) === 'dark')

export function useTheme() {

    // 切换函数
    const toggleTheme = () => {
        isDark.value = !isDark.value
    }

    // 监听状态变化，操作 DOM
    watchEffect(() => {
        const htmlEl = document.documentElement
        if (isDark.value) {
            htmlEl.classList.add('dark')
            localStorage.setItem(THEME_KEY, 'dark')
        } else {
            htmlEl.classList.remove('dark')
            localStorage.setItem(THEME_KEY, 'light')
        }
    })

    return {
        isDark,
        toggleTheme
    }
}