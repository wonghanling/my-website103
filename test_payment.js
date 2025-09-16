// 虎皮椒支付测试文件
const config = require('./src/server/config/payment');

console.log('虎皮椒配置测试:');
console.log('App ID:', config.xunhupay.appId);
console.log('Gateway:', config.xunhupay.gateway);
console.log('Notify URL:', config.xunhupay.notifyUrl);
console.log('价格配置:');
console.log('年报申报:', config.prices.annualReport, '元');
console.log('营业执照注销:', config.prices.licenseCancel, '元');

// 测试MD5签名函数
const crypto = require('crypto');

function getHash(params, appSecret) {
    const sortedParams = Object.keys(params)
        .filter(key => params[key] && key !== 'hash')
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    const stringSignTemp = sortedParams + appSecret;
    const hash = crypto.createHash('md5').update(stringSignTemp).digest('hex');
    return hash;
}

// 测试签名
const testParams = {
    version: '1.1',
    appid: config.xunhupay.appId,
    trade_order_id: 'TEST001',
    total_fee: 130,
    title: '测试订单',
    time: Math.floor(Date.now() / 1000),
    type: 'WAP'
};

const testHash = getHash(testParams, config.xunhupay.appSecret);
console.log('测试签名:', testHash);
console.log('配置测试完成✓');