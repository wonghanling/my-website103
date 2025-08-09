const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();
const config = require('./payment');

// 生成MD5签名
function getHash(params, appSecret) {
    const sortedParams = Object.keys(params)
        .filter(key => params[key] && key !== 'hash') // 过滤掉空值和hash本身
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    const stringSignTemp = sortedParams + appSecret;
    const hash = crypto.createHash('md5').update(stringSignTemp).digest('hex');
    return hash;
}

// 生成随机字符串
function generateNonceStr() {
    return Math.random().toString(36).substr(2, 15) + Date.now().toString(36);
}

// 获取当前时间戳
function nowDate() {
    return Math.floor(new Date().valueOf() / 1000);
}

// 创建虎皮椒支付订单
router.post('/create-order', async (req, res) => {
    try {
        const { serviceType, amount, orderId } = req.body;
        
        if (!serviceType || !amount || !orderId) {
            return res.status(400).json({ error: '参数不完整' });
        }

        // 获取服务名称和价格
        const title = serviceType === 'annualReport' ? '企业年报申报服务' : '营业执照注销服务';
        const totalFee = serviceType === 'annualReport' ? config.prices.annualReport : config.prices.licenseCancel;

        const params = {
            version: '1.1',
            appid: config.xunhupay.appId,
            trade_order_id: orderId,
            total_fee: totalFee,
            title: title,
            time: nowDate(),
            notify_url: config.xunhupay.notifyUrl,
            nonce_str: generateNonceStr(),
            type: 'WAP',
            wap_url: config.baseUrl,
            wap_name: '企业服务平台',
        };

        const hash = getHash(params, config.xunhupay.appSecret);

        // 发送支付请求
        const requestParams = new URLSearchParams({
            ...params,
            hash,
        });

        const response = await axios.post(config.xunhupay.gateway, requestParams, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        console.log('虎皮椒支付响应:', response.data);

        if (response.data && response.data.url) {
            res.json({
                success: true,
                payment_url: response.data.url,
                orderId: orderId,
                qr_code: response.data.url // 兼容前端
            });
        } else {
            res.json({
                success: false,
                error: response.data.error || '支付接口调用失败'
            });
        }

    } catch (error) {
        console.error('虎皮椒支付下单失败:', error);
        res.status(500).json({ error: '系统错误: ' + error.message });
    }
});

// 虎皮椒支付回调
router.post('/notify', async (req, res) => {
    try {
        const data = req.body || {};
        const appSecret = config.xunhupay.appSecret;
        
        console.log('收到虎皮椒回调:', data);

        // 验签
        if (data.hash !== getHash(data, appSecret)) {
            console.log('虎皮椒回调验签失败');
            res.send('fail');
            return;
        }

        if (data.status === 'OD') {
            console.log('支付成功, 订单号:', data.trade_order_id);
            // 这里可以更新数据库订单状态为已支付
            // 处理业务逻辑
            
            res.send('success');
        } else {
            console.log('支付未成功, 状态:', data.status);
            res.send('success'); // 即使未成功也要返回success给虎皮椒
        }

    } catch (error) {
        console.error('虎皮椒回调处理失败:', error);
        res.send('fail');
    }
});

// 查询订单状态（虎皮椒可能不支持主动查询，这里保留接口）
router.get('/query/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // 虎皮椒通常不提供主动查询接口，只能通过回调获取状态
        // 这里返回一个通用响应
        res.json({
            success: true,
            message: '请通过回调获取支付状态',
            orderId: orderId
        });

    } catch (error) {
        console.error('查询订单失败:', error);
        res.status(500).json({ error: '系统错误' });
    }
});

module.exports = router;
