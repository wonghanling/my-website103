#!/bin/bash
# 腾讯云服务器初始化脚本

echo "🚀 开始腾讯云服务器初始化..."

# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
echo "📦 安装必要软件..."
sudo apt install -y nginx nodejs npm mysql-server certbot python3-certbot-nginx

# 安装最新Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2进程管理器
sudo npm install -g pm2

# 创建项目目录
sudo mkdir -p /var/www/payment-system
sudo chown -R $USER:$USER /var/www/payment-system

# 安装MySQL并设置密码
echo "🔐 配置MySQL..."
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YourSecurePassword123!';"
sudo mysql -e "CREATE DATABASE IF NOT EXISTS payment_system;"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "✅ 基础软件安装完成！"
echo "MySQL密码已设置为: YourSecurePassword123!"
echo "请记得修改为自己的密码"
