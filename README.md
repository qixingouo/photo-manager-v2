# 📷 照片分类管理系统

基于 Supabase 的照片分类管理网站，支持上传、分类、搜索和删除照片。

## 功能

- 📤 上传照片（支持 jpg/png/gif/webp）
- 📁 创建/删除分类
- 🔍 按分类筛选
- 🔎 搜索照片
- 🗑️ 删除照片

## 技术栈

- **前端**: HTML + CSS + JavaScript (ES6+)
- **后端**: Supabase (PostgreSQL + Storage)
- **部署**: Vercel

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 配置

在 `app.js` 中修改 Supabase 配置：

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'
```

## 数据库设置

需要在 Supabase 中创建以下表：

```sql
-- 分类表
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 照片表
CREATE TABLE photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    original_name TEXT,
    size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 开启 RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 设置权限
CREATE POLICY "Allow all access to categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to photos" ON photos FOR ALL USING (true) WITH CHECK (true);
```

## Storage Bucket

创建名为 `photos` 的公开 Storage Bucket。

## 部署到 Vercel

1. Fork 此仓库
2. 在 Vercel 中导入项目
3. 点击 Deploy

无需配置环境变量，因为使用的是公开的 anon key。
