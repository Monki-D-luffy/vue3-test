<template>
    <div class="release-center">
        <div class="release-header">
            <div class="header-info">
                <h2 class="title">产品验收报告 (Product Acceptance)</h2>
                <p class="subtitle">
                    产品定义与配置已全部就绪。此页面汇总了该产品的所有核心元数据 (Metadata) 与资源配置。
                </p>
            </div>
            <div class="readiness-score">
                <el-progress type="dashboard" :percentage="readinessScore" :color="progressColors" :width="80"
                    :stroke-width="6">
                    <template #default="{ percentage }">
                        <span class="score-num">{{ percentage }}%</span>
                        <span class="score-label">健康度</span>
                    </template>
                </el-progress>
            </div>
        </div>

        <div class="review-grid">
            <div class="review-card">
                <div class="card-icon gold-bg">
                    <el-icon>
                        <List />
                    </el-icon>
                </div>
                <div class="card-content">
                    <h3 class="card-title">功能定义 (Function)</h3>
                    <div class="card-metric">
                        <span class="num">{{ store.dps.length }}</span>
                        <span class="unit">个数据点 (DPs)</span>
                    </div>
                    <ul class="detail-list">
                        <li v-for="dp in previewDps" :key="dp.id">
                            <span class="dot" :class="dp.mode === 'rw' ? 'green' : 'orange'"></span>
                            {{ dp.name }}
                        </li>
                        <li v-if="store.dps.length > 3" class="more">...等 {{ store.dps.length - 3 }} 项</li>
                    </ul>
                </div>
                <div class="card-status">
                    <el-icon color="#10b981">
                        <CircleCheckFilled />
                    </el-icon>
                </div>
            </div>

            <div class="review-card">
                <div class="card-icon gold-bg">
                    <el-icon>
                        <Cellphone />
                    </el-icon>
                </div>
                <div class="card-content">
                    <h3 class="card-title">面板设计 (Panel)</h3>
                    <div class="card-metric">
                        <span class="num">V1</span>
                        <span class="unit">标准面板</span>
                    </div>
                    <div class="panel-preview-mini">
                        <div class="phone-frame">
                            <div class="screen"></div>
                            <div class="notch"></div>
                        </div>
                        <span class="preview-text">App 界面已生成</span>
                    </div>
                </div>
                <div class="card-status">
                    <el-icon color="#10b981">
                        <CircleCheckFilled />
                    </el-icon>
                </div>
            </div>

            <div class="review-card">
                <div class="card-icon gold-bg">
                    <el-icon>
                        <Cpu />
                    </el-icon>
                </div>
                <div class="card-content">
                    <h3 class="card-title">硬件开发 (Hardware)</h3>
                    <div class="card-metric">
                        <span class="text">{{ store.currentModule?.name || '未选型' }}</span>
                    </div>
                    <div class="firmware-info" v-if="store.latestFirmware">
                        <el-tag type="info" size="small" effect="plain">固件已构建</el-tag>
                        <span class="version">{{ store.latestFirmware.version }}</span>
                    </div>
                    <div class="warning-box" v-else>
                        <el-icon>
                            <Warning />
                        </el-icon> 尚未生成固件
                    </div>
                </div>
                <div class="card-status">
                    <el-icon :color="store.latestFirmware ? '#10b981' : '#e6a23c'">
                        <component :is="store.latestFirmware ? 'CircleCheckFilled' : 'WarningFilled'" />
                    </el-icon>
                </div>
            </div>

            <div class="review-card">
                <div class="card-icon gold-bg">
                    <el-icon>
                        <Operation />
                    </el-icon>
                </div>
                <div class="card-content">
                    <h3 class="card-title">云端配置 (Cloud)</h3>
                    <div class="config-tags">
                        <el-tag :type="hasTimer ? 'success' : 'info'" size="small" class="custom-tag">
                            定时: {{ hasTimer ? '启用' : '未配' }}
                        </el-tag>
                        <el-tag :type="hasScene ? 'success' : 'info'" size="small" class="custom-tag">
                            场景: {{ hasScene ? '启用' : '未配' }}
                        </el-tag>
                    </div>
                    <p class="desc-text">定义设备在云端的自动化规则与交互元数据。</p>
                </div>
                <div class="card-status">
                    <el-icon color="#10b981">
                        <CircleCheckFilled />
                    </el-icon>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studioStore'
import {
    List, Cellphone, Cpu, Operation,
    CircleCheckFilled, WarningFilled, Warning
} from '@element-plus/icons-vue'

