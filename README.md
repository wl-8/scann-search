# 软件工程大作业 · scann-search

**面向单细胞高维向量数据的近似最近邻（ANN）检索系统**

开发一个面向单细胞高维向量数据的近似最近邻（ANN）检索系统，为大规模单细胞数据提供高效的相似样本检索能力。系统支持单细胞数据的读取与预处理、精确检索与近似检索、多种索引结构管理、查询结果展示以及性能评测等功能。

---

## 技术栈

| | 技术 |
|---|---|
| 后端 | FastAPI · SQLAlchemy · FAISS |
| 前端 | Vue 3 · Pinia · Ant Design Vue · Plotly |
| 数据格式 | .h5ad / .csv / .npy |

## 目录结构

```
scann-search/
├── backend/      FastAPI 后端
├── frontend/     Vue 3 前端
├── docs/         开发文档
└── README.md
```

## 快速启动

```bash
# 后端
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# 前端
cd frontend && npm install && npm run dev
```
