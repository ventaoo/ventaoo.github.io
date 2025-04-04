import { ProductService, initializeSupabase } from './db.js';

const supabase_client = initializeSupabase() // init the client
const products = await ProductService.getProducts(supabase_client) // load the dataset
const system_language = navigator.language || navigator.languages[0];
const languageMap = {
    "zh": "zh",
    "en": "en",
    "ru": "ru"
};

const langCode = system_language.split('-')[0];  // 取 "zh-CN" 的 "zh"
const language = languageMap[langCode] || "en";  // 默认使用英文
console.log(language);

// app.js
let cart = {};

function formatWelcomeText(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, '<br>');
}

// 添加头部分数据加载
async function loadShopInfo() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        // 设置头部背景
        document.getElementById('siteHeader').style.setProperty('--header-bg', `url(${data.shopInfo.headerBg})`);
        
        // 填充文本内容
        document.getElementById('shopName').textContent = data.shopInfo.shopName;
        document.getElementById('welcomeText').innerHTML = formatWelcomeText(data.shopInfo.welcomeText);
        
        // 设置Telegram链接
        const tgLink = document.getElementById('telegramLink');
        tgLink.href = data.shopInfo.telegramLink;


    } catch (error) {
        console.error('加载店铺信息失败:', error);
    }
}

// 新增分类渲染函数
function renderCategories(categories) {
    const container = document.getElementById('categoriesList');
    
    // 生成分类按钮
    const buttons = categories.map(cat => `
        <button class="category-btn ${cat.id === 'all' ? 'active' : ''}" 
                data-category="${cat.id}">
            ${cat.name[language]}
        </button>
    `).join('');

    container.innerHTML = buttons;
    
    // 立即绑定事件监听
    container.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', handleCategoryClick);
    });
}

// 独立分类点击处理函数
function handleCategoryClick(e) {
    const btn = e.currentTarget;
    document.querySelector('.category-btn.active')?.classList.remove('active');
    btn.classList.add('active');
    filterProducts(btn.dataset.category);
}

async function loadProducts() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        const products_ = data.products.concat(products)
        
        // 修改后的加载顺序
        loadShopInfo();
        renderCategories(data.categories);  // 先加载分类
        renderProducts(products_);      // 再加载商品
        initEventListeners();
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

// 渲染商品列表
function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    container.innerHTML = products.map(product => `
        <div class="product-card" data-category="${product.category}">
            <div class="product-image" style="background-image: url('${product.image_url}')"></div>
            <div class="product-info">
                <h3>${product.name[language]}</h3>
                <p>${formatWelcomeText(product.description[language])}</p>
                <div class="product-footer">
                    <span class="product-price">${product.price}₽</span>
                    <div class="quantity-selector" data-id="${product.id}">
                        <button class="quantity-btn minus">-</button>
                        <span class="quantity">0</span>
                        <button class="quantity-btn plus">+</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// 初始化事件监听
function initEventListeners() {
    // 分类过滤
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.category-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            filterProducts(btn.dataset.category);
        });
    });

    // 购物车按钮
    document.getElementById('cartBtn').addEventListener('click', showCart);
    document.querySelector('.close-btn').addEventListener('click', hideCart);
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('cartModal')) {
            hideCart();
        }
    });

    // 使用事件委托处理动态生成的按钮
    document.getElementById('productsContainer').addEventListener('click', e => {
        const isMinus = e.target.classList.contains('minus');
        const isPlus = e.target.classList.contains('plus');
        
        if (isMinus || isPlus) {
            const selector = e.target.closest('.quantity-selector');
            const quantityElement = selector.querySelector('.quantity');
            const productId = selector.dataset.id;
            
            const current = parseInt(quantityElement.textContent); // 当前商品的数量
            
            let stock = 0
            if (productId != 0){ stock = products[productId - 1].stock }
            const newValue = Math.min(Math.max(0, current + (isMinus ? -1 : 1)), stock);
            
            quantityElement.textContent = newValue;
            cart[productId] = newValue;
            updateCartDisplay();
        }
    });
}

// 商品过滤功能
function filterProducts(category) {
    document.querySelectorAll('.product-card').forEach(product => {
        const productCategory = product.dataset.category;
        const shouldShow = category === 'all' || productCategory === category;
        product.style.display = shouldShow ? 'block' : 'none';
    });
}

// 更新购物车显示
function updateCartDisplay() {
    const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    const cartBtn = document.getElementById('cartBtn');
    
    cartBtn.style.display = totalItems > 0 ? 'block' : 'none';
    cartBtn.textContent = `Корзина (${totalItems})`;
}

document.querySelector('.checkout-btn').addEventListener('click', async () => {
    // 生成订单文本
    const items = Array.from(document.querySelectorAll('#cartItems li'))
        .map(li => {
            const name = li.querySelector('.name').textContent.trim();
            const num = li.querySelector('.num').textContent.trim();
            const price = li.querySelector('.price').textContent.trim();
            return `- ${name} ${num}\n${price}`
        })
        .join('\n');
    
    const total = document.getElementById('totalPrice').textContent;
    const orderText = `🛒 Список покупок:\n\`\`\`\n${items}\`\`\`\n💳 Итого: **${total}**`;

    // 现代剪贴板API
    try {
        await navigator.clipboard.writeText(orderText);
        showToast(`
            <span class="toast-main">Заказ скопирован в буфер!</span>
            <span class="toast-sub">Отправьте его мне в <a href="https://t.me/zwtttttt" target="_blank" class="telegram-link-copy">Telegram</a></span>
          `, false, 4000);
    } catch (err) {
        // 兼容旧浏览器的备用方案
        const textarea = document.createElement('textarea');
        textarea.value = orderText;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            showToast(`
                <span class="toast-main">Заказ скопирован в буфер!</span>
                <span class="toast-sub">Отправьте его мне в <a href="https://t.me/zwtttttt" target="_blank" class="telegram-link-copy">Telegram</a></span>
              `, false, 4000);
        } catch (err) {
            showToast('Ошибка копирования', true);
        } finally {
            document.body.removeChild(textarea);
        }
    }
});

