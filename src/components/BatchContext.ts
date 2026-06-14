import { createContext, useContext } from 'react';

/**
 * 批量操作上下文
 *
 * 由 BatchActionButton 提供，供 ActionButton 注册回调和接收批量触发指令。
 */
export interface BatchContextValue {
  /** 注册一个异步操作回调，返回注销函数 */
  registerAction: (id: string, callback: () => Promise<void>) => () => void;

  /** 订阅"批量触发"事件，返回注销函数 */
  subscribe: (callback: (concurrency: number) => Promise<void>) => () => void;

  /** 当前是否处于批量执行中 */
  isBatchRunning: boolean;
}

export const BatchContext = createContext<BatchContextValue | null>(null);

/**
 * 获取批量操作上下文（需在 BatchActionButton 内部使用）
 */
export function useBatchContext(): BatchContextValue | null {
  return useContext(BatchContext);
}
