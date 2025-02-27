let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            renderProducts(data.products);
            initCartEvents();
        })
        .catch(error => console.error('Error:', error));
});

function renderProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';

    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = `
            <div class="img-container">
                <img src="${product.image}" alt="${product.name}">
                <div class="product-price">$${product.price.toFixed(2)}</div>
            </div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="quantity-controls">
                <button class="btn-decrease">-</button>
                <span class="quantity">0</span>
                <button class="btn-increase">+</button>
            </div>
            <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
        `;

        // 数量控制
        const controls = item.querySelector('.quantity-controls');
        controls.querySelector('.btn-increase').addEventListener('click', () => {
            const quantityElem = controls.querySelector('.quantity');
            quantityElem.textContent = parseInt(quantityElem.textContent) + 1;
        });
        
        controls.querySelector('.btn-decrease').addEventListener('click', () => {
            const quantityElem = controls.querySelector('.quantity');
            const current = parseInt(quantityElem.textContent);
            quantityElem.textContent = current > 0 ? current - 1 : 0;
        });

        productList.appendChild(item);
    });
}

function initCartEvents() {
    document.addEventListener('click', e => {
        // 添加购物车
        if(e.target.classList.contains('add-to-cart')) {
            const productId = e.target.dataset.id;
            const quantity = parseInt(e.target.previousElementSibling.querySelector('.quantity').textContent);
            if(quantity > 0) addToCart(productId, quantity);
        }

        // 购物车操作
        if(e.target.classList.contains('cart-remove')) {
            removeFromCart(e.target.dataset.id);
        }
        if(e.target.classList.contains('cart-increase')) {
            updateCartQuantity(e.target.dataset.id, 1);
        }
        if(e.target.classList.contains('cart-decrease')) {
            updateCartQuantity(e.target.dataset.id, -1);
        }

        // 开关购物车
        if(e.target.id === 'cart-notification' || e.target.classList.contains('close')) {
            toggleCartModal();
        }
        if(e.target.classList.contains('cart-modal')) {
            toggleCartModal();
        }
    });
}

// 购物车核心功能
function addToCart(productId, quantity) {
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            const product = data.products.find(p => p.id == productId);
            const existing = cart.find(item => item.id == productId);

            if(existing) {
                existing.quantity += quantity;
            } else {
                cart.push({...product, quantity});
            }

            updateCartDisplay();
            showCartNotification();
        });
}

function updateCartQuantity(productId, change) {
    const item = cart.find(i => i.id == productId);
    if(item) {
        item.quantity += change;
        if(item.quantity < 1) removeFromCart(productId);
        updateCartDisplay();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id != productId);
    updateCartDisplay();
}

function updateCartDisplay() {
    const itemsContainer = document.getElementById('cart-items');
    const totalPriceElem = document.getElementById('total-price');
    const cartCountElem = document.getElementById('cart-count');

    itemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>Price: $${item.price.toFixed(2)}</p>
            </div>
            <div class="cart-controls">
                <button class="cart-decrease" data-id="${item.id}">-</button>
                <span>${item.quantity}</span>
                <button class="cart-increase" data-id="${item.id}">+</button>
                <button class="cart-remove" data-id="${item.id}">×</button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPriceElem.textContent = total.toFixed(2);
    cartCountElem.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// 弹窗控制
function toggleCartModal() {
    const modal = document.getElementById('cart-modal');
    modal.classList.toggle('show');
    document.body.style.overflow = modal.classList.contains('show') ? 'hidden' : 'auto';
}

function showCartNotification() {
    const notification = document.getElementById('cart-notification');
    notification.style.bottom = '0';
    setTimeout(() => notification.style.bottom = '-50px', 3000);
}

// 复制功能
function copyCart() {
    const text = cart.map(item => 
        `${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    navigator.clipboard.writeText(text)
        .then(() => alert('Copied to clipboard!'))
        .catch(err => console.error('Copy failed:', err));
}