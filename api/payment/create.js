const { createPCPayment, createMobilePayment, isMobile, generateOrderNo } = require('../../lib/alipay');

// Vercel会自动解析body，但需要确保Content-Type正确
module.exports = async function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '仅支持POST请求' });
  }

  try {
    // 如果body是字符串，手动解析JSON
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { serviceType, amount, orderId } = body;

    console.log('收到支付请求:', { serviceType, amount, orderId }); // 调试日志

    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        error: `缺少必要参数 - amount: ${amount}, orderId: ${orderId}`
      });
    }

    // 生成支付宝订单号
    const alipayOrderNo = generateOrderNo();

    // 获取请求域名
    const host = req.headers.host || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // 服务类型映射
    const serviceNames = {
      annualReport: '年报申报服务',
      licenseCancel: '营业执照注销服务',
      zeroReport: '年代账980服务',
    };

    const subject = serviceNames[serviceType] || '企业服务';

    // 支付参数
    const paymentParams = {
      outTradeNo: alipayOrderNo,
      totalAmount: amount.toString(),
      subject: subject,
      body: `订单号:${orderId}, 服务类型:${subject}`,
      returnUrl: `${baseUrl}/payment/return.html?orderNo=${orderId}`,
      notifyUrl: `${baseUrl}/api/payment/notify`,
    };

    // 判断设备类型
    const userAgent = req.headers['user-agent'] || '';
    const isMobileDevice = isMobile(userAgent);

    // 创建支付
    let paymentUrl;
    if (isMobileDevice) {
      paymentUrl = await createMobilePayment(paymentParams);
    } else {
      paymentUrl = await createPCPayment(paymentParams);
    }

    return res.status(200).json({
      success: true,
      payment_url: paymentUrl,
      orderNo: alipayOrderNo,
      originalOrderId: orderId,
    });

  } catch (error) {
    console.error('创建支付订单失败:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '创建支付订单失败',
    });
  }
};
