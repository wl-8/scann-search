# Backend

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

```
backend/
├── app/
│   ├── main.py         FastAPI 入口，挂载所有路由
│   ├── core/           全局配置、JWT、公共依赖
│   ├── db/             数据库会话、Base、初始化脚本
│   ├── ann/            ANN 算法层（base 抽象类 + factory）
│   ├── auth/           注册 / 登录 / 登出
│   ├── users/          用户管理（管理员操作）
│   ├── datasets/       数据集上传与预处理
│   ├── index/          索引构建与管理
│   ├── search/         向量检索
│   ├── export/         结果导出
│   ├── visualize/      UMAP / PCA 可视化
│   └── benchmark/      算法性能评测
├── data/
│   ├── uploads/        上传的原始数据文件
│   └── indexes/        构建好的索引文件
├── migrations/         数据库迁移（Alembic）
├── scripts/            工具脚本
├── tests/              测试
├── .env.example
└── requirements.txt

每个业务模块内：router / service / models / schemas / constants / exceptions
```
