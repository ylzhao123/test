import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { BatchContext, type BatchContextValue } from './BatchContext';
import { createConcurrencyLimiter } from '../hooks/useRateLimiter';

/**
 * BatchActionButton 组件属性
 */
export interface BatchActionButtonProps {
  /** 点击时执行的异步操作 */
  onClick: () => Promise<void>;

  /** 按钮文字 */
  children: React.ReactNode;

  /** 额外的 CSS 类名 */
  className?: string;

  /** 是否禁用 */
  disabled?: boolean;

  /** 自定义 loading 文字 */
  loadingText?: string;

  /**
   * 并发限频数（可选）
   *
   * 不设置则不限制并发，所有子操作同时执行。
   * 设置为 N 则同时最多执行 N 个子操作。
   */
  concurrency?: number;
}

/**
 * 批量操作按钮组件
 *
 * 作为容器组件，通过 Context 协调内部所有 ActionButton：
 * - 点击时触发所有注册的子操作
 * - 所有子操作完成后，按钮才恢复原状
 * - 可选的并发限频控制
 */
export function BatchActionButton({
  onClick,
  children,
  className = '',
  disabled = false,
  loadingText = '批量处理中...',
  concurrency,
}: BatchActionButtonProps) {
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  // 存储所有注册的子操作回调
  const actionsRef = useRef<Map<string, () => Promise<void>>>(new Map());
  // 存储所有订阅者（子按钮的触发回调）
  const subscribersRef = useRef<Set<(concurrency: number) => Promise<void>>>(new Set());

  const onClickRef = useRef(onClick);
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  // 注册子操作
  const registerAction = useCallback((id: string, callback: () => Promise<void>) => {
    actionsRef.current.set(id, callback);
    // 返回注销函数
    return () => {
      actionsRef.current.delete(id);
    };
  }, []);

  // 订阅批量触发
  const subscribe = useCallback((callback: (concurrency: number) => Promise<void>) => {
    subscribersRef.current.add(callback);
    // 返回注销函数
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  // 批量点击处理
  const handleClick = useCallback(async () => {
    if (isBatchRunning || disabled) return;
    setIsBatchRunning(true);

    try {
      // 1. 触发所有子操作（带并发控制）
      const subscribers = Array.from(subscribersRef.current);
      if (subscribers.length > 0) {
        if (concurrency && concurrency > 0) {
          // 使用限频器控制并发
          const limiter = createConcurrencyLimiter(concurrency);
          const tasks = subscribers.map(
            (sub) => () => sub(concurrency)
          );
          await limiter(tasks);
        } else {
          // 不限制并发，所有操作同时执行
          await Promise.all(
            subscribers.map((sub) => sub(0))
          );
        }
      }

      // 2. 执行批量按钮自身的回调
      await onClickRef.current();
    } catch (error) {
      console.error('批量操作失败:', error);
    } finally {
      setIsBatchRunning(false);
    }
  }, [isBatchRunning, disabled, concurrency]);

  // 构建 Context 值（使用 useMemo 避免不必要的重渲染）
  const contextValue = useMemo<BatchContextValue>(
    () => ({
      registerAction,
      subscribe,
      isBatchRunning,
    }),
    [registerAction, subscribe, isBatchRunning]
  );

  return (
    <BatchContext.Provider value={contextValue}>
      <button
        className={`batch-btn ${isBatchRunning ? 'batch-btn--loading' : ''} ${className}`}
        disabled={disabled || isBatchRunning}
        onClick={handleClick}
        type="button"
      >
        {isBatchRunning && <span className="batch-btn__spinner" />}
        <span className="batch-btn__text">
          {isBatchRunning ? loadingText : children}
        </span>
      </button>
      {concurrency && concurrency > 0 && (
        <span className="batch-btn__badge" title={`并发限制: ${concurrency}`}>
          限频 {concurrency}
        </span>
      )}
    </BatchContext.Provider>
  );
}
