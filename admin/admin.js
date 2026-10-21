/* =====================================================
   ORINIC FOODS ADMIN PANEL
===================================================== */


let products = [];
let orders = [];

let revenueChart = null;
let productChart = null;
let forecastChart = null;


/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("Orinic Admin Panel Initializing...");

    await checkAdmin();

    setupNavigation();

    setupButtons();

    // Load Dashboard
    try {
        await loadDashboard();
        console.log("Dashboard loaded successfully");
    } catch (error) {
        console.error("Dashboard loading failed:", error);
    }

    // Load Products
    try {
        await loadProducts();
        console.log("Products loaded successfully");
    } catch (error) {
        console.error("Products loading failed:", error);
    }

    // Load Orders
    try {
        await loadOrders();
        console.log("Orders loaded successfully");
    } catch (error) {
        console.error("Orders loading failed:", error);
    }

    // Load Customers
    try {
        await loadCustomers();

        await loadPayments();
        console.log("Customers loaded successfully");
    } catch (error) {
        console.error("Customers loading failed:", error);
    }

    // Load Reviews
    try {
        await loadReviews();
        console.log("Reviews loaded successfully");
    } catch (error) {
        console.error("Reviews loading failed:", error);
    }

    console.log("Admin Dashboard Initialization Complete!");

});
/* =====================================================
   ADMIN SECURITY
===================================================== */

async function checkAdmin() {

    try {

        // Check logged-in Supabase user
        const {
            data: { user },
            error
        } = await supabaseClient.auth.getUser();

        if (error || !user) {

            window.location.replace("../Login.html");

            return false;

        }

        // Verify administrator permission
        const {
            data: admin,
            error: adminError
        } = await supabaseClient
            .from("admin_users")
            .select("id, full_name, email")
            .eq("id", user.id)
            .maybeSingle();

        if (adminError) {

            console.error(
                "Admin verification error:",
                adminError
            );

            document.body.innerHTML =
                "<h2>Unable to verify administrator access. Please try again.</h2>";

            return false;

        }

        if (!admin) {

            await supabaseClient.auth.signOut();

            window.location.replace("../Login.html");

            return false;

        }

        // Display administrator name
        const adminName =
            document.getElementById("adminName");

        if (adminName) {

            adminName.textContent =
                admin.full_name || "Orinic Foods Admin";

        }

        return true;

    } catch (error) {

        console.error("Admin authentication failed:", error);

        document.body.innerHTML =
            "<h2>Authentication failed. Please log in again.</h2>";

        return false;

    }

}

/* =====================================================
   NAVIGATION
===================================================== */

function setupNavigation() {

    document.querySelectorAll(".nav-item")
        .forEach(button => {

            button.addEventListener("click", () => {

                const section =
                    button.dataset.section;

                showSection(section);

            });

        });


    document.querySelectorAll(
        "[data-section-target]"
    ).forEach(button => {

        button.addEventListener("click", () => {

            showSection(
                button.dataset.sectionTarget
            );

        });

    });

}


function showSection(sectionId) {

    document.querySelectorAll(".admin-section")
        .forEach(section => {

            section.classList.remove(
                "active-section"
            );

        });


    document.getElementById(sectionId)
        .classList.add("active-section");


    document.querySelectorAll(".nav-item")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section === sectionId
            );

        });

}


/* =====================================================
   BUTTONS
===================================================== */

function setupButtons() {

    document.getElementById("logoutBtn")
        .addEventListener("click", logout);


    document.getElementById("addProductBtn")
        .addEventListener("click", () => {

            openProductModal();

        });


    document.getElementById("closeProductModal")
        .addEventListener("click", closeProductModal);


    document.getElementById("cancelProductBtn")
        .addEventListener("click", closeProductModal);


    document.getElementById("productForm")
        .addEventListener("submit", saveProduct);


    document.getElementById("productSearch")
        .addEventListener("input", filterProducts);


    

    


    document.querySelectorAll(".filter")
        .forEach(button => {

            button.addEventListener("click", () => {

                document.querySelectorAll(".filter")
                    .forEach(b =>
                        b.classList.remove("active")
                    );

                button.classList.add("active");

                renderOrders(
                    button.dataset.status
                );

            });

        });

}


