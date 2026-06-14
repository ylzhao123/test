import { useState, useEffect, useCallback, useRef } from 'react';
import { useBatchContext } from './BatchContext';

/**
 * ActionButton 组件属性
 */
export interface ActionButtonProps {
  /** 唯一标识符（批量注册时必须） */
  id?: string;

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

  /** 是否注册到批量操作上下文 */
  registerToBatch?: boolean;
}

/**
 * 操作按钮组件
 *
 * 支持两种模式：
 * 1. 单条模式：点击后进入 loading，完成后还原
 * 2. 批量模式：注册到 BatchActionButton，由批量按钮统一触发
 */
export function ActionButton({
  id,
  onClick,
  children,
  className = '',
  disabled = false,
  loadingText = '处理中...',
  registerToBatch = true,
}: ActionButtonProps) {
  const [loading, setLoading] = useState(false);
  const batchContext = useBatchContext();
  const onClickRef = useRef(onClick);

  // 保持回调引用最新，避免闭包陈旧
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  // 注册到批量上下文
  useEffect(() => {
    if (!batchContext || !registerToBatch || !id) return;

    // 包装为稳定回调：内部始终调用最新的 onClickRef
    const stableCallback = () => onClickRef.current();
    return batchContext.registerAction(id, stableCallback);
  }, [batchContext, id, registerToBatch]);

  // 订阅批量触发事件
  useEffect(() => {
    if (!batchContext || !registerToBatch || !id) return;

    return batchContext.subscribe(async (_concurrency: number) => {
      setLoading(true);
      try {
        await onClickRef.current();
      } catch (error) {
        console.error(`批量操作 [${id}] 执行失败:`, error);
      } finally {
        setLoading(false);
      }
    });
  }, [batchContext, id, registerToBatch]);

  // 单条模式：点击处理
  const handleClick = useCallback(async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      await onClickRef.current();
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, disabled]);

  // 判断是否处于批量执行中（由外部上下文控制）
  const isInBatchExecution = batchContext?.isBatchRunning ?? false;

  return (
    <button
      className={`action-btn ${loading || isInBatchExecution ? 'action-btn--loading' : ''} ${className}`}
      disabled={disabled || loading || isInBatchExecution}
      onClick={handleClick}
      type="button"
    >
      {(loading || isInBatchExecution) && <span className="action-btn__spinner" />}
      <span className="action-btn__text">
        {loading ? loadingText : children}
      </span>
    </button>
  );
}
