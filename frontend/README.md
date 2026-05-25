# scann-search - Frontend

这是前端工程，基于 Vue 3 + Vite + TypeScript，使用 Ant Design Vue 作为组件库。

## 快速开始

1. 安装依赖

```bash
cd frontend
npm install
```

2. 本地开发

```bash
npm run dev
```

开发服务器会启用一个内置的 mock API（仅用于开发环境），模拟 `/api/search` 及其它检索接口，方便前端调试而不依赖后端。

3. 环境变量

创建 `.env`（基于已有的 `.env.example`）并设置真实后端地址（若有）：

```
VITE_API_BASE=http://localhost:8000/api
```

当前实现会优先调用 `VITE_API_BASE` 指向的后端；如果后端不可用，前端会回退到开发内置的 mock 数据。

## Mock 接口（开发模式）

在 `vite.config.ts` 中实现了开发时的 mock：

- `POST /api/search` → Top-K 检索，返回 `{ items: [...], total }`。
- `POST /api/search/conditional` → 条件检索（使用 `filters`），返回 `{ items, total }`。
- `POST /api/search/multi-dataset` → 跨数据集检索（使用 `datasets`），返回 `{ items, total }`。
- `POST /api/search/browse` → 数据浏览，返回 `{ items, total, facets }`。

每个 `item` 包含：`id`, `score`, `cell_type`, `dataset`, `metadata`, `umap_x`, `umap_y`, `gene_expr` 等字段，方便演示可展开行查看详细信息。

这些 mock 仅在 `npm run dev` 时启用，生产构建不会包含它们。

## 测试

项目使用 Vitest 编写了基础单元测试：

```bash
npm run test
```

当前包含测试项：
- `useSearch` 组合函数：测试与后端交互以及当后端失败时回退到本地 mock。

## 目录概览

```
frontend/
├── src/
│   ├── api/            // 后端接口封装（axios 实例 + 各模块请求）
│   ├── components/     // 可复用组件
│   ├── composables/    // 组合式函数（如 useSearch）
│   ├── views/          // 页面视图（Search, Auth, Dashboard 等）
│   └── router/, stores/ // 路由与状态管理
├── vite.config.ts      // Vite 配置（包含 dev mock middleware）
├── package.json
└── README.md
```

## 下一步建议

- 如需切换到真实后端，请设置 `.env` 中的 `VITE_API_BASE`，并确保后端实现 `/api/search` 等接口。
- 我可以把 mock 的更多接口（例如分页参数、条件过滤示例）扩展为更真实的行为，或在 UI 上增加基于 `facets` 的交互筛选。

如果需要，我可以把当前改动提交到一个新分支并发起 PR。