/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {

        console.error("Logout error:", error);

        alert("Unable to logout. Please try again.");

        return;

    }

    window.location.replace("../Login.html");

}


/* =========================================
   DASHBOARD - REAL SUPABASE DATA
========================================= */

async function loadDashboard() {

    const { data, error } = await supabaseClient
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {

        console.error("Dashboard loading error:", error);

        alert("Unable to load dashboard: " + error.message);

        return;
    }

    orders = data || [];

    // Only successful payments count as revenue
    const paidOrders = orders.filter(order =>
        String(order.status || "").toLowerCase() === "paid"
    );

    const pendingOrders = orders.filter(order =>
        String(order.status || "").toLowerCase() === "pending"
    );

    // Today's date in local browser timezone
    const today = new Date();

    const todayKey = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    const todayPaidOrders = paidOrders.filter(order => {

        const date = new Date(order.created_at);

        const orderDate = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");

        return orderDate === todayKey;

    });

    const todayRevenue = todayPaidOrders.reduce(
        (sum, order) => sum + Number(order.amount || 0),
        0
    );

    // Current month revenue
    const currentMonth =
        today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0");

    const monthlyRevenue = paidOrders
        .filter(order =>
            String(order.created_at).slice(0, 7) === currentMonth
        )
        .reduce(
            (sum, order) => sum + Number(order.amount || 0),
            0
        );

    // Update dashboard cards
    document.getElementById("todayRevenue").textContent =
        formatCurrency(todayRevenue);

    document.getElementById("monthlySales").textContent =
        formatCurrency(monthlyRevenue);

    document.getElementById("pendingOrders").textContent =
        pendingOrders.length;

    // Recent orders
    renderRecentOrders();

    // Revenue chart
    await loadRevenueChart();

    await loadProductChart();

}


/* =========================================
   RECENT ORDERS
========================================= */

