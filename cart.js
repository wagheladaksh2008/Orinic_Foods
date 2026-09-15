let cart = JSON.parse(localStorage.getItem("orinicCart")) || [];

function saveCart() {
    localStorage.setItem("orinicCart", JSON.stringify(cart));
}

function displayCart() {

    const cartItems = document.getElementById("cartItems");
    const cartSummary = document.getElementById("cartSummary");

    if (!cartItems || !cartSummary) return;

    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div class="empty-cart">
                <h2>Your cart is empty 🛒</h2>
                <p>Add some delicious Orinic products!</p>
            </div>
        `;

        cartSummary.innerHTML = "";
        return;
    }

    cartItems.innerHTML = "";

    let subtotal = 0;

    cart.forEach((item, index) => {

        const itemTotal = item.price * item.quantity;

        subtotal += itemTotal;

        const div = document.createElement("div");

        div.className = "cart-item";

        div.innerHTML = `
            <img src="images/${item.image}" alt="${item.name}">

            <div>
                <h3>${item.name}</h3>

                <p class="cart-price">
                    ₹${item.price}
                </p>

                <div class="cart-quantity">

                    <button onclick="changeQuantity(${index}, -1)">
                        −
                    </button>

                    <span>${item.quantity}</span>

                    <button onclick="changeQuantity(${index}, 1)">
                        +
                    </button>

                </div>
            </div>

            <button class="remove-btn" onclick="removeItem(${index})">
                Remove
            </button>
        `;

        cartItems.appendChild(div);
    });

    cartSummary.innerHTML = `
        <div class="cart-total">

            <div class="cart-total-row">
                <span>Subtotal</span>
                <strong>₹${subtotal}</strong>
            </div>

            <div class="cart-total-row">
                <span>Total</span>
                <strong>₹${subtotal}</strong>
            </div>

            <button class="checkout-btn">
                Proceed to Checkout
            </button>

        </div>
    `;
}


function changeQuantity(index, amount) {

    cart[index].quantity += amount;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCart();

    displayCart();
}


function removeItem(index) {

    cart.splice(index, 1);

    saveCart();

    displayCart();
}


displayCart();