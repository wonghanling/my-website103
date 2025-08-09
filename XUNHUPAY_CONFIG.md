# 虎皮椒支付环境变量配置说明

## 在Render部署时需要设置的环境变量

在Render的Environment Variables中添加以下配置：

### 虎皮椒支付配置
```
XUNHUPAY_APP_ID=你的虎皮椒应用ID
XUNHUPAY_SECRET=你的虎皮椒密钥
BASE_URL=https://trreys.com
```

### 配置步骤
1. 登录Render控制台
2. 进入你的服务设置页面
3. 找到Environment Variables部分
4. 添加上述三个环境变量
5. 点击Save Changes
6. 服务会自动重启并使用新配置

### 重要说明
- 如果不设置环境变量，系统会使用默认的测试配置
- BASE_URL用于设置支付回调地址
- 确保虎皮椒后台设置的回调地址为：https://trreys.com/api/payment/xunhupay/notify

### 支付接口路径
- 创建订单：POST /api/payment/xunhupay/create-order
- 支付回调：POST /api/payment/xunhupay/notify  
- 查询订单：GET /api/payment/xunhupay/query/:orderId

### 支付参数
- 年报申报服务：130元
- 营业执照注销服务：199元