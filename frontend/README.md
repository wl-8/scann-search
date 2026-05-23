# Frontend

```bash
npm install
npm run dev   # http://localhost:5173
```

```
frontend/
├── public/             静态公共资源
├── src/
│   ├── api/            后端接口封装（axios 实例 + 各模块请求）
│   ├── assets/         样式、图片等静态资源
│   ├── components/     可复用组件（按功能模块分子目录）
│   ├── composables/    组合式逻辑封装
│   ├── constants/      前端常量（路由名、枚举等）
│   ├── plugins/        Vue 插件注册
│   ├── router/         路由（index.ts + modules/ 按功能拆分）
│   ├── stores/         Pinia 状态管理（按功能模块拆分）
│   ├── types/          TypeScript 类型定义
│   ├── utils/          工具函数
│   └── views/          页面视图（按功能模块分子目录）
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```
