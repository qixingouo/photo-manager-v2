// This script generates config.js from environment variables during deployment.
// Set SUPABASE_URL and SUPABASE_ANON_KEY in your Vercel project settings.
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const SUPABASE_STORAGE_URL = process.env.SUPABASE_STORAGE_URL || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('错误：请在 Vercel 项目设置中配置环境变量 SUPABASE_URL 和 SUPABASE_ANON_KEY')
    process.exit(1)
}

const lines = [
    `window.__APP_CONFIG__ = {`,
    `    SUPABASE_URL: '${SUPABASE_URL}',`,
    `    SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',`,
]

if (SUPABASE_STORAGE_URL) {
    lines.push(`    SUPABASE_STORAGE_URL: '${SUPABASE_STORAGE_URL}',`)
}

lines.push(`}`)

const content = lines.join('\n') + '\n'
const outputPath = path.join(__dirname, '..', 'config.js')
fs.writeFileSync(outputPath, content, 'utf8')
console.log('config.js 已生成')
