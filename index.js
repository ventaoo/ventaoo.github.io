// 读取商品信息并填充页面
document.addEventListener('DOMContentLoaded', function () {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            const productList = document.getElementById('product-list');
            data.products.forEach(product => {
                const productItem = document.createElement('div');
                productItem.classList.add('product-item');
                productItem.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="product-footer">
                        <p><strong>$${product.price}</strong></p>
                        <div class="quantity-selector">
                            <button onclick="updateQuantity(${product.id}, 'decrease')">-</button>
                            <input type="number" id="quantity-${product.id}" value="1" min="1">
                            <button onclick="updateQuantity(${product.id}, 'increase')">+</button>
                        </div>
                    </div>
                `;
                productList.appendChild(productItem);
            });
        })
        .catch(error => console.error('Error loading the product data:', error));
});

// 更新商品数量
function updateQuantity(productId, action) {
    const quantityInput = document.getElementById(`quantity-${productId}`);
    let currentQuantity = parseInt(quantityInput.value);
    
    if (action === 'increase') {
        currentQuantity++;
    } else if (action === 'decrease' && currentQuantity > 1) {
        currentQuantity--;
    }

    quantityInput.value = currentQuantity;
}
