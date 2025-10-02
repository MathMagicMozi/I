# iFlow Backend API

基于FastAPI的后端服务，为iFlow应用提供文档管理和AI对话功能。

## 功能特性

1. 文档保存
2. 文档新建
3. 文档读取
4. 大模型对话

## 项目结构

```
fastapi_backend/
├── main.py              # 应用入口
├── requirements.txt     # 项目依赖
├── models/              # 数据模型
│   ├── document.py      # 文档模型
│   └── chat.py          # 聊天模型
├── routes/              # API路由
│   ├── documents.py     # 文档相关接口
│   └── chat.py          # 聊天相关接口
└── utils/               # 工具函数
```

## 安装依赖

```bash
pip install -r requirements.txt
```

## 运行项目

```bash
# 使用uvicorn运行
uvicorn main:app --reload

# 或者直接运行main.py
python main.py
```

## API接口

### 文档管理

- `POST /api/documents/` - 创建新文档
- `GET /api/documents/` - 获取所有文档列表
- `GET /api/documents/{doc_id}` - 获取指定文档
- `PUT /api/documents/{doc_id}` - 更新指定文档
- `DELETE /api/documents/{doc_id}` - 删除指定文档

### AI对话

- `POST /api/chat/message` - 与AI进行对话

## 文档存储

文档以JSON格式存储在`documents/`目录中。