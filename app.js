const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './')));

// 路由
const wechatRoutes = require('./wechat');
const alipayRoutes = require('./alipay');

app.use('/api/payment/wechat', wechatRoutes);
app.use('/api/payment/alipay', alipayRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        port: PORT,
        env: process.env.NODE_ENV || 'development'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`访问地址: http://localhost:${PORT}`);
    console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});
