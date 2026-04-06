import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const SUPABASE_URL = 'https://hpwqtlxrfezpnxpgwlsx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwd3F0bHhyZmV6cG54cGd3bHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NDk2MzAsImV4cCI6MjA5MTAyNTYzMH0._yAiiFxsZbsOHf9ItMYU9ZRuNLjVDEbdZFwyh7U6C9w'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

let categories = []
let photos = []

document.addEventListener('DOMContentLoaded', () => {
    loadCategories()
    loadPhotos()
    
    let searchTimeout
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(loadPhotos, 300)
    })
    
    document.getElementById('uploadForm').addEventListener('submit', handleUpload)
})

async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (error) throw error
        
        categories = data || []
        renderCategories()
        updateCategorySelects()
    } catch (err) {
        console.error('加载分类失败:', err)
        alert('加载分类失败: ' + err.message)
    }
}

async function loadPhotos() {
    const categoryFilter = document.getElementById('filterCategory').value
    const search = document.getElementById('searchInput').value
    
    try {
        let query = supabase
            .from('photos')
            .select('*, categories(name)')
            .order('created_at', { ascending: false })
        
        if (categoryFilter && categoryFilter !== 'all') {
            query = query.eq('category_id', categoryFilter)
        }
        
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        }
        
        const { data, error } = await query
        
        if (error) throw error
        
        photos = data || []
        renderPhotos()
    } catch (err) {
        console.error('加载照片失败:', err)
        alert('加载照片失败: ' + err.message)
    }
}

function renderCategories() {
    const container = document.getElementById('categoryList')
    
    if (categories.length === 0) {
        container.innerHTML = '<p style="color:#999;font-size:14px;">暂无分类</p>'
        return
    }
    
    container.innerHTML = categories.map(cat => {
        const count = photos.filter(p => p.category_id === cat.id).length
        return `
            <div class="category-tag">
                <span>${cat.name}</span>
                <span class="count">${count}</span>
                <button class="btn-danger" onclick="window.deleteCategory('${cat.id}')" title="删除">×</button>
            </div>
        `
    }).join('')
}

function updateCategorySelects() {
    const uploadSelect = document.getElementById('categorySelect')
    const filterSelect = document.getElementById('filterCategory')
    
    const options = categories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('')
    
    uploadSelect.innerHTML = `<option value="">选择分类（可选）</option>${options}`
    filterSelect.innerHTML = `<option value="all">全部分类</option>${options}`
}

window.createCategory = async function() {
    const input = document.getElementById('newCategory')
    const name = input.value.trim()
    
    if (!name) {
        alert('请输入分类名称')
        return
    }
    
    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([{ name }])
            .select()
            .single()
        
        if (error) throw error
        
        input.value = ''
        await loadCategories()
    } catch (err) {
        alert('创建分类失败: ' + err.message)
    }
}

window.deleteCategory = async function(id) {
    if (!confirm('确定删除该分类？照片不会删除')) return
    
    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)
        
        if (error) throw error
        
        await loadCategories()
        await loadPhotos()
    } catch (err) {
        alert('删除分类失败: ' + err.message)
    }
}

async function handleUpload(e) {
    e.preventDefault()
    
    const fileInput = document.getElementById('photoInput')
    const file = fileInput.files[0]
    
    if (!file) {
        alert('请选择照片')
        return
    }
    
    const name = document.getElementById('photoName').value.trim() || file.name
    const description = document.getElementById('photoDesc').value.trim()
    const categoryId = document.getElementById('categorySelect').value || null
    
    const btn = e.target.querySelector('button[type="submit"]')
    btn.disabled = true
    btn.textContent = '上传中...'
    
    try {
        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`
        const storagePath = `${fileName}`
        
        const { error: uploadError } = await supabase.storage
            .from('photo')
            .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: false
            })
        
        if (uploadError) throw uploadError
        
        const { data: urlData } = supabase.storage
            .from('photo')
            .getPublicUrl(storagePath)
        
        const { error: insertError } = await supabase
            .from('photos')
            .insert([{
                name,
                description,
                category_id: categoryId,
                storage_path: storagePath,
                original_name: file.name,
                size: file.size
            }])
        
        if (insertError) throw insertError
        
        fileInput.value = ''
        document.getElementById('photoName').value = ''
        document.getElementById('photoDesc').value = ''
        document.getElementById('categorySelect').value = ''
        
        await loadPhotos()
        await loadCategories()
        
        alert('上传成功！')
    } catch (err) {
        alert('上传失败: ' + err.message)
    } finally {
        btn.disabled = false
        btn.textContent = '上传'
    }
}

function getPhotoUrl(storagePath) {
    const { data } = supabase.storage
        .from('photo')
        .getPublicUrl(storagePath)
    return data.publicUrl
}

function renderPhotos() {
    const grid = document.getElementById('photoGrid')
    const empty = document.getElementById('emptyState')
    
    if (photos.length === 0) {
        grid.style.display = 'none'
        empty.style.display = 'block'
        return
    }
    
    grid.style.display = 'grid'
    empty.style.display = 'none'
    
    grid.innerHTML = photos.map(photo => {
        const photoUrl = getPhotoUrl(photo.storage_path)
        return `
            <div class="photo-card">
                <img src="${photoUrl}" alt="${photo.name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>🖼️</text></svg>'">
                <div class="photo-info">
                    <h3 title="${photo.name}">${photo.name}</h3>
                    ${photo.description ? `<p>${photo.description}</p>` : ''}
                    <div class="photo-meta">
                        ${photo.categories 
                            ? `<span class="photo-category">${photo.categories.name}</span>` 
                            : '<span class="photo-category" style="background:#e9ecef">未分类</span>'
                        }
                        <div class="photo-actions">
                            <button class="btn-delete" onclick="window.deletePhoto('${photo.id}', '${photo.storage_path}')" title="删除">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>
        `
    }).join('')
}

window.deletePhoto = async function(id, storagePath) {
    if (!confirm('确定删除该照片？')) return
    
    try {
        const { error: storageError } = await supabase.storage
            .from('photo')
            .remove([storagePath])
        
        if (storageError) throw storageError
        
        const { error: deleteError } = await supabase
            .from('photos')
            .delete()
            .eq('id', id)
        
        if (deleteError) throw deleteError
        
        await loadPhotos()
        await loadCategories()
    } catch (err) {
        alert('删除失败: ' + err.message)
    }
}
