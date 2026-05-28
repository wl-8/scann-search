# 前端待办清单 (frontend_TODO)

## 当前项目进度（概要）
- 前端核心已实现：基于 Vue 3 + Vite + TypeScript + Ant Design Vue 的页面、路由、Pinia 状态管理与主要组件（Search、Visualize、Datasets、Index 等）。
- 本地开发使用内置 mock，可在 `npm run dev` 下完整演示流程；`npm run build` 已可生成生产构建（见 README）。
- 与后端的真实联调未完成：目前 auth、search、index 等 API 在前端有 mock 或占位实现。

## 优先级任务（为前端开发列出）

1. 切换到真实后端（高） — 已实现
   - 在 `frontend` 创建 `.env`，配置 `VITE_API_BASE` 指向后端（例如 `http://localhost:8000/api`）。
   - 关闭或条件化 Vite 的 mock middleware（vite.config.ts 中），以免覆盖真实接口。
   - 验证所有接口路径和请求体/响应字段与后端一致。

2. 完整认证流程（高） — 已实现
   - 已替换为真实 `/auth/login`、`/auth/logout`、`/auth/me` 调用（见 `src/api/auth.ts`）。
   - 登录后保存 `access_token` 到 `localStorage`，应用启动时尝试用 token 拉取当前用户（见 `src/stores/auth.ts` 与 `src/main.ts`）。
   - 路由守卫已扩展：在路由 `meta` 上支持 `requiresAuth` 与 `requiresAdmin`，并在 `router.beforeEach` 中校验用户角色（见 `src/router/index.ts`）。
   - 后端当前仅返回 `access_token`（无 refresh token），因此未实现刷新 token 流程；如后端新增 refresh 接口，可在 `src/api/request.ts` 中扩展重试逻辑。

3. 搜索与索引联调（高） — 已实现
   - 核对并对接后端检索端点：使用 `/search/by-cell`、`/search/by-vector`、`/search/batch` 等（见 `src/api/search.ts` 的 `search` / `conditionalSearch` / `multiDatasetSearch`）。
   - `browseSearch` 现在优先调用 `/visualize/{dataset_id}/embedding`（见 `src/api/search.ts` 与 `src/views/visualize/VisualizeView.vue`），并将 embedding points 映射到前端格式。
   - 修正并增强 `useSearch`（`src/composables/useSearch.ts`）以兼容后端返回的多种形状（`hits`、`items`、`points`），改进错误回退与字段映射。
   - 索引列表查询与构建接口已使用后端 `/index` 路由；如需触发构建（研究者权限），前端可调用 `/index/build`。

4. 数据集上传与管理（中） — 已实现
   - 已对接后端数据集注册接口 `POST /datasets/register`，完成名称、服务器路径、embedding key 的前端校验与提交。
   - 上传/注册表单已加入进度显示、错误提示与 loading 状态，注册成功后会刷新数据集列表。
   - 已预留索引构建 API（`POST /index/build`）供上传后触发索引构建。

5. 可视化优化（中） — 已实现
   - `UmapPlot` 已在大数据量时切换为 WebGL 渲染（Plotly `scattergl`），并使用 `Plotly.react` 降低重绘开销。
   - 3D 模式已联通，并保留高亮点单独 trace 的渲染方式。
   - 点击点后的联动检索已补充加载态，右侧相似细胞结果表会显示 loading。

6. 测试与质量（中）
   - 扩展单元测试覆盖 `useSearch`、API 封装及关键组件。
   - 增加 E2E 测试（Playwright/Cypress）覆盖登录、搜索、可视化主流程。
   - 添加代码风格/格式化检查（ESLint / Prettier）到 CI。

7. 响应式与无障碍（低）
   - 校验移动端布局与交互（侧边栏、表格在窄屏的表现）。
   - 增加必要的 ARIA 属性与键盘导航支持。

8. CI/CD 与部署（低）
   - 添加 GitHub Actions：`install -> test -> build`，并可选上传构建产物到预览环境。
   - 编写部署说明（Nginx 配置、静态资源路径、后端代理设置）。

9. 文档（已完成）
   - 已补充联调清单：[前后端对接清单.md](frontend/前后端对接清单.md)。
   - README 中的联调步骤、环境变量示例与部署步骤已同步更新。
   - 已整理常见后端错误与前端容错策略说明，便于测试同学排查。

## 推荐的下一步（立刻可做）
- 在 `frontend` 目录本地运行：

```bash
cd frontend
npm install
npm run dev
```

- 在本地用 Postman 或直接将 `VITE_API_BASE` 指向后端 dev 服务，尝试关闭 mock 并跑一次搜索/可视化以暴露接口不匹配的问题。

## 文件
- 本文件：[frontend_TODO.md](frontend/frontend_TODO.md)

---
如需我把某一项细化为更小的任务（含修改范围与代码片段），告诉我优先项，我会继续拆解并实现示例改动。
