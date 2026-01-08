// File: src/api/modules/scene.ts
import instance from '@/api/core/instance';
import type { SceneRule } from '@/types/automation';

export interface SceneLog {
    time: number;
    level: 'info' | 'success' | 'error';
    msg: string;
}

export interface ExecutionResult {
    status: string;
    executionTime: string;
    logs: SceneLog[];
}

export const getScenes = () => {
    return instance.get<{ data: SceneRule[] }>('/scenes');
};

export const createScene = (data: SceneRule) => {
    return instance.post<SceneRule>('/scenes', data);
};

export const updateScene = (id: string, data: SceneRule) => {
    return instance.put<SceneRule>(`/scenes/${id}`, data);
};

export const deleteScene = (id: string) => {
    return instance.delete(`/scenes/${id}`);
};

export const executeScene = (id: string) => {
    return instance.post<ExecutionResult>(`/scenes/${id}/execute`);
};