function renderRecentOrders() {

    const body = document.getElementById("recentOrdersBody");

    if (!body) return;

    body.innerHTML = "";

    orders.slice(0, 5).forEach(order => {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>
                ${escapeHTML(order.razorpay_order_id || order.id)}
            </td>

            <td>
                ${escapeHTML(order.customer_name || "Customer")}
            </td>

            <td>
                Order
            </td>

            <td>
                ${formatCurrency(order.amount)}
            </td>

            <td>
                ${statusBadge(order.status)}
            </td>

        `;

        body.appendChild(row);

    });

}

/* =========================================
   REVENUE CHART - LAST 7 DAYS
========================================= */

async function loadRevenueChart() {

    const canvas = document.getElementById("revenueChart");

    if (!canvas) return;

    const labels = [];
    const values = [];

    const today = new Date();

    for (let i = 6; i >= 0; i--) {

        const date = new Date(today);

        date.setDate(today.getDate() - i);

        const key = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");

        labels.push(
            date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short"
            })
        );

        const revenue = orders
            .filter(order => {

                if (
                    String(order.status || "").toLowerCase() !== "paid"
                ) {
                    return false;
                }

                const orderDate = new Date(order.created_at);

                const orderKey = [
                    orderDate.getFullYear(),
                    String(orderDate.getMonth() + 1).padStart(2, "0"),
                    String(orderDate.getDate()).padStart(2, "0")
                ].join("-");

                return orderKey === key;

            })
            .reduce(
                (sum, order) => sum + Number(order.amount || 0),
                0
            );

        values.push(revenue);

    }

    if (revenueChart) {
        revenueChart.destroy();
    }

    revenueChart = new Chart(canvas, {

        type: "line",

        data: {

            labels: labels,

            datasets: [{

                label: "Paid Revenue",

                data: values,

                borderWidth: 3,

                tension: 0.35,

                fill: true

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: true
                }

            },

            scales: {

                y: {
                    beginAtZero: true
                }

            }

        }

    });

}


/* =====================================================
   PRODUCTS
===================================================== */

async function loadProducts() {

    const {
        data,
        error
    } = await supabaseClient

        .from("products")

        .select("*")

        .order("created_at", {
            ascending: true
        });


    if (error) {

        console.error(
            "Products:",
            error
        );

        return;

    }


    products = data || [];

    renderProducts(products);

    

}


function renderProducts(list) {

    const body = document.getElementById("productsBody");

    if (!body) return;

    body.innerHTML = "";

    if (!list || list.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="5">No products found.</td>
            </tr>
        `;
        return;
    }

    list.forEach(product => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="product-cell">
                    <img
                        src="../images/${escapeHTML(product.image || "")}"
                        onerror="this.style.display='none'"
                        alt="${escapeHTML(product.name || "Product")}"
                    >

                    <div>
                        ${escapeHTML(product.name || "")}
                    </div>
                </div>
            </td>

            <td>${escapeHTML(product.tag || "Uncategorized")}</td>

            <td>₹${Number(product.price || 0).toFixed(2)}</td>

            <td>${escapeHTML(product.description || "No description")}</td>

            <td>
                <div class="action-buttons">
                    <button
                        class="action-btn edit"
                        onclick="editProduct('${product.id}')"
                        title="Edit Product"
                    >✎</button>

                    <button
                        class="action-btn delete"
                        onclick="deleteProduct('${product.id}')"
                        title="Delete Product"
                    >🗑</button>
                </div>
            </td>
        `;

        body.appendChild(row);

    });

}

/* =====================================================
   PRODUCT SEARCH
===================================================== */

function filterProducts(event) {

    const query =
        event.target.value
            .toLowerCase()
            .trim();


    const filtered =
        products.filter(product =>

            String(product.name || "")
                .toLowerCase()
                .includes(query)

        );


    renderProducts(filtered);

}


/* =====================================================
   ADD / EDIT PRODUCT
===================================================== */

function openProductModal(product = null) {

    const modal =
        document.getElementById(
            "productModal"
        );


    modal.classList.add("show");


    if (!product) {

        document.getElementById(
            "productModalTitle"
        ).textContent =
            "Add Product";


        document.getElementById(
            "productForm"
        ).reset();


        document.getElementById(
            "productId"
        ).value = "";


        return;

    }


    document.getElementById(
        "productModalTitle"
    ).textContent =
        "Edit Product";


    document.getElementById(
        "productId"
    ).value =
        product.id;


    document.getElementById(
        "productName"
    ).value =
        product.name || "";


    document.getElementById(
        "productPrice"
    ).value =
        product.price || 0;


    document.getElementById(
        "productStock"
    ).value =
        product.stock || 0;


    


    document.getElementById(
        "productTag"
    ).value =
        product.tag || "";


    document.getElementById(
        "productDescription"
    ).value =
        product.description || "";


    document.getElementById(
        "productImage"
    ).value =
        product.image || "";

}


function closeProductModal() {

    document.getElementById(
        "productModal"
    ).classList.remove("show");

}




async function saveProduct(event) {

    event.preventDefault();

    const id = document.getElementById("productId").value;

    const product = {
        name: document.getElementById("productName").value.trim(),
        price: Number(document.getElementById("productPrice").value),
        stock: Number(document.getElementById("productStock").value),
        tag: document.getElementById("productTag").value.trim(),
        description: document.getElementById("productDescription").value.trim(),
        image: document.getElementById("productImage").value.trim()
    };

    if (
        !product.name ||
        !Number.isFinite(product.price) ||
        product.price <= 0 ||
        !Number.isInteger(product.stock) ||
        product.stock < 0
    ) {
        alert("Please enter a valid product name, price and stock quantity.");
        return;
    }

    let result;


    if (id) {
        result = await supabaseClient
            .from("products")
            .update(product)
            .eq("id", id);
    } else {
        result = await supabaseClient
            .from("products")
            .insert(product);
    }


    if (result.error) {
        console.error("Product save error:", result.error);
        alert("Unable to save product: " + result.error.message);
        return;

    }

    alert(id ? "Product updated successfully!" : "Product added successfully!");

    closeProductModal();

    await loadProducts();

}



/* =====================================================
   EDIT PRODUCT
===================================================== */

window.editProduct = function(id) {

    const product =
        products.find(
            p => String(p.id) === String(id)
        );


    if (product)
        openProductModal(product);

};


/* =====================================================
   DELETE PRODUCT
===================================================== */

window.deleteProduct = async function(id) {

    if (!confirm(
        "Delete this product?"
    ))
        return;


    const {
        error
    } = await supabaseClient

        .from("products")

        .delete()

        .eq("id", id);


    if (error) {

        alert(
            "Unable to delete product: " +
            error.message
        );

        return;

    }


    await loadProducts();

};


/* =====================================================
   ORDERS
===================================================== */

async function loadOrders() {

    const { data, error } = await supabaseClient
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Orders Error:", error);
        alert("Unable to load orders: " + error.message);
        return;
    }

    orders = data || [];

    // Fetch purchased product names
    const { data: items, error: itemsError } = await supabaseClient
        .from("order_items")
        .select("order_id, product_name, quantity");

    if (itemsError) {
        console.error("Order Items Error:", itemsError);
        alert("Unable to load purchased products: " + itemsError.message);
        return;
    }

    // Attach product details to their respective orders
    orders.forEach(order => {
        order.products = (items || []).filter(
            item => String(item.order_id) === String(order.id)
        );
    });

    renderOrders("all");

}

/* =====================================================
   RENDER ORDERS
===================================================== */

function renderOrders(status = "all") {

    const body = document.getElementById("ordersBody");

    if (!body) return;

    body.innerHTML = "";

    let list = orders;

    if (status !== "all") {
        list = orders.filter(order =>
            String(order.status || "").toLowerCase() === status.toLowerCase()
        );
    }

    if (list.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="7">No orders found.</td>
            </tr>
        `;
        return;
    }

    list.forEach(order => {

        const row = document.createElement("tr");

        const orderNumber = order.razorpay_order_id || order.id;

        const productNames = order.products && order.products.length
            ? order.products.map(item =>
                `${item.product_name} × ${item.quantity}`
              ).join(", ")
            : "No products found";

        row.innerHTML = `
            <td>${escapeHTML(String(orderNumber))}</td>

            <td>${escapeHTML(order.customer_name || "Customer")}</td>

            <td>${escapeHTML(productNames)}</td>

            <td>${formatDate(order.created_at)}</td>

            <td>
                <strong>${formatCurrency(order.amount)}</strong>
            </td>

            <td>
                ${statusBadge(order.status)}
            </td>

            <td>
                <button
                    class="action-btn view"
                    onclick="viewOrder('${order.id}')">
                    View →
                </button>
            </td>
        `;

        body.appendChild(row);

    });

}

/* =====================================================
   VIEW ORDER
===================================================== */

window.viewOrder = async function(id) {

    const order = orders.find(
        item => String(item.id) === String(id)
    );

    if (!order) {
        alert("Order not found!");
        return;
    }

    const { data: items, error } = await supabaseClient
        .from("order_items")
        .select("product_name, quantity, price")
        .eq("order_id", order.id);

    if (error) {
        console.error("Order items error:", error);
    }

    let itemDetails = "No product details available.";

    if (items && items.length > 0) {
        itemDetails = items.map(item =>
            `${item.product_name} x ${item.quantity} - ₹${item.price}`
        ).join("\n");
    }

    alert(
        `Order ID: ${order.razorpay_order_id || order.id}\n` +
        `Customer: ${order.customer_name || "N/A"}\n` +
        `Phone: ${order.phone || "N/A"}\n` +
        `Amount: ₹${order.amount ?? "N/A"}\n` +
        `Payment Status: ${order.status || "N/A"}\n` +
        `Date: ${order.created_at || "N/A"}\n` +
        `Address: ${order.address || "N/A"}\n\n` +
        `PRODUCTS:\n${itemDetails}`
    );
}
;

/* =====================================================
   CUSTOMERS
===================================================== */

async function loadCustomers() {

    const body = document.getElementById("customersBody");
    const totalCustomers = document.getElementById("totalCustomers");

    if (!body) {
        console.error("Customers table body not found!");
        return;
    }

    body.innerHTML = `
        <tr>
            <td colspan="5">Loading customers...</td>
        </tr>
    `;

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, full_name, email, phone, city, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Customers loading error:", error);

        body.innerHTML = `
            <tr>
                <td colspan="5">Unable to load customers.</td>
            </tr>
        `;

        return;
    }

    body.innerHTML = "";

    if (!data || data.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="5">No customers registered yet.</td>
            </tr>
        `;

        if (totalCustomers) {
            totalCustomers.textContent = "0";
        }

        return;
    }

    data.forEach(customer => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(customer.full_name || "Customer")}</td>
            <td>${escapeHTML(customer.email || "—")}</td>
            <td>${escapeHTML(customer.phone || "—")}</td>
            <td>${escapeHTML(customer.city || "—")}</td>
            <td>${formatDate(customer.created_at)}</td>
        `;

        body.appendChild(row);

    });

    if (totalCustomers) {
        totalCustomers.textContent = data.length;
    }

    console.log("Customers loaded:", data.length);
}


