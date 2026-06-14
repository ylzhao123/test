import { useState, useCallback, useRef } from 'react';
import { ActionButton, BatchActionButton } from './components';
import './App.css';

/* ---------- 类型定义 ---------- */

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface Record {
  id: string;
  name: string;
  email: string;
}

/* ---------- 模拟数据 ---------- */

const MOCK_RECORDS: Record[] = [
  { id: '1', name: '张三', email: 'zhangsan@example.com' },
  { id: '2', name: '李四', email: 'lisi@example.com' },
  { id: '3', name: '王五', email: 'wangwu@example.com' },
  { id: '4', name: '赵六', email: 'zhaoliu@example.com' },
  { id: '5', name: '钱七', email: 'qianqi@example.com' },
];

/* ---------- 模拟异步操作 ---------- */

/** 模拟一个异步 API 调用，随机 1~3 秒完成 */
function mockApiCall(label: string): Promise<void> {
  const delay = 1000 + Math.random() * 2000;
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[API] ${label} 完成 (${Math.round(delay)}ms)`);
      resolve();
    }, delay);
  });
}

/* ---------- 演示页面 ---------- */

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);

  // 添加日志
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const now = new Date();
    const time = [
      now.getHours().toString().padStart(2, '0'),
      now.getMinutes().toString().padStart(2, '0'),
      now.getSeconds().toString().padStart(2, '0'),
    ].join(':');
    setLogs((prev) => [
      ...prev,
      { id: ++logIdRef.current, time, message, type },
    ]);
  }, []);

  // 清空日志
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // 为每条记录生成操作回调
  const createNotifyHandler = useCallback(
    (record: Record) => async () => {
      addLog(`正在通知 ${record.name}...`, 'info');
      await mockApiCall(`通知 ${record.name}`);
      addLog(`已通知 ${record.name}`, 'success');
    },
    [addLog]
  );

  const createApproveHandler = useCallback(
    (record: Record) => async () => {
      addLog(`正在审批 ${record.name} 的申请...`, 'info');
      await mockApiCall(`审批 ${record.name}`);
      addLog(`已批准 ${record.name} 的申请`, 'success');
    },
    [addLog]
  );

  const createRefundHandler = useCallback(
    (record: Record) => async () => {
      addLog(`正在处理 ${record.name} 的退款...`, 'info');
      await mockApiCall(`退款 ${record.name}`);
      addLog(`已退款给 ${record.name}`, 'success');
    },
    [addLog]
  );

  // 批量操作的自身回调
  const batchNotifyComplete = useCallback(async () => {
    addLog('✅ 批量通知全部完成', 'success');
  }, [addLog]);

  const batchApproveComplete = useCallback(async () => {
    addLog('✅ 批量审批全部完成', 'success');
  }, [addLog]);

  const batchRefundComplete = useCallback(async () => {
    addLog('✅ 批量退款全部完成（限频 2 并发）', 'success');
  }, [addLog]);

  return (
    <div className="demo-page">
      <h1>操作按钮组件演示</h1>
      <p className="subtitle">
        单条操作按钮（点击 → Loading → 还原）| 批量操作按钮（协调子按钮 + 限频控制）
      </p>

      {/* ===== 场景一：单条操作 ===== */}
      <section className="demo-section">
        <h2>场景一：单条操作</h2>
        <p className="section-desc">
          点击按钮后进入 Loading 状态，异步操作完成后自动还原。
        </p>
        <div className="record-list">
          {MOCK_RECORDS.map((record) => (
            <div key={record.id} className="record-item">
              <div className="record-item__info">
                <div className="record-item__avatar">{record.name[0]}</div>
                <div>
                  <div className="record-item__name">{record.name}</div>
                  <div className="record-item__status">{record.email}</div>
                </div>
              </div>
              <ActionButton onClick={createNotifyHandler(record)}>
                发送通知
              </ActionButton>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 场景二：批量通知（不限并发） ===== */}
      <section className="demo-section">
        <h2>场景二：批量通知（不限并发）</h2>
        <p className="section-desc">
          点击"批量通知"后，所有子按钮同时触发 Loading，全部完成后批量按钮才恢复。
        </p>
        <BatchActionButton onClick={batchNotifyComplete}>
          批量通知
        </BatchActionButton>
        <div className="record-list" style={{ marginTop: 16 }}>
          {MOCK_RECORDS.map((record) => (
            <div key={record.id} className="record-item">
              <div className="record-item__info">
                <div className="record-item__avatar">{record.name[0]}</div>
                <div>
                  <div className="record-item__name">{record.name}</div>
                  <div className="record-item__status">{record.email}</div>
                </div>
              </div>
              <ActionButton onClick={createNotifyHandler(record)}>
                发送通知
              </ActionButton>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 场景三：批量审批（不限并发） ===== */}
      <section className="demo-section">
        <h2>场景三：批量审批</h2>
        <p className="section-desc">
          点击"批量同意"后，所有审批操作同时发起，全部完成后批量按钮恢复。
        </p>
        <BatchActionButton onClick={batchApproveComplete}>
          批量同意
        </BatchActionButton>
        <div className="record-list" style={{ marginTop: 16 }}>
          {MOCK_RECORDS.map((record) => (
            <div key={record.id} className="record-item">
              <div className="record-item__info">
                <div className="record-item__avatar">{record.name[0]}</div>
                <div>
                  <div className="record-item__name">{record.name}</div>
                  <div className="record-item__status">待审批</div>
                </div>
              </div>
              <ActionButton onClick={createApproveHandler(record)}>
                同意
              </ActionButton>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 场景四：批量退款（限频 2 并发） ===== */}
      <section className="demo-section">
        <h2>场景四：批量退款（限频 2 并发）</h2>
        <p className="section-desc">
          设置 concurrency=2，同一时刻最多执行 2 个退款操作，避免短时间大量请求。
        </p>
        <BatchActionButton onClick={batchRefundComplete} concurrency={2}>
          批量退款
        </BatchActionButton>
        <div className="record-list" style={{ marginTop: 16 }}>
          {MOCK_RECORDS.map((record) => (
            <div key={record.id} className="record-item">
              <div className="record-item__info">
                <div className="record-item__avatar">{record.name[0]}</div>
                <div>
                  <div className="record-item__name">{record.name}</div>
                  <div className="record-item__status">待退款</div>
                </div>
              </div>
              <ActionButton onClick={createRefundHandler(record)}>
                退款
              </ActionButton>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 日志面板 ===== */}
      <section className="demo-section">
        <div className="log-panel">
          <div className="log-panel__title">
            操作日志
            <button className="log-clear-btn" onClick={clearLogs}>清空</button>
          </div>
          {logs.length === 0 ? (
            <div className="log-panel__entry" style={{ color: '#64748b' }}>
              点击上方按钮开始操作...
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`log-panel__entry log-panel__entry--${log.type}`}
              >
                [{log.time}] {log.message}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