// 自定义弹窗函数（新增duration参数控制显示时间）
function showToast(message, isError = false, duration = 3000) {
    // 创建弹窗容器
    const toast = document.createElement('div');
    toast.className = `custom-toast ${isError ? 'error' : 'success'}`;
    
    // 弹窗内容结构
    toast.innerHTML = `
        <div class="toast-icon">${isError ? '✖️' : '💜'}</div>
        <div class="toast-content">
            <p>${message}</p>
            <div class="progress-bar"></div>
        </div>
    `;

    // 添加到页面
    document.body.appendChild(toast);

    // 触发入场动画
    setTimeout(() => toast.classList.add('show'), 10);

    // 自动消失逻辑
    const timer = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);

    // 进度条动画
    const progressBar = toast.querySelector('.progress-bar');
    progressBar.style.animation = `progress ${duration}ms linear`;

    // 点击立即关闭
    toast.addEventListener('click', () => {
        clearTimeout(timer);
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
}

// 显示购物车详情
async function showCart() {
    const modal = document.getElementById('cartModal');
    const cartItems = document.getElementById('cartItems');
    
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        const products_ = data.products.concat(products)
        
        const cartEntries = products_
            .filter(p => cart[p.id] > 0)
            .map(p => ({
                ...p,
                quantity: cart[p.id],
                subtotal: p.price * cart[p.id]
            }));

        cartItems.innerHTML = cartEntries.map(item => `
            <li class="cart-item">
                <div>
                    <p class='name'>${item.name[language]}</p>
                    <p class='num'>${item.price} × ${item.quantity}</p>
                </div>
                <p class='price'>${formatCurrency(item.subtotal)}</p>
            </li>
        `).join('');

        const total = cartEntries.reduce((sum, item) => sum + item.subtotal, 0);
        document.getElementById('totalPrice').textContent = formatCurrency(total);
        modal.style.display = 'block';
    } catch (error) {
        console.error('加载购物车数据失败:', error);
    }
}

// 新增格式化函数
function formatCurrency(amount) {
    // 处理浮点精度问题并保留两位小数
    const fixedAmount = (Math.round(amount * 100) / 100).toFixed(2);
    
    // 添加俄语格式：用逗号作为小数分隔符，空格作为千位分隔符
    return fixedAmount
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '₽';
}

// 隐藏购物车
function hideCart() {
    document.getElementById('cartModal').style.display = 'none';
}

// 初始化加载
loadProducts();