/* =====================================================
   PAYMENTS
===================================================== */

async function loadPayments() {

    const body = document.getElementById("paymentsBody");

    if (!body) {
        console.error("Payments table body not found!");
        return;
    }

    body.innerHTML = `
        <tr>
            <td colspan="6">Loading payments...</td>
        </tr>
    `;

    const { data, error } = await supabaseClient
        .from("orders")
        .select(`
            id,
            razorpay_order_id,
            razorpay_payment_id,
            amount,
            status,
            created_at
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Payments loading error:", error);

        body.innerHTML = `
            <tr>
                <td colspan="6">Unable to load payments.</td>
            </tr>
        `;

        return;
    }

    body.innerHTML = "";

    if (!data || data.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="6">No payment records found.</td>
            </tr>
        `;
        return;
    }

    data.forEach(payment => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                ${escapeHTML(payment.razorpay_payment_id || "—")}
            </td>

            <td>
                ${escapeHTML(
                    payment.razorpay_order_id || String(payment.id)
                )}
            </td>

            <td>
                <strong>${formatCurrency(payment.amount)}</strong>
            </td>

            <td>Razorpay</td>

            <td>
                ${statusBadge(payment.status)}
            </td>

            <td>
                ${formatDate(payment.created_at)}
            </td>
        `;

        body.appendChild(row);

    });

    console.log("Payments loaded:", data.length);
}

/* =====================================================
   REVIEWS
===================================================== */

async function loadReviews() {

    const body = document.getElementById("reviewsBody");

    if (!body) {
        console.error("Reviews table body not found!");
        return;
    }

    body.innerHTML = `
        <tr>
            <td colspan="6">Loading reviews...</td>
        </tr>
    `;

    // Fetch reviews
    const { data: reviews, error } = await supabaseClient
        .from("reviews")
        .select("id, created_at, product_id, user_id, rating, review")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Reviews loading error:", error);

        body.innerHTML = `
            <tr>
                <td colspan="6">Unable to load reviews.</td>
            </tr>
        `;
        return;
    }

    body.innerHTML = "";

    if (!reviews || reviews.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="6">No reviews found.</td>
            </tr>
        `;
        console.log("No reviews available.");
        return;
    }

    // Collect product and customer IDs
    const productIds = [...new Set(
        reviews.map(r => r.product_id).filter(Boolean)
    )];

    const userIds = [...new Set(
        reviews.map(r => r.user_id).filter(Boolean)
    )];

    // Fetch product names
    let productMap = {};

    if (productIds.length > 0) {

        const { data: productsData, error: productsError } =
            await supabaseClient
                .from("products")
                .select("id, name")
                .in("id", productIds);

        if (productsError) {
            console.error("Review products error:", productsError);
        } else {
            (productsData || []).forEach(product => {
                productMap[product.id] = product.name;
            });
        }
    }

    // Fetch customer names
    let customerMap = {};

    if (userIds.length > 0) {

        const { data: customersData, error: customersError } =
            await supabaseClient
                .from("profiles")
                .select("id, full_name")
                .in("id", userIds);

        if (customersError) {
            console.error("Review customers error:", customersError);
        } else {
            (customersData || []).forEach(customer => {
                customerMap[customer.id] = customer.full_name;
            });
        }
    }

    // Display reviews
    reviews.forEach(review => {

        const row = document.createElement("tr");

        const productName =
            productMap[review.product_id] || "Product unavailable";

        const customerName =
            customerMap[review.user_id] || "Customer";

        row.innerHTML = `
            <td>${escapeHTML(productName)}</td>

            <td>${escapeHTML(customerName)}</td>

            <td>⭐ ${Number(review.rating || 0)}/5</td>

            <td>${escapeHTML(review.review || "No comment")}</td>

            <td>${formatDate(review.created_at)}</td>

            <td>
                <button
                    class="action-btn delete"
                    onclick="deleteReview('${review.id}')"
                    title="Delete Review"
                >
                    🗑
                </button>
            </td>
        `;

        body.appendChild(row);

    });

    console.log("Reviews loaded:", reviews.length);
}

