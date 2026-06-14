/**
 * 并发限频器
 *
 * 控制同时执行的任务数量，避免短时间内发起过多请求。
 * 采用信号量模式：有空位时立即执行，否则排队等待。
 */

/**
 * 创建一个并发限频执行函数
 * @param concurrency 最大并发数
 * @returns 接收任务数组，按限频策略逐一执行并返回所有结果
 */
export function createConcurrencyLimiter(concurrency: number) {
  return async function runWithLimit<T>(
    tasks: Array<() => Promise<T>>
  ): Promise<Array<{ status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown }>> {
    // 为每个任务包装为 Promise，统一通过信号量控制并发
    let running = 0;
    const queue: Array<() => void> = [];

    // 信号量：等待有空位
    const waitForSlot = (): Promise<void> => {
      if (running < concurrency) {
        running++;
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        queue.push(() => {
          running++;
          resolve();
        });
      });
    };

    // 释放一个空位
    const releaseSlot = (): void => {
      running--;
      const next = queue.shift();
      if (next) {
        next();
      }
    };

    // 用 PromiseSettled 收集所有结果
    const wrappedTasks = tasks.map(
      (task) =>
        new Promise<{ status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown }>(
          async (resolve) => {
            await waitForSlot();
            try {
              const value = await task();
              resolve({ status: 'fulfilled', value });
            } catch (reason) {
              resolve({ status: 'rejected', reason });
            } finally {
              releaseSlot();
            }
          }
        )
    );

    return Promise.all(wrappedTasks);
  };
}
