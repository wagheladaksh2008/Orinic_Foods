
let cart = JSON.parse(localStorage.getItem("orinicCart")) || [];

// Save cart to localStorage
function saveCart() {
    localStorage.setItem("orinicCart", JSON.stringify(cart));
}

// Display cart items and total
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
        const itemTotal = Number(item.price) * Number(item.quantity);
        subtotal += itemTotal;

        const div = document.createElement("div");
        div.className = "cart-item";

        div.innerHTML = `
            <img src="images/${item.image}" alt="Product">

            <div>
                <h3></h3>

                <p class="cart-price">
                    ₹${item.price}
                </p>

                <div class="cart-quantity">
                    <button type="button"
                        onclick="changeQuantity(${index}, -1)">−</button>

                    <span>${item.quantity}</span>

                    <button type="button"
                        onclick="changeQuantity(${index}, 1)">+</button>
                </div>
            </div>

            <button type="button" class="remove-btn"
                onclick="removeItem(${index})">
                Remove
            </button>
        `;

        // Set product name as text, not HTML
        div.querySelector("h3").textContent = item.name;

        cartItems.appendChild(div);
    });

    cartSummary.innerHTML = `
        <div class="cart-total">
            <div class="cart-total-row">
                <span>Subtotal</span>
                <strong>₹${subtotal.toFixed(2)}</strong>
            </div>

            <div class="cart-total-row">
                <span>Total</span>
                <strong>₹${subtotal.toFixed(2)}</strong>
            </div>

            <button type="button" class="checkout-btn">
                Proceed to Checkout
            </button>
        </div>
    `;
}

// Change quantity
function changeQuantity(index, amount) {
    if (!cart[index]) return;

    cart[index].quantity = Number(cart[index].quantity) + amount;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCart();
    displayCart();
}

// Remove product
function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    displayCart();
}

