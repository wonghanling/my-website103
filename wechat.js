const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const router = express.Router();
const config = require('./payment');

// 微信支付统一下单
router.post('/create-order', async (req, res) => {
    try {
        const { serviceType, amount, orderId } = req.body;
        
        // 参数验证
        if (!serviceType || !amount || !orderId) {
            return res.status(400).json({ error: '参数不完整' });
        }

        const params = {
            appid: config.wechat.appId,
            mch_id: config.wechat.mchId,
            nonce_str: Math.random().toString(36).substr(2, 15),
            body: serviceType === 'annualReport' ? '企业年报申报' : '营业执照注销',
            out_trade_no: orderId,
            total_fee: amount,
            spbill_create_ip: req.ip.replace('::ffff:', ''),
            notify_url: config.wechat.notifyUrl,
            trade_type: 'NATIVE'
        };

        // 生成签名
        const sign = generateSign(params, config.wechat.key);
        params.sign = sign;

        // 转换为XML
        const xmlData = objToXml(params);

        // 调用微信支付接口
        const response = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', xmlData, {
            headers: { 'Content-Type': 'application/xml' }
        });

        // 解析返回的XML
        const result = xmlToObj(response.data);
        
        if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
            res.json({
                success: true,
                code_url: result.code_url,
                orderId: orderId
            });
        } else {
            res.json({
                success: false,
                error: result.return_msg || result.err_code_des
            });
        }
    } catch (error) {
        console.error('微信支付下单失败:', error);
        res.status(500).json({ error: '系统错误' });
    }
});

// 微信支付回调
router.post('/notify', async (req, res) => {
    try {
        const xmlData = req.body;
        const result = xmlToObj(xmlData);
        
        if (result.return_code === 'SUCCESS') {
            // 验证签名
            const sign = result.sign;
            delete result.sign;
            const expectedSign = generateSign(result, config.wechat.key);
            
            if (sign === expectedSign) {
                // 更新订单状态
                const orderId = result.out_trade_no;
                // 这里更新数据库订单状态为已支付
                
                res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
            }
        }
    } catch (error) {
        console.error('微信支付回调处理失败:', error);
        res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[系统错误]]></return_msg></xml>');
    }
});

// 查询订单状态
router.get('/query/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const params = {
            appid: config.wechat.appId,
            mch_id: config.wechat.mchId,
            out_trade_no: orderId,
            nonce_str: Math.random().toString(36).substr(2, 15)
        };

        params.sign = generateSign(params, config.wechat.key);
        const xmlData = objToXml(params);

        const response = await axios.post('https://api.mch.weixin.qq.com/pay/orderquery', xmlData, {
            headers: { 'Content-Type': 'application/xml' }
        });

        const result = xmlToObj(response.data);
        res.json({
            success: true,
            status: result.trade_state,
            orderId: orderId
        });
    } catch (error) {
        console.error('查询订单失败:', error);
        res.status(500).json({ error: '系统错误' });
    }
});

// 工具函数
function generateSign(params, key) {
    const sortedParams = Object.keys(params).sort().reduce((result, key) => {
        if (params[key] !== '' && key !== 'sign') {
            result[key] = params[key];
        }
        return result;
    }, {});

    const stringA = Object.keys(sortedParams).map(key => `${key}=${sortedParams[key]}`).join('&');
    const stringSignTemp = `${stringA}&key=${key}`;
    return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
}

function objToXml(obj) {
    return `<xml>${Object.keys(obj).map(key => `<${key}><![CDATA[${obj[key]}]]></${key}>`).join('')}</xml>`;
}

function xmlToObj(xml) {
    // 简单的XML转对象实现
    const obj = {};
    const regex = /<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
        obj[match[1]] = match[2];
    }
    return obj;
}

module.exports = router;
