# React Action Button

操作按钮 React 组件库 —— 支持单条操作 Loading、批量操作协调、并发限频控制。

## 功能特性

- **ActionButton** — 单条操作按钮，点击后进入 Loading，异步完成后自动还原
- **BatchActionButton** — 批量操作按钮，通过 Context 协调所有子按钮统一触发
- **并发限频** — 支持 `concurrency` 参数控制同时执行的任务数
- **TypeScript** — 完整类型定义
- **零依赖** — 仅依赖 React

## 快速开始

### 安装

```bash
npm install
npm run dev
```

### 基本用法

```tsx
import { ActionButton } from './components';

// 单条操作按钮
<ActionButton onClick={async () => { await api.notify(userId); }}>
  发送通知
</ActionButton>
```

### 批量操作

```tsx
import { ActionButton, BatchActionButton } from './components';

// 批量通知 — 不限并发
<BatchActionButton onClick={async () => { console.log('全部完成'); }}>
  批量通知
</BatchActionButton>
{users.map(user => (
  <ActionButton key={user.id} onClick={async () => { await api.notify(user.id); }}>
    通知
  </ActionButton>
))}
```

### 限频批量操作

```tsx
// 批量退款 — 最多 2 个并发
<BatchActionButton onClick={handleComplete} concurrency={2}>
  批量退款
</BatchActionButton>
```

## 组件 API

### ActionButton

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | `string` | - | 唯一标识（批量注册时必须） |
| `onClick` | `() => Promise<void>` | - | 异步操作回调 |
| `children` | `ReactNode` | - | 按钮文字 |
| `className` | `string` | `''` | 额外 CSS 类名 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `loadingText` | `string` | `'处理中...'` | Loading 状态文字 |
| `registerToBatch` | `boolean` | `true` | 是否注册到批量上下文 |

### BatchActionButton

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `onClick` | `() => Promise<void>` | - | 所有子操作完成后的回调 |
| `children` | `ReactNode` | - | 按钮文字 |
| `className` | `string` | `''` | 额外 CSS 类名 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `loadingText` | `string` | `'批量处理中...'` | Loading 状态文字 |
| `concurrency` | `number` | - | 并发限频数（不设置则不限） |

## 演示场景

| 场景 | 说明 |
|------|------|
| 单条操作 | 独立按钮，点击 → Loading → 还原 |
| 批量通知 | 所有按钮同时触发，全部完成后恢复 |
| 批量审批 | 同上，用于审批场景 |
| 批量退款 | 设置 concurrency=2，限频执行 |

## 技术架构

```
src/
├── components/
│   ├── ActionButton.tsx      # 操作按钮（支持单条和批量模式）
│   ├── BatchActionButton.tsx  # 批量操作容器（Context Provider）
│   ├── BatchContext.ts        # 批量操作上下文定义
│   └── index.ts               # 导出
├── hooks/
│   └── useRateLimiter.ts      # 并发限频器（信号量模式）
└── App.tsx                    # 演示页面
```

## 设计原理

- **Context 协调**：BatchActionButton 通过 React Context 收集子按钮回调，点击时统一触发
- **信号量限频**：`createConcurrencyLimiter` 使用信号量模式控制并发数
- **不可变状态**：所有状态更新采用不可变模式
- **引用稳定**：使用 `useRef` 保持回调引用最新，避免闭包陈旧

## License

MIT
