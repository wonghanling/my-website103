const { getAlipaySdk } = require('../../lib/alipay');
const { createClient } = require('@supabase/supabase-js');

// 初始化Supabase客户端
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://mtotipilbjlkducccnko.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_hI-vAHNFQpWeyUR0O3-_0Q_JeqQ7qWH'
);

// Vercel Serverless Function处理支付宝异步通知
module.exports = async function handler(req, res) {
  // 仅允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    console.log('收到支付宝回调:', req.body);

    // 如果body是字符串，手动解析
    let params = req.body;
    if (typeof params === 'string') {
      // 支付宝回调是form-urlencoded格式
      params = Object.fromEntries(new URLSearchParams(params));
    }

    // 验证签名
    const sdk = getAlipaySdk();
    const signVerified = sdk.checkNotifySign(params);

    if (!signVerified) {
      console.error('支付宝签名验证失败');
      return res.status(400).send('fail');
    }

    console.log('签名验证成功');

    // 提取关键参数
    const {
      out_trade_no,      // 商户订单号 (YEAR开头)
      trade_no,          // 支付宝交易号
      trade_status,      // 交易状态
      buyer_id,          // 买家支付宝账号ID
      total_amount,      // 订单金额
    } = params;

    // 只处理支付成功的通知
    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      // 查找订单
      const { data: orders, error: findError } = await supabase
        .from('orders')
        .select('*')
        .eq('alipay_order_no', out_trade_no)
        .single();

      if (findError) {
        console.error('查找订单失败:', findError);
        return res.status(200).send('success'); // 返回success避免重复回调
      }

      if (!orders) {
        console.error('订单不存在:', out_trade_no);
        return res.status(200).send('success');
      }

      // 检查订单是否已经支付（避免重复处理）
      if (orders.payment_status === 'paid') {
        console.log('订单已支付，跳过处理:', out_trade_no);
        return res.status(200).send('success');
      }

      // 更新订单状态
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          alipay_trade_no: trade_no,
          alipay_buyer_id: buyer_id,
          alipay_callback_data: params,
        })
        .eq('alipay_order_no', out_trade_no);

      if (updateError) {
        console.error('更新订单状态失败:', updateError);
        return res.status(500).send('fail');
      }

      console.log('订单支付成功，已更新状态:', out_trade_no);
      return res.status(200).send('success');
    } else {
      console.log('交易状态不是成功:', trade_status);
      return res.status(200).send('success');
    }

  } catch (error) {
    console.error('处理支付回调失败:', error);
    return res.status(500).send('fail');
  }
};
