const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const productGrid = document.getElementById("productGrid");
const productName = document.getElementById("productName");

if (productGrid) {
    loadProducts();
}

if (productName) {
    loadProduct();
}

// =========================
// HOMEPAGE PRODUCTS
// =========================

async function loadProducts() {
    const { data: products, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error loading products:", error);
        productGrid.innerHTML = "<p>Unable to load products.</p>";
        return;
    }

    productGrid.innerHTML = "";

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <img src="images/${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="product-tag">${product.tag}</p>
            <p>₹${Number(product.price).toFixed(0)}</p>
            <button class="btn primary">Order Now</button>
        `;

        card.addEventListener("click", () => {
            window.location.href = `Product.html?id=${product.id}`;
        });

        card.querySelector("button").addEventListener("click", event => {
            event.stopPropagation();
            window.location.href = `Product.html?id=${product.id}`;
        });

        productGrid.appendChild(card);
    });
}


// =========================
// PRODUCT DETAIL PAGE
// =========================

let currentProduct = null;
let quantity = 1;


async function loadProduct() {
    if (!productId) {
        document.getElementById("productName").textContent =
            "Product not found";
        return;
    }

    const { data: product, error } = await supabaseClient
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

    if (error || !product) {
        console.error("Product error:", error);

        document.getElementById("productName").textContent =
            "Product not found";

        return;
    }

    currentProduct = product;
    loadReviews();

    const mainImage = document.getElementById("productImage");

    const thumbnail1 = document.getElementById("thumbnail1");
    const thumbnail2 = document.getElementById("thumbnail2");
    const thumbnail3 = document.getElementById("thumbnail3");

    mainImage.src = `images/${product.image}`;
    mainImage.alt = product.name;

    thumbnail1.src = `images/${product.image}`;
    thumbnail2.src = `images/${product.image_2}`;
    thumbnail3.src = `images/${product.image_3}`;

    thumbnail1.classList.add("active");

    thumbnail1.addEventListener("click", () => {
        mainImage.src = thumbnail1.src;

        thumbnail1.classList.add("active");
        thumbnail2.classList.remove("active");
        thumbnail3.classList.remove("active");
    });

    thumbnail2.addEventListener("click", () => {
        mainImage.src = thumbnail2.src;

        thumbnail1.classList.remove("active");
        thumbnail2.classList.add("active");
        thumbnail3.classList.remove("active");
    });

    thumbnail3.addEventListener("click", () => {
        mainImage.src = thumbnail3.src;

        thumbnail1.classList.remove("active");
        thumbnail2.classList.remove("active");
        thumbnail3.classList.add("active");
    });

    document.getElementById("productName").textContent =
        product.name;

    document.getElementById("productTag").textContent =
        product.tag;

    document.getElementById("productPrice").textContent =
        Number(product.price).toFixed(0);

    document.getElementById("productDescription").textContent =
        product.description;

    document.getElementById("fullDescription").textContent =
        product.description;

    document.getElementById("productIngredients").textContent =
        product.ingredients;

    document.getElementById("productNutrition").textContent =
        product.nutritional_info;

    document.getElementById("productBenefits").textContent =
        product.benefits;

    document.title =
        `${product.name} | Orinic Foods`;

    loadRecommendations();
}


// =========================
// RECOMMENDED PRODUCTS
// =========================

async function loadRecommendations() {
    const grid =
        document.getElementById("recommendationsGrid");

    const { data: products, error } = await supabaseClient
        .from("products")
        .select("*")
        .neq("id", productId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Recommendation error:", error);

        grid.innerHTML =
            "<p>Unable to load recommendations.</p>";

        return;
    }

    grid.innerHTML = "";

    products.forEach(product => {
        const card = document.createElement("div");

        card.className = "recommendation-card";

        card.innerHTML = `
            <img src="images/${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.tag}</p>
            <p class="recommendation-price">
                ₹${Number(product.price).toFixed(0)}
            </p>
        `;

        card.addEventListener("click", () => {
            window.location.href =
                `Product.html?id=${product.id}`;
        });

        grid.appendChild(card);
    });
}


// =========================
// QUANTITY
// =========================

const plusBtn = document.getElementById("plusBtn");
const minusBtn = document.getElementById("minusBtn");

if (plusBtn && minusBtn) {

    plusBtn.addEventListener("click", () => {
        quantity++;

        document.getElementById("quantity").textContent =
            quantity;
    });

    minusBtn.addEventListener("click", () => {

        if (quantity > 1) {
            quantity--;
        }

        document.getElementById("quantity").textContent =
            quantity;
    });
}


// =========================
// CART & BUY NOW
// =========================

const cartBtn = document.getElementById("cartBtn");
const buyBtn = document.getElementById("buyBtn");

if (cartBtn) {
    cartBtn.addEventListener("click", () => {

        if (!currentProduct) return;

        let cart = JSON.parse(localStorage.getItem("orinicCart")) || [];

        const existing = cart.find(item => item.id === currentProduct.id);

        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({
                id: currentProduct.id,
                name: currentProduct.name,
                price: Number(currentProduct.price),
                image: currentProduct.image,
                quantity: quantity
            });
        }

        localStorage.setItem("orinicCart", JSON.stringify(cart));

        alert(`${currentProduct.name} added to cart!`);
    });
}

if (buyBtn) {
    buyBtn.addEventListener("click", () => {

        alert(
            `Buying ${quantity} × ${currentProduct.name}`
        );

    });
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
                <p class="cart-price">₹${item.price}</p>

                <div class="cart-quantity">
                    <button onclick="changeQuantity(${index}, -1)">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity(${index}, 1)">+</button>
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

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("orinicCart")) || [];

    const count = cart.reduce((total, item) => {
        return total + item.quantity;
    }, 0);

    const cartCount = document.getElementById("cartCount");

    if (cartCount) {
        cartCount.textContent = count;
    }
}

window.addEventListener("storage", updateCartCount);

window.addEventListener("pageshow", updateCartCount);

updateCartCount();

let selectedRating = 0;

document.querySelectorAll(".star").forEach(star => {
    star.addEventListener("click", () => {
        selectedRating = Number(star.dataset.rating);

        document.querySelectorAll(".star").forEach(s => {
            s.classList.toggle(
                "selected",
                Number(s.dataset.rating) <= selectedRating
            );
        });
    });
});

const submitReview = document.getElementById("submitReview");

if (submitReview) {
    submitReview.addEventListener("click", async () => {

        const reviewText = document.getElementById("reviewText").value.trim();
        const reviewMessage = document.getElementById("reviewMessage");

        if (selectedRating === 0) {
            reviewMessage.textContent = "Please select a rating ⭐";
            return;
        }

        if (!reviewText) {
            reviewMessage.textContent = "Please write a review.";
            return;
        }

        const {
            data: { user }
        } = await supabaseClient.auth.getUser();

        if (!user) {
            reviewMessage.textContent = "Please login to submit a review.";
            return;
        }

        const { error } = await supabaseClient
            .from("reviews")
            .insert({
                product_id: currentProduct.id,
                user_id: user.id,
                rating: selectedRating,
                review: reviewText
            });

        if (error) {
            console.error(error);
            reviewMessage.textContent = "Could not submit review.";
            return;
        }

        reviewMessage.textContent = "Review submitted successfully! ⭐";

        document.getElementById("reviewText").value = "";
        selectedRating = 0;

        document.querySelectorAll(".star").forEach(s => {
            s.classList.remove("selected");
        });

        loadReviews();
    });
}

async function loadReviews() {

    if (!currentProduct) return;

    const { data: reviews, error } = await supabaseClient
        .from("reviews")
        .select("*")
        .eq("product_id", currentProduct.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading reviews:", error);
        return;
    }

    const reviewsList = document.getElementById("reviewsList");
    const averageRatingElement = document.getElementById("averageRating");
    const reviewCountElement = document.getElementById("reviewCount");
    const ratingText = document.getElementById("ratingText");

    if (!reviewsList) return;

    /* NO REVIEWS */

    if (!reviews || reviews.length === 0) {

        if (averageRatingElement) {
            averageRatingElement.textContent = "0.0";
        }

        if (reviewCountElement) {
            reviewCountElement.textContent = "0 reviews";
        }

        if (ratingText) {
            ratingText.textContent = "No reviews yet";
        }

        document.querySelectorAll(".rating-bar > div").forEach(bar => {
            bar.style.width = "0%";
        });

        reviewsList.innerHTML = `
            <p class="no-reviews">
                No reviews yet. Be the first to review this product!
            </p>
        `;

        return;
    }

    /* AVERAGE RATING */

    let totalRating = 0;

    reviews.forEach(review => {
        totalRating += Number(review.rating);
    });

    const averageRating = totalRating / reviews.length;

    if (averageRatingElement) {
        averageRatingElement.textContent = averageRating.toFixed(1);
    }

    if (reviewCountElement) {
        reviewCountElement.textContent =
            `${reviews.length} Review${reviews.length === 1 ? "" : "s"}`;
    }

    if (ratingText) {
        ratingText.textContent =
            `${averageRating.toFixed(1)} (${reviews.length} review${reviews.length === 1 ? "" : "s"})`;
    }

    /* RATING BARS */

    for (let rating = 5; rating >= 1; rating--) {

        const count = reviews.filter(
            review => Number(review.rating) === rating
        ).length;

        const percentage = (count / reviews.length) * 100;

        const rows = document.querySelectorAll(".rating-row");

        rows.forEach(row => {

            const label = row.querySelector("span");

            if (label && label.textContent.trim() === `${rating} ★`) {

                const bar = row.querySelector(".rating-bar > div");

                if (bar) {
                    bar.style.width = `${percentage}%`;
                }
            }
        });
    }

    /* DISPLAY REVIEWS */

    reviewsList.innerHTML = "";

    reviews.forEach(review => {

        const div = document.createElement("div");
        div.className = "review-item";

        const stars = document.createElement("div");
        stars.className = "review-stars";
        stars.textContent =
            "★".repeat(Number(review.rating)) +
            "☆".repeat(5 - Number(review.rating));

        const text = document.createElement("p");
        text.textContent = review.review;

        const date = document.createElement("small");
        date.textContent =
            new Date(review.created_at).toLocaleDateString();

        div.appendChild(stars);
        div.appendChild(text);
        div.appendChild(date);

        reviewsList.appendChild(div);
    });
}