const store = useStudioStore()

// --- Computeds ---
const previewDps = computed(() => store.dps.slice(0, 3))
const hasTimer = computed(() => store.productMetadata?.cloudTimer?.enabled)
const hasScene = computed(() => (store.productMetadata?.scene?.rules?.length || 0) > 0)

const readinessScore = computed(() => {
    let score = 0
    if (store.dps.length > 0) score += 30
    if (store.currentModule) score += 30
    if (store.latestFirmware) score += 20
    score += 10
    if (hasTimer.value || hasScene.value) score += 10
    return Math.min(100, score)
})

const progressColors = [
    { color: '#f56c6c', percentage: 40 },
    { color: '#e6a23c', percentage: 80 },
    { color: '#d4af37', percentage: 100 },
]
</script>

<style lang="scss" scoped>
.release-center {
    --bg-card: #ffffff;
    --text-main: #1a1a1a;
    --text-sub: #606266;
    --color-gold: #d4af37;
    --color-gold-dim: rgba(212, 175, 55, 0.1);
    --color-black: #000000;

    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg-canvas, #f5f7fa);
    padding: 24px;
    gap: 24px;
}

.release-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-card);
    padding: 24px 32px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);

    .header-info {
        .title {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-main);
            margin: 0 0 8px 0;
            letter-spacing: -0.5px;
        }

        .subtitle {
            color: var(--text-sub);
            font-size: 14px;
            max-width: 600px;
            margin: 0;
        }
    }

    .readiness-score {
        display: flex;
        align-items: center;

        .score-num {
            font-size: 18px;
            font-weight: 800;
            color: var(--text-main);
            display: block;
        }

        .score-label {
            font-size: 12px;
            color: var(--text-sub);
            transform: scale(0.8);
        }
    }
}

.review-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    align-content: flex-start;
}

.review-card {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 24px;
    position: relative;
    border: 1px solid transparent;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02);

    /* 移除 hover 浮动，增强“已归档”的稳重感，或者保留微弱效果 */
    &:hover {
        border-color: rgba(0, 0, 0, 0.05);
    }

    .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: var(--color-gold-dim);
        color: var(--color-gold);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin-bottom: 20px;
    }

    .card-content {
        flex: 1;

        .card-title {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-sub);
            margin: 0 0 12px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .card-metric {
            display: flex;
            align-items: baseline;
            gap: 8px;
            margin-bottom: 16px;

            .num {
                font-size: 32px;
                font-weight: 700;
                color: var(--text-main);
                font-family: 'Inter', sans-serif;
            }

            .unit {
                font-size: 13px;
                color: var(--text-sub);
            }

            .text {
                font-size: 20px;
                font-weight: 600;
                color: var(--text-main);
            }
        }

        .detail-list {
            list-style: none;
            padding: 0;
            margin: 0;
            font-size: 13px;
            color: var(--text-sub);

            li {
                margin-bottom: 6px;
                display: flex;
                align-items: center;

                .dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    margin-right: 8px;
                    background: #dcdfe6;

                    &.green {
                        background: #10b981;
                    }

                    &.orange {
                        background: #e6a23c;
                    }
                }
            }

            .more {
                color: #909399;
                font-size: 12px;
                margin-left: 14px;
            }
        }

        .firmware-info {
            display: flex;
            align-items: center;
            gap: 8px;

            .version {
                font-family: monospace;
                background: #f4f4f5;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 12px;
            }
        }

        .warning-box {
            font-size: 12px;
            color: #e6a23c;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .panel-preview-mini {
            display: flex;
            align-items: center;
            gap: 12px;

            .phone-frame {
                width: 24px;
                height: 40px;
                border: 2px solid var(--text-main);
                border-radius: 4px;
                position: relative;

                .screen {
                    position: absolute;
                    top: 4px;
                    left: 2px;
                    right: 2px;
                    bottom: 4px;
                    background: #f4f4f5;
                }

                .notch {
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 8px;
                    height: 2px;
                    background: var(--text-main);
                    border-bottom-left-radius: 2px;
                    border-bottom-right-radius: 2px;
                }
            }

            .preview-text {
                font-size: 12px;
                color: var(--text-sub);
            }
        }

        .config-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 8px;
        }

        .desc-text {
            font-size: 12px;
            color: #909399;
            line-height: 1.4;
            margin: 0;
        }
    }

    .card-status {
        position: absolute;
        top: 24px;
        right: 24px;
        font-size: 20px;
    }
}
</style>