// app.js
let cart = {};

// 添加头部分数据加载
async function loadShopInfo() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        // 设置头部背景
        document.getElementById('siteHeader').style.setProperty('--header-bg', `url(${data.shopInfo.headerBg})`);
        
        // 填充文本内容
        document.getElementById('shopName').textContent = data.shopInfo.shopName;
        document.getElementById('welcomeText').textContent = data.shopInfo.welcomeText;
        
        // 设置Telegram链接
        const tgLink = document.getElementById('telegramLink');
        tgLink.href = data.shopInfo.telegramLink;


    } catch (error) {
        console.error('加载店铺信息失败:', error);
    }
}

// 修改初始化函数
async function loadProducts() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        loadShopInfo(); // 加载店铺信息
        renderProducts(data.products);
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
            <div class="product-image" style="background-image: url('${product.image}')"></div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">¥${product.price}</span>
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
            
            const current = parseInt(quantityElement.textContent);
            const newValue = Math.max(0, current + (isMinus ? -1 : 1));
            
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
    cartBtn.textContent = `查看购物车 (${totalItems})`;
}

// 显示购物车详情
async function showCart() {
    const modal = document.getElementById('cartModal');
    const cartItems = document.getElementById('cartItems');
    
    try {
        const response = await fetch('data.json');
        const products = await response.json();
        
        const cartEntries = products
            .filter(p => cart[p.id] > 0)
            .map(p => ({
                ...p,
                quantity: cart[p.id],
                subtotal: p.price * cart[p.id]
            }));

        cartItems.innerHTML = cartEntries.map(item => `
            <li class="cart-item">
                <div>
                    <h4>${item.name}</h4>
                    <p>¥${item.price} × ${item.quantity}</p>
                </div>
                <p>¥${item.subtotal}</p>
            </li>
        `).join('');

        const total = cartEntries.reduce((sum, item) => sum + item.subtotal, 0);
        document.getElementById('totalPrice').textContent = total;
        modal.style.display = 'block';
    } catch (error) {
        console.error('加载购物车数据失败:', error);
    }
}

// 隐藏购物车
function hideCart() {
    document.getElementById('cartModal').style.display = 'none';
}

// 初始化加载
loadProducts();