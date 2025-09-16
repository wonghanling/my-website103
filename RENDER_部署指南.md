# Render 部署指南

## 部署步骤

### 1. 推送代码到GitHub
确保以下文件都已提交到GitHub仓库：
- package.json
- render.yaml  
- src/ 目录（包含所有服务器代码）
- 所有HTML文件
- .gitignore

### 2. 在Render上创建Web服务
1. 登录 https://render.com
2. 点击 "New" -> "Web Service"
3. 连接您的GitHub仓库
4. 选择您的项目仓库

### 3. 配置部署设置
- **Name**: annual-report-service
- **Environment**: Node
- **Build Command**: npm install
- **Start Command**: npm start

### 4. 设置环境变量（可选）
在Render控制台的Environment Variables部分添加：
- BASE_URL: 您的Render域名（例如：https://your-app.onrender.com）

### 5. 部署
点击 "Create Web Service" 开始部署

## 常见问题

### 问题1：找不到模块错误
确保package.json中的start命令指向正确的文件路径：
```json
"start": "node src/server/app.js"
```

### 问题2：502错误
- 检查应用是否正在监听正确的端口
- 确保代码中使用了 process.env.PORT
- 检查依赖项是否正确安装

### 问题3：支付功能异常
- 在Render环境变量中配置真实的支付API密钥
- 确保回调URL指向Render域名

## 测试部署
部署成功后，您可以通过以下方式测试：
- 访问 `/api/health` 检查服务状态
- 访问主页查看界面是否正常显示