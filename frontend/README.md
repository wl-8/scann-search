# scann-search Frontend

基于 Vue 3 + Vite + TypeScript + Ant Design Vue 的单细胞 ANN 检索系统前端。

## 项目特性

- 登录页支持本地演示登录，任意用户名密码都可进入系统
- 搜索页支持普通检索、条件检索、跨数据集检索和浏览数据
- 搜索结果支持分页、展开详情，查看 `metadata` 和 `gene_expr`
- 可视化页提供 UMAP 散点图、点选联动检索、右侧相似细胞结果展示
- 数据集页支持模拟上传、列表管理、详情弹窗和删除操作
- 开发环境内置 mock API，无需后端即可完整演示前端流程

## 运行环境

- Node.js 18+（建议）
- npm 9+

## 安装依赖

在 `frontend` 目录下执行：

```bash
npm install
```

## 本地开发

```bash
npm run dev
```

启动后，Vite 会输出本地地址，例如 `http://localhost:5179/`。

默认访问流程：

1. 打开 `/login`
2. 输入任意用户名和密码登录
3. 进入 `/dashboard`
4. 使用侧边栏进入 `/search`、`/visualize`、`/datasets`

## 构建与预览

```bash
npm run build
npm run preview
```

说明：

- `npm run build` 已通过验证，可正常生成生产构建
- `npm run preview` 用于本地预览构建产物

## 测试

```bash
npm run test
```

当前包含基础单元测试，主要覆盖 `useSearch` 组合函数：

- 后端返回成功时，解析检索结果和总数
- 后端失败时，回退到开发 mock 数据

## 环境变量

如果你有真实后端，可以在 `frontend` 目录创建 `.env`，例如：

```env
VITE_API_BASE=http://localhost:8000/api
```

说明：

- 前端会优先调用 `VITE_API_BASE` 指向的后端
- 如果后端不可用，搜索逻辑会在开发模式下自动回退到 mock 数据

## 开发模式 Mock

开发服务器在 `vite.config.ts` 中内置了 mock middleware，用于替代后端接口：

- `POST /api/search`：Top-K 检索
- `POST /api/search/conditional`：条件检索
- `POST /api/search/multi-dataset`：跨数据集检索
- `POST /api/search/browse`：浏览数据与 facets

每个返回项会包含较完整的演示字段：

- `id`
- `score`
- `cell_type`
- `dataset`
- `metadata`
- `umap_x`
- `umap_y`
- `gene_expr`

这些 mock 仅在 `npm run dev` 时启用，不会进入生产构建。

## 页面说明

- `/login`：登录页
- `/dashboard`：首页仪表盘
- `/search`：检索页
- `/visualize`：UMAP 可视化页
- `/datasets`：数据集管理页

## 目录结构

```text
frontend/
├── src/
│   ├── api/          # 接口封装
│   ├── components/   # 可复用组件
│   ├── composables/  # 组合式逻辑
│   ├── router/       # 路由配置
│   ├── stores/       # Pinia 状态管理
│   └── views/        # 页面
├── vite.config.ts    # Vite 配置 + mock middleware
├── vitest.config.ts  # 单元测试配置
├── package.json
└── README.md
```

## 常见问题

### 打开页面是空白

- 检查是否在 `frontend` 目录启动了 `npm run dev`
- 确认访问的是登录页 `/login`
- 如果缓存了旧页面，执行一次强制刷新

### `npm run dev` 没有找到 `package.json`

- 说明你在仓库根目录运行了命令
- 请切换到 `frontend` 目录后再执行：

```bash
cd frontend
npm run dev
```

### 构建报错依赖缺失

- 先执行 `npm install`
- 确认 Node.js 版本不低于 18

## 备注

当前前端已经可以独立演示完整流程；等后端准备好后，只需修改 `.env` 中的 `VITE_API_BASE` 并关闭或调整 mock 配置即可接入真实接口。
