-- 创建企业信息表
CREATE TABLE IF NOT EXISTS enterprise_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  social_credit_code TEXT NOT NULL,
  legal_person_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  selected_service TEXT DEFAULT '年报申报',
  selected_price INTEGER DEFAULT 130,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE enterprise_submissions ENABLE ROW LEVEL SECURITY;

-- 创建允许插入的策略（允许任何人提交）
CREATE POLICY "Allow public insert" ON enterprise_submissions
  FOR INSERT TO public
  WITH CHECK (true);

-- 创建允许查看数据的策略
CREATE POLICY "Allow view data" ON enterprise_submissions
  FOR SELECT TO public
  USING (true);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enterprise_submissions_updated_at
    BEFORE UPDATE ON enterprise_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_enterprise_submissions_created_at ON enterprise_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_submissions_social_credit_code ON enterprise_submissions(social_credit_code);