// Create and display delivery form
async function showDeliveryForm() {
    if (!cart.length) {
        alert("Your cart is empty.");
        return;
    }

    if (document.getElementById("deliveryModal")) return;

    const modal = document.createElement("div");
    modal.id = "deliveryModal";

    modal.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow-y: auto;
    `;

    modal.innerHTML = `
        <form id="deliveryForm" style="
            background: white;
            padding: 25px;
            border-radius: 16px;
            width: 100%;
            max-width: 450px;
            box-sizing: border-box;
            max-height: 90vh;
            overflow-y: auto;
        ">
            <h2>Delivery Details</h2>
            <p>Enter your details to continue to payment.</p>

            <label for="customerName">Full Name</label>
            <input id="customerName" type="text"
                maxlength="100" autocomplete="name" required
                style="display:block;width:100%;box-sizing:border-box;padding:12px;margin:8px 0 16px">

            <label for="customerPhone">Mobile Number</label>
            <input id="customerPhone" type="tel"
                inputmode="numeric" pattern="[0-9]{10}"
                maxlength="10" autocomplete="tel" required
                title="Enter a 10-digit mobile number"
                style="display:block;width:100%;box-sizing:border-box;padding:12px;margin:8px 0 16px">

            <label for="customerAddress">Full Delivery Address</label>
            <textarea id="customerAddress" rows="3"
                maxlength="500" autocomplete="street-address"
                required
                style="display:block;width:100%;box-sizing:border-box;padding:12px;margin:8px 0 16px"></textarea>

            <button id="payNowBtn" type="submit"
                style="width:100%;padding:14px;background:#3A7D44;color:white;border:0;border-radius:10px;font-weight:600;cursor:pointer">
                Continue to Payment
            </button>

            <button id="cancelDelivery" type="button"
                style="width:100%;padding:12px;margin-top:8px;cursor:pointer">
                Cancel
            </button>
        </form>
    `;

    document.body.appendChild(modal);

    // ======================================
// AUTO-FILL CUSTOMER DETAILS FROM SUPABASE
// ======================================

try {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error) {
        throw error;
    }

    if (!user) {

        alert("Please log in before checkout.");

        window.location.href =
            "Login.html?redirect=" +
            encodeURIComponent("Cart.html?checkout=1");

        modal.remove();
        return;
    }

    // Get details saved during signup
    const customerDetails = user.user_metadata || {};

    // Automatically fill customer name
    document.getElementById("customerName").value =
        customerDetails.full_name || "";

    // Automatically fill mobile number
    document.getElementById("customerPhone").value =
        customerDetails.phone || "";

    // Keep delivery address empty
    document.getElementById("customerAddress").value = "";

} catch (error) {

    console.error("Customer details loading error:", error);

    alert("Unable to load your account details. Please try again.");

    modal.remove();
    return;
}

    modal.querySelector("#cancelDelivery").addEventListener("click", () => {
        modal.remove();
    });

    modal.addEventListener("click", event => {
        if (event.target === modal) modal.remove();
    });

    const form = modal.querySelector("#deliveryForm");
    const payButton = modal.querySelector("#payNowBtn");

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        payButton.disabled = true;
        payButton.textContent = "Creating Order...";

        try {
            // Verify the current Supabase login
            const {
                data: { user },
                error: authError
            } = await supabaseClient.auth.getUser();

            if (authError && authError.name !== "AuthSessionMissingError") {
    throw authError;
}

if (!user) {
    alert("Please log in before proceeding to checkout.");

    window.location.href =
        "Login.html?redirect=" +
        encodeURIComponent("Cart.html?checkout=1");

    return;
}
            if (!window.Razorpay) {
                throw new Error(
                    "Razorpay Checkout did not load. Refresh the page and try again."
                );
            }

            const customer = {
                name: document.getElementById("customerName").value.trim(),
                phone: document.getElementById("customerPhone").value.trim(),
                address: document.getElementById("customerAddress").value.trim()
            };

            if (
                !customer.name ||
                !/^[0-9]{10}$/.test(customer.phone) ||
                !customer.address
            ) {
                throw new Error(
                    "Enter a valid name, 10-digit mobile number and address."
                );
            }

            // Send product IDs and quantities only.
            // The server must calculate prices using Supabase data.
            const items = cart.map(item => ({
                product_id: item.id,
                quantity: Number(item.quantity)
            }));

            // Create Razorpay order through Supabase Edge Function
            const { data: orderData, error: orderError } =
                await supabaseClient.functions.invoke(
                    "create-razorpay-order",
                    {
                        body: {
                            items,
                            customer_name: customer.name,
                            phone: customer.phone,
                            address: customer.address
                        }
                    }
                );

            if (orderError) {
                throw orderError;
            }

            if (
                !orderData ||
                orderData.success !== true ||
                !orderData.key_id ||
                !orderData.order_id ||
                !orderData.supabase_order_id ||
                !Number.isFinite(Number(orderData.amount)) ||
                Number(orderData.amount) <= 0
            ) {
                throw new Error(
                    "Could not create the order. Check the Edge Function response."
                );
            }

            // Close delivery form before opening Razorpay
            modal.remove();

            const checkout = new Razorpay({
                key: orderData.key_id,
                amount: Number(orderData.amount),
                currency: orderData.currency || "INR",
                order_id: orderData.order_id,
                name: "Orinic Foods",
                description: "Payment for your order",

                prefill: {
                    name: customer.name,
                    contact: customer.phone
                },

                notes: {
                    delivery_address: customer.address
                },

                theme: {
                    color: "#3A7D44"
                },

                handler: async function (payment) {
                    try {
                        // Verify payment on the server
                        const {
                            data: verifyData,
                            error: verifyError
                        } = await supabaseClient.functions.invoke(
                            "verify-razorpay-payment",
                            {
                                body: {
                                    supabase_order_id:
                                        String(orderData.supabase_order_id),

                                    razorpay_payment_id:
                                        payment.razorpay_payment_id,

                                    razorpay_signature:
                                        payment.razorpay_signature
                                }
                            }
                        );

                        if (verifyError) throw verifyError;

                        if (
                            !verifyData ||
                            verifyData.success !== true ||
                            verifyData.status !== "paid"
                        ) {
                            throw new Error(
                                "The server has not confirmed payment."
                            );
                        }

                        // Clear cart only after server confirmation
                        cart = [];
                        saveCart();
                        displayCart();

                        alert(
                            "Payment successful! Your order is confirmed."
                        );

                    } catch (error) {
                        console.error("Payment verification error:", error);

                        alert(
                            "We could not confirm your payment. " +
                            "Do not pay again immediately. Contact support " +
                            "with your payment ID: " +
                            payment.razorpay_payment_id
                        );
                    }
                },

                modal: {
                    ondismiss: function () {
                        alert(
                            "Checkout closed. Check your order status before retrying."
                        );
                    }
                }
            });

            
checkout.on("payment.failed", function (response) {
    const error = response.error || {};

    console.error("Razorpay payment failure details:", {
        code: error.code,
        description: error.description,
        source: error.source,
        step: error.step,
        reason: error.reason,
        payment_id: error.metadata?.payment_id,
        order_id: error.metadata?.order_id
    });

    alert(
        "Payment failed.\n\n" +
        "Code: " + (error.code || "Not provided") + "\n" +
        "Description: " + (error.description || "Not provided") + "\n" +
        "Step: " + (error.step || "Not provided") + "\n" +
        "Reason: " + (error.reason || "Not provided") +
        "\n\nCheck payment status before retrying."
    );
});


            checkout.open();

        } catch (error) {
            console.error("Checkout error:", error);

            alert(
                error.message ||
                "Could not start checkout. Please try again."
            );

            payButton.disabled = false;
            payButton.textContent = "Continue to Payment";
        }
    });
}

// Proceed to checkout button handler
document.addEventListener("click", async event => {
    const button = event.target.closest(".checkout-btn");

    if (!button) return;

    if (!cart.length) {
        alert("Your cart is empty.");
        return;
    }

    button.disabled = true;
    button.textContent = "Checking...";

    try {
        const {
            data: { user },
            error
        } = await supabaseClient.auth.getUser();

       if (error && error.name !== "AuthSessionMissingError") {
    throw error;
}

if (!user) {
    alert("Please log in before proceeding to checkout.");

    window.location.href =
        "Login.html?redirect=" +
        encodeURIComponent("Cart.html?checkout=1");

    return;
}

        showDeliveryForm();

    } catch (error) {
        console.error("Checkout start error:", error);

        alert("Could not start checkout. Please try again.");

    } finally {
        // The button may have been recreated by displayCart()
        const currentButton = document.querySelector(".checkout-btn");

        if (currentButton) {
            currentButton.disabled = false;
            currentButton.textContent = "Proceed to Checkout";
        }
    }
});

// Initial cart display
displayCart();

// Resume checkout after successful login
document.addEventListener("DOMContentLoaded", async () => {

    const params = new URLSearchParams(window.location.search);

    if (params.get("checkout") !== "1") {
        return;
    }

    if (!cart.length) {
        alert("Your cart is empty.");
        return;
    }

    try {
        const {
            data: { user },
            error
        } = await supabaseClient.auth.getUser();

        if (error && error.name !== "AuthSessionMissingError") {
    throw error;
}

if (!user) {
    window.location.href =
        "Login.html?redirect=" +
        encodeURIComponent("Cart.html?checkout=1");

    return;
}

        // Open delivery form automatically
        showDeliveryForm();

    } catch (error) {
        console.error("Checkout authentication error:", error);
        alert("Unable to verify your login. Please try again.");
    }

});
