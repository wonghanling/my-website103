const AlipaySdk = require('alipay-sdk').default;

// 延迟初始化支付宝SDK
let alipaySdk = null;

function getAlipaySdk() {
  if (!alipaySdk) {
    if (!process.env.ALIPAY_APP_ID || !process.env.ALIPAY_PRIVATE_KEY || !process.env.ALIPAY_PUBLIC_KEY) {
      throw new Error('支付宝配置未完成，请在Vercel配置环境变量');
    }

    alipaySdk = new AlipaySdk({
      appId: process.env.ALIPAY_APP_ID,
      privateKey: process.env.ALIPAY_PRIVATE_KEY,
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
      gateway: 'https://openapi.alipay.com/gateway.do',
      signType: 'RSA2',
      charset: 'utf-8',
      version: '1.0',
    });
  }
  return alipaySdk;
}

// 设备类型检测
function isMobile(userAgent) {
  return /mobile|android|iphone|ipad|phone/i.test(userAgent || '');
}

// 创建PC端支付
async function createPCPayment(params) {
  const sdk = getAlipaySdk();
  const result = await sdk.pageExec('alipay.trade.page.pay', {
    bizContent: {
      out_trade_no: params.outTradeNo,
      product_code: 'FAST_INSTANT_TRADE_PAY',
      total_amount: params.totalAmount,
      subject: params.subject,
      body: params.body || params.subject,
    },
    returnUrl: params.returnUrl,
    notifyUrl: params.notifyUrl,
  });
  return result;
}

// 创建移动端支付
async function createMobilePayment(params) {
  const sdk = getAlipaySdk();
  const result = await sdk.pageExec('alipay.trade.wap.pay', {
    bizContent: {
      out_trade_no: params.outTradeNo,
      product_code: 'QUICK_WAP_WAY',
      total_amount: params.totalAmount,
      subject: params.subject,
      body: params.body || params.subject,
    },
    returnUrl: params.returnUrl,
    notifyUrl: params.notifyUrl,
  });
  return result;
}

// 生成订单号（年审表代账专用，使用YEAR前缀）
function generateOrderNo() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `YEAR${timestamp}${random}`;
}

module.exports = {
  getAlipaySdk,
  isMobile,
  createPCPayment,
  createMobilePayment,
  generateOrderNo,
};
