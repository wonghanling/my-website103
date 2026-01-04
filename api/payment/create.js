const { createPCPayment, createMobilePayment, isMobile, generateOrderNo } = require('../../lib/alipay');
const { createClient } = require('@supabase/supabase-js');

// 初始化Supabase客户端
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://mtotipilbjlkducccnko.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_hI-vAHNFQpWeyUR0O3-_0Q_JeqQ7qWH'
);

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

    const { serviceType, amount, orderId, companyName, contactPhone, enterpriseSubmissionId } = body;

    console.log('收到支付请求:', { serviceType, amount, orderId, companyName }); // 调试日志

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

    // 保存订单到Supabase
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_no: orderId,
        alipay_order_no: alipayOrderNo,
        enterprise_submission_id: enterpriseSubmissionId || null,
        company_name: companyName || '未提供',
        contact_phone: contactPhone || '未提供',
        service_type: serviceType,
        service_name: subject,
        amount: parseFloat(amount),
        payment_status: 'pending',
        payment_method: 'alipay'
      }])
      .select();

    if (orderError) {
      console.error('保存订单失败:', orderError);
      // 不中断流程，继续创建支付
    } else {
      console.log('订单已保存:', orderData);
    }

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
