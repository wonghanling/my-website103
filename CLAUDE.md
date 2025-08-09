# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个企业年报申报服务平台，提供年报申报和营业执照注销服务。项目包含前端静态页面和后端Node.js API，支持支付宝和微信支付集成。

## 常用开发命令

### 开发环境
```bash
# 安装依赖
npm install

# 启动开发服务器（带自动重启）
npm run dev

# 启动生产服务器
npm start

# 健康检查
curl http://localhost:3000/api/health
```

### 生产部署
```bash
# 使用PM2启动服务
pm2 start src/server/app.js --name "payment-api"

# 查看PM2状态
pm2 status

# 查看日志
pm2 logs payment-api

# 重启服务
pm2 restart payment-api
```

### 服务器初始化（腾讯云）
```bash
# 运行初始化脚本
chmod +x deploy/tencent-setup.sh
./deploy/tencent-setup.sh

# 配置Nginx
sudo cp deploy/tencent-nginx.conf /etc/nginx/sites-available/your-domain
sudo ln -s /etc/nginx/sites-available/your-domain /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 项目架构

### 前端页面结构
```
├── index.html          # 服务选择主页
├── form.html          # 企业信息填写表单
├── payment.html       # 支付页面
├── success.html       # 支付成功页面
├── admin-login.html   # 管理员登录
└── admin-dashboard.html # 管理员仪表板
```

### 后端API结构
```
src/server/
├── app.js             # Express应用入口
├── config/
│   └── payment.js     # 支付配置（微信、支付宝）
└── routes/
    ├── alipay.js      # 支付宝支付路由
    └── wechat.js      # 微信支付路由
```

### 核心功能模块

1. **服务选择模块** (`index.html`)
   - 年报申报服务（¥130）
   - 营业执照注销服务（¥199）
   - 服务协议确认

2. **表单收集模块** (`form.html`)
   - 企业基本信息收集
   - 联系人信息验证
   - 数据本地存储

3. **支付处理模块** (`payment.html`, `src/server/routes/`)
   - 支付宝扫码支付
   - 微信扫码支付
   - 支付状态查询

4. **管理系统** (`admin-*.html`)
   - 订单管理
   - 支付状态监控

## 支付集成

### 支付宝集成要点
- 使用 `alipay-sdk` 包
- 支持扫码支付(`alipay.trade.precreate`)
- 订单查询(`alipay.trade.query`)
- 异步回调处理(`/api/payment/xunhupay/notify`)

### 微信支付集成要点  
- 需要微信商户号和API证书
- 支持NATIVE扫码支付
- 订单状态查询
- 异步回调处理(`/api/payment/wechat/notify`)

### 关键配置文件
- `src/server/config/payment.js` - 支付参数配置
- `.env` - 环境变量（数据库、API密钥等）

## 部署配置

### Nginx配置特点
- HTTP自动重定向HTTPS
- 静态文件缓存优化
- API代理到Node.js(3000端口)
- 支付回调特殊超时设置
- 安全头配置

### SSL/HTTPS要求
- 支付接口必须使用HTTPS
- 推荐使用Let's Encrypt免费证书
- 配置文件：`deploy/tencent-nginx.conf`

## 数据库设计

项目需要MySQL数据库，主要表结构：
```sql
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    service_type ENUM('annualReport', 'licenseCancel'),
    amount INT NOT NULL,
    company_name VARCHAR(255),
    contact_person VARCHAR(50),
    payment_method ENUM('wechat', 'alipay'),
    payment_status ENUM('pending', 'paid', 'failed'),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 开发注意事项

### 安全要求
- 所有支付相关接口必须HTTPS
- API密钥和证书不能提交到代码仓库
- 支付回调需要签名验证
- 用户输入需要验证和过滤

### 测试流程
1. 本地开发：使用支付沙箱环境测试
2. 部署测试：小额真实支付测试
3. 生产发布：完整功能测试

### 监控要点
- 支付成功率监控
- API响应时间监控  
- 异常订单告警
- 服务器资源监控

## 文档参考

- 真实支付集成详细步骤：`真实支付集成指南.md`
- 腾讯云部署完整配置：`deploy/`目录

## 项目特色

- 移动端响应式设计
- 渐进式信息收集流程
- 双支付通道保障
- 完整的订单管理系统
- 企业服务合规提醒