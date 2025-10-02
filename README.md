# iFlow - 智能笔记与AI助手集成平台

iFlow是一个集成了AI助手的现代化笔记应用，提供多标签页文档编辑、实时Markdown预览、智能AI对话等功能。用户可以在编辑文档的同时与AI助手进行交互，获得基于文档内容的智能建议和帮助。

## 功能特性

### 📝 文档管理
- 多标签页文档编辑，类似浏览器的标签页体验
- 实时Markdown编辑与预览
- 自动保存功能（5秒间隔保存和2秒空闲保存）
- 文档持久化存储

### 📁 文件管理
- 树状目录结构管理
- 支持文件夹展开/折叠
- 新建文件和文件夹功能
- 文档区与目录区完全联动

### 🤖 AI助手集成
- 基于阿里云百炼平台的Qwen-Plus大模型
- AI助手可根据当前文档内容提供相关建议
- 实时聊天交互体验
- 消息历史记录

### 🎨 现代化UI设计
- 响应式布局设计
- 优雅的渐变色彩方案
- 平滑的动画过渡效果
- 直观的用户交互体验

## 技术架构

### 前端技术栈
- **React 18** - 现代化JavaScript库用于构建用户界面
- **Axios** - HTTP客户端用于与后端API通信
- **CSS3** - 现代化样式和动画效果
- **Create React App** - 项目脚手架工具

### 后端技术栈
- **FastAPI** - 现代、快速（高性能）的Python Web框架
- **Pydantic** - 数据验证和设置管理
- **Uvicorn** - ASGI服务器实现
- **OpenAI SDK** - 用于与阿里云百炼API集成

### 数据存储
- 本地JSON文件存储（开发环境）
- 文档以独立JSON文件形式保存

## 项目结构

```
iFlow/
├── src/                    # 前端源代码
│   ├── App.js             # 主应用组件
│   ├── App.css            # 样式文件
│   └── ...                # 其他前端文件
├── fastapi_backend/       # 后端源代码
│   ├── main.py            # FastAPI应用入口
│   ├── models/            # 数据模型定义
│   ├── routes/            # API路由
│   ├── documents/         # 文档存储目录
│   ├── requirements.txt   # Python依赖
│   └── ...                # 其他后端文件
├── package.json           # 前端依赖配置
└── README.md              # 项目说明文档
```

## 快速开始

### 前端环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0

### 后端环境要求
- Python >= 3.8
- pip >= 20.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd iFlow
```

2. **安装前端依赖**
```bash
npm install
```

3. **设置后端环境**
```bash
cd fastapi_backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

4. **安装AI依赖**
```bash
pip install openai
```

### 启动应用

1. **启动后端服务**
```bash
cd fastapi_backend
source venv/bin/activate
python main.py
```
后端服务将在 `http://localhost:8000` 运行

2. **启动前端应用**
```bash
cd ..
npm start
```
前端应用将在 `http://localhost:3000` 运行

### API文档

后端提供完整的API文档：
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API接口

### 文档管理接口
- `GET /api/documents/` - 获取所有文档列表
- `POST /api/documents/` - 创建新文档
- `GET /api/documents/{doc_id}` - 获取指定文档
- `PUT /api/documents/{doc_id}` - 更新指定文档
- `DELETE /api/documents/{doc_id}` - 删除指定文档

### AI聊天接口
- `POST /api/chat/message` - 发送聊天消息并获取AI回复

## 开发指南

### 代码规范
- 前端遵循ESLint规范
- 后端遵循PEP 8 Python代码规范
- 使用语义化提交信息

### 项目配置

#### 前端配置
- API基础URL: `http://localhost:8000/api/`
- 自动保存间隔: 5秒
- 空闲保存时间: 2秒

#### 后端配置
- 服务器端口: 8000
- CORS配置: 允许所有来源（开发环境）
- 文档存储目录: `fastapi_backend/documents/`

### 环境变量
```bash
# 后端环境变量
API_KEY=your_aliyun_bailian_api_key  # 阿里云百炼API密钥
```

## 部署说明

### 生产环境部署建议

1. **后端部署**
```bash
# 使用Gunicorn部署
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

2. **前端部署**
```bash
# 构建生产版本
npm run build
```

3. **Nginx配置示例**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 贡献指南

欢迎任何形式的贡献！请遵循以下步骤：

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 开发流程
1. 确保代码符合规范
2. 添加必要的测试
3. 更新文档
4. 提交前运行测试

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

项目链接: [https://github.com/your-username/iFlow](https://github.com/your-username/iFlow)

## 致谢

- [React](https://reactjs.org/) - 用于构建用户界面的JavaScript库
- [FastAPI](https://fastapi.tiangolo.com/) - 现代、快速的Python Web框架
- [阿里云百炼](https://help.aliyun.com/zh/model-studio) - 提供强大的AI模型支持
- [Create React App](https://github.com/facebook/create-react-app) - 项目脚手架工具