/* =====================================================
   DELETE REVIEW
===================================================== */

window.deleteReview =
async function(id) {

    if (!confirm(
        "Delete this review?"
    ))
        return;


    const {
        error
    } = await supabaseClient

        .from("reviews")

        .delete()

        .eq("id", id);


    if (error) {

        alert(error.message);

        return;

    }


    await loadReviews();

};


/* =====================================================
   REPORTS
===================================================== */

async function loadReports() {

    const {
        data,
        error
    } = await supabaseClient

        .from("reports")

        .select("*")

        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(
            "Reports:",
            error
        );

        return;

    }


    const body =
        document.getElementById(
            "reportsBody"
        );


    body.innerHTML = "";


    (data || []).forEach(report => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${escapeHTML(report.title)}
                </strong>
            </td>

            <td>
                ${escapeHTML(report.report_type)}
            </td>

            <td>
                ${escapeHTML(
                    report.description || ""
                )}
            </td>

            <td>
                ${formatDate(report.created_at)}
            </td>

            <td>

                <button
                    class="action-btn delete"
                    onclick="deleteReport('${report.id}')"
                >
                    🗑
                </button>

            </td>

        `;


        body.appendChild(row);

    });

}


/* =====================================================
   CREATE REPORT
===================================================== */

async function createReport() {

    const title =
        prompt(
            "Enter report title:"
        );


    if (!title)
        return;


    const type =
        prompt(
            "Report type:",
            "Sales Report"
        );


    const description =
        prompt(
            "Report description:",
            "Generated from Orinic Foods Admin Panel"
        );


    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth.getUser();


    const {
        error
    } = await supabaseClient

        .from("reports")

        .insert({

            title,

            report_type:
                type || "General",

            description:

                description || "",

            created_by:
                user.id

        });


    if (error) {

        alert(error.message);

        return;

    }


    await loadReports();

}


/* =====================================================
   DELETE REPORT
===================================================== */

window.deleteReport =
async function(id) {

    if (!confirm(
        "Delete this report?"
    ))
        return;


    const {
        error
    } = await supabaseClient

        .from("reports")

        .delete()

        .eq("id", id);


    if (error) {

        alert(error.message);

        return;

    }


    await loadReports();

};


/* =====================================================
   ANALYTICS
===================================================== */

async function loadAnalytics() {

    const total =
        orders.reduce(
            (sum, order) =>
                sum +
                Number(order.total_amount || 0),
            0
        );


    const average =
        orders.length
            ? total / orders.length
            : 0;


    document.getElementById(
        "avgOrderValue"
    ).textContent =
        formatCurrency(average);


    await loadForecastChart();

}


/* =====================================================
   FORECAST
===================================================== */

async function loadForecastChart() {

    const labels = [
        "Aug",
        "Sep",
        "Oct"
    ];


    const values = [
        520,
        570,
        640
    ];


    const ctx =
        document.getElementById(
            "forecastChart"
        );


    if (forecastChart)
        forecastChart.destroy();


    forecastChart =
        new Chart(ctx, {

            type: "bar",

            data: {

                labels,

                datasets: [{

                    label: "Predicted Units",

                    data: values,

                    borderWidth: 0

                }]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {
                        display: false
                    }

                },

                scales: {

                    y: {
                        beginAtZero: true
                    }

                }

            }

        });

}


/* =====================================================
   PRODUCT CHART - PAID PRODUCT REVENUE
===================================================== */

async function loadProductChart() {

    const ctx = document.getElementById("productChart");

    if (!ctx) return;

    try {

        // Get successfully paid orders
        const { data: paidOrders, error: ordersError } =
            await supabaseClient
                .from("orders")
                .select("id")
                .eq("status", "paid");

        if (ordersError) throw ordersError;

        // Destroy previous chart
        if (productChart) {
            productChart.destroy();
            productChart = null;
        }

        const orderIds = (paidOrders || []).map(order => order.id);

        // No paid orders available
        if (orderIds.length === 0) {

            productChart = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: ["No paid sales yet"],
                    datasets: [{
                        data: [1]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: "bottom"
                        }
                    }
                }
            });

            return;
        }

        // Get items belonging to paid orders
        const { data: items, error: itemsError } =
            await supabaseClient
                .from("order_items")
                .select("product_name, price, quantity")
                .in("order_id", orderIds);

        if (itemsError) throw itemsError;

        // Calculate revenue product-wise
        const revenueByProduct = {};

        (items || []).forEach(item => {

            const name = item.product_name || "Unknown Product";

            const revenue =
                Number(item.price || 0) *
                Number(item.quantity || 0);

            revenueByProduct[name] =
                (revenueByProduct[name] || 0) + revenue;

        });

        const labels = Object.keys(revenueByProduct);

        const values = Object.values(revenueByProduct);

        // Display chart
        productChart = new Chart(ctx, {

            type: "doughnut",

            data: {

                labels: labels.length ? labels : ["No product sales"],

                datasets: [{

                    label: "Paid Revenue",

                    data: labels.length ? values : [1],

                    borderWidth: 2

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        position: "bottom"
                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                const amount = Number(context.raw || 0);

                                return context.label + ": " +
                                    new Intl.NumberFormat("en-IN", {
                                        style: "currency",
                                        currency: "INR",
                                        maximumFractionDigits: 2
                                    }).format(amount);

                            }

                        }

                    }

                }

            }

        });

    } catch (error) {

        console.error("Product Chart Error:", error);

    }

}





/* =====================================================
   HELPERS
===================================================== */

function formatCurrency(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(
        Number(value || 0)
    );

}


function formatDate(date) {

    if (!date)
        return "—";


    return new Date(date)
        .toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

}


function statusBadge(status) {

    const clean =
        String(status || "pending")
            .toLowerCase();


    return `
        <span class="status ${clean}">
            ${clean}
        </span>
    `;

}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}