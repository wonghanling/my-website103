// 支付配置
module.exports = {
    // 虎皮椒支付配置
    xunhupay: {
        appId: process.env.XUNHUPAY_APP_ID || '2019061738479',
        appSecret: process.env.XUNHUPAY_SECRET || 'dc385b31f51cf922a51b4c28a370662',
        gateway: 'https://api.xunhupay.com/payment/do.html',
        notifyUrl: process.env.BASE_URL ? `${process.env.BASE_URL}/api/payment/xunhupay/notify` : 'https://trreys.com/api/payment/xunhupay/notify'
    },
    
    // 微信支付配置（保留备用）
    wechat: {
        appId: process.env.WECHAT_APP_ID || 'demo_app_id',
        mchId: process.env.WECHAT_MCH_ID || 'demo_mch_id',
        key: process.env.WECHAT_KEY || 'demo_key',
        secret: process.env.WECHAT_SECRET || 'demo_secret',
        notifyUrl: process.env.BASE_URL ? `${process.env.BASE_URL}/api/payment/wechat/notify` : 'https://demo.com/api/payment/wechat/notify'
    },
    
    // 通用配置
    baseUrl: process.env.BASE_URL || 'https://trreys.com',
    prices: {
        annualReport: 130,    // 130元，虎皮椒按元计算
        licenseCancel: 199    // 199元，虎皮椒按元计算
    }
};
