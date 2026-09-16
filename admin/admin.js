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

/*document.addEventListener("DOMContentLoaded", async () => {

    await checkAdmin();

    setupNavigation();

    setupButtons();

    await loadDashboard();

    await loadProducts();

    await loadOrders();

    await loadCustomers();

    await loadPayments();

    await loadReviews();

    await loadReports();

    await loadAnalytics();

});*/

document.addEventListener("DOMContentLoaded", async () => {

    // TEMPORARY FRONTEND TEST
    // await checkAdmin();

    setupNavigation();

    setupButtons();

});
/* =====================================================
   ADMIN SECURITY
===================================================== */

async function checkAdmin() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();


    if (error || !user) {

        window.location.href =
            "admin-login.html";

        return;

    }


    const {
        data: admin,
        error: adminError
    } = await supabaseClient

        .from("admin_users")

        .select("*")

        .eq("id", user.id)

        .maybeSingle();


    if (adminError || !admin) {

        await supabaseClient.auth.signOut();

        window.location.href =
            "admin-login.html";

        return;

    }


    document.getElementById("adminName").textContent =
        admin.full_name || "Admin Orinic";
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


    document.getElementById("createReportBtn")
        .addEventListener(
            "click",
            createReport
        );


    document.getElementById("collapseBtn")
        .addEventListener(
            "click",
            toggleSidebar
        );


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

    await supabaseClient.auth.signOut();

    window.location.href =
        "admin-login.html";
}


/* =====================================================
   DASHBOARD
===================================================== */

async function loadDashboard() {

    const {
        data,
        error
    } = await supabaseClient
        .from("orders")
        .select("*")
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(
            "Dashboard orders:",
            error
        );

        return;

    }


    orders = data || [];


    const today =
        new Date().toISOString()
            .split("T")[0];


    const todayOrders =
        orders.filter(order =>
            order.created_at.startsWith(today)
        );


    const todayRevenue =
        todayOrders.reduce(
            (sum, order) =>
                sum + Number(order.total_amount || 0),
            0
        );


    document.getElementById(
        "todayRevenue"
    ).textContent =
        formatCurrency(todayRevenue);


    const month =
        new Date().toISOString()
            .slice(0, 7);


    const monthlyOrders =
        orders.filter(order =>
            order.created_at.startsWith(month)
        );


    const monthlySales =
        monthlyOrders.reduce(
            (sum, order) =>
                sum + Number(order.total_amount || 0),
            0
        );


    document.getElementById(
        "monthlySales"
    ).textContent =
        formatCurrency(monthlySales);


    const pending =
        orders.filter(order =>
            ["pending", "processing"]
                .includes(
                    String(order.order_status)
                        .toLowerCase()
                )
        ).length;


    document.getElementById(
        "pendingOrders"
    ).textContent = pending;


    renderRecentOrders();

    await loadRevenueChart();

    await loadProductChart();

}


/* =====================================================
   RECENT ORDERS
===================================================== */

function renderRecentOrders() {

    const body =
        document.getElementById(
            "recentOrdersBody"
        );


    body.innerHTML = "";


    orders
        .slice(0, 5)
        .forEach(order => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${escapeHTML(order.order_number)}
                </td>

                <td>
                    ${escapeHTML(order.customer_name)}
                </td>

                <td>
                    Order
                </td>

                <td>
                    ${formatCurrency(order.total_amount)}
                </td>

                <td>
                    ${statusBadge(order.order_status)}
                </td>

            `;


            body.appendChild(row);

        });

}


/* =====================================================
   REVENUE CHART
===================================================== */

async function loadRevenueChart() {

    const labels = [];
    const values = [];

    const today = new Date();


    for (let i = 6; i >= 0; i--) {

        const date = new Date(today);

        date.setDate(
            today.getDate() - i
        );


        const key =
            date.toISOString()
                .split("T")[0];


        labels.push(
            date.toLocaleDateString(
                "en-IN",
                {
                    day: "numeric",
                    month: "short"
                }
            )
        );


        const revenue =
            orders
                .filter(order =>
                    order.created_at.startsWith(key)
                )
                .reduce(
                    (sum, order) =>
                        sum +
                        Number(
                            order.total_amount || 0
                        ),
                    0
                );


        values.push(revenue);

    }


    const ctx =
        document.getElementById(
            "revenueChart"
        );


    if (revenueChart)
        revenueChart.destroy();


    revenueChart =
        new Chart(ctx, {

            type: "line",

            data: {

                labels,

                datasets: [{

                    label: "Revenue",

                    data: values,

                    borderWidth: 2,

                    tension: 0.35,

                    fill: true

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

    updateCustomerCount();

}


function renderProducts(list) {

    const body =
        document.getElementById(
            "productsBody"
        );


    body.innerHTML = "";


    list.forEach(product => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>

                <div class="product-cell">

                    <img
                        src="../images/${escapeHTML(product.image || "")}"
                        onerror="this.style.display='none'"
                    >

                    <div>

                        ${escapeHTML(product.name)}

                        <small>
                            ${escapeHTML(product.tag || "")}
                        </small>

                    </div>

                </div>

            </td>


            <td>
                ₹${Number(product.price || 0).toFixed(0)}
            </td>


            <td>
                ${product.stock ?? 0}
            </td>


            <td>
                ⭐ ${Number(product.rating || 0).toFixed(1)}
            </td>


            <td>

                <div class="action-buttons">

                    <button
                        class="action-btn edit"
                        onclick="editProduct('${product.id}')"
                    >
                        ✎
                    </button>

                    <button
                        class="action-btn delete"
                        onclick="deleteProduct('${product.id}')"
                    >
                        ♡
                    </button>

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
        "productRating"
    ).value =
        product.rating || 0;


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


/* =====================================================
   SAVE PRODUCT
===================================================== */

async function saveProduct(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "productId"
        ).value;


    const product = {

        name:
            document.getElementById(
                "productName"
            ).value.trim(),

        price:
            Number(
                document.getElementById(
                    "productPrice"
                ).value
            ),

        stock:
            Number(
                document.getElementById(
                    "productStock"
                ).value
            ),

        rating:
            Number(
                document.getElementById(
                    "productRating"
                ).value
            ),

        tag:
            document.getElementById(
                "productTag"
            ).value.trim(),

        description:
            document.getElementById(
                "productDescription"
            ).value.trim(),

        image:
            document.getElementById(
                "productImage"
            ).value.trim()

    };


    let result;


    if (id) {

        result =
            await supabaseClient
                .from("products")
                .update(product)
                .eq("id", id);

    } else {

        result =
            await supabaseClient
                .from("products")
                .insert(product);

    }


    if (result.error) {

        alert(
            "Unable to save product: " +
            result.error.message
        );

        return;

    }


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

    const {
        data,
        error
    } = await supabaseClient

        .from("orders")

        .select("*")

        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(
            "Orders:",
            error
        );

        return;

    }


    orders = data || [];

    renderOrders("all");

}


function renderOrders(status) {

    const body =
        document.getElementById(
            "ordersBody"
        );


    body.innerHTML = "";


    let list = orders;


    if (status !== "all") {

        list =
            orders.filter(order =>
                String(order.order_status)
                    .toLowerCase() === status
            );

    }


    list.forEach(order => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(order.order_number)}
            </td>

            <td>
                ${escapeHTML(order.customer_name)}
            </td>

            <td>
                —
            </td>

            <td>
                ${formatDate(order.created_at)}
            </td>

            <td>
                <strong>
                    ${formatCurrency(order.total_amount)}
                </strong>
            </td>

            <td>

                <select
                    onchange="updateOrderStatus('${order.id}', this.value)"
                >

                    <option
                        value="processing"
                        ${order.order_status === "processing" ? "selected" : ""}
                    >
                        Processing
                    </option>

                    <option
                        value="shipped"
                        ${order.order_status === "shipped" ? "selected" : ""}
                    >
                        Shipped
                    </option>

                    <option
                        value="delivered"
                        ${order.order_status === "delivered" ? "selected" : ""}
                    >
                        Delivered
                    </option>

                </select>

            </td>

            <td>
                <button
                    class="action-btn view"
                    onclick="viewOrder('${order.id}')"
                >
                    View →
                </button>
            </td>

        `;


        body.appendChild(row);

    });

}


/* =====================================================
   UPDATE ORDER
===================================================== */

window.updateOrderStatus =
async function(id, status) {

    const {
        error
    } = await supabaseClient

        .from("orders")

        .update({
            order_status: status
        })

        .eq("id", id);


    if (error) {

        alert(error.message);

        return;

    }


    await loadOrders();

    await loadDashboard();

};


/* =====================================================
   VIEW ORDER
===================================================== */

window.viewOrder = function(id) {

    const order =
        orders.find(
            item =>
                String(item.id) === String(id)
        );


    if (!order)
        return;


    alert(
        `Order: ${order.order_number}\n` +
        `Customer: ${order.customer_name}\n` +
        `Phone: ${order.customer_phone || "N/A"}\n` +
        `Amount: ₹${order.total_amount}\n` +
        `Status: ${order.order_status}`
    );

};


/* =====================================================
   CUSTOMERS
===================================================== */

async function loadCustomers() {

    const {
        data,
        error
    } = await supabaseClient

        .from("profiles")

        .select("*")

        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(
            "Customers:",
            error
        );

        return;

    }


    const body =
        document.getElementById(
            "customersBody"
        );


    body.innerHTML = "";


    (data || []).forEach(customer => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(customer.full_name || "Customer")}
            </td>

            <td>
                ${escapeHTML(customer.email || "")}
            </td>

            <td>
                ${escapeHTML(customer.phone || "")}
            </td>

            <td>
                ${escapeHTML(customer.city || "")}
            </td>

            <td>
                ${formatDate(customer.created_at)}
            </td>

        `;


        body.appendChild(row);

    });


    document.getElementById(
        "totalCustomers"
    ).textContent =
        data?.length || 0;

}


/* =====================================================
   PAYMENTS
===================================================== */

async function loadPayments() {

    const {
        data,
        error
    } = await supabaseClient

        .from("payments")

        .select("*")

        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(
            "Payments:",
            error
        );

        return;

    }


    const body =
        document.getElementById(
            "paymentsBody"
        );


    body.innerHTML = "";


    (data || []).forEach(payment => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(payment.payment_id || "—")}
            </td>

            <td>
                ${payment.order_id || "—"}
            </td>

            <td>
                <strong>
                    ${formatCurrency(payment.amount)}
                </strong>
            </td>

            <td>
                ${escapeHTML(payment.method || "COD")}
            </td>

            <td>
                ${statusBadge(payment.status)}
            </td>

            <td>
                ${formatDate(payment.created_at)}
            </td>

        `;


        body.appendChild(row);

    });

}


/* =====================================================
   REVIEWS
===================================================== */

async function loadReviews() {

    const {
        data,
        error
    } = await supabaseClient

        .from("reviews")

        .select("*")

        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(
            "Reviews:",
            error
        );

        return;

    }


    const body =
        document.getElementById(
            "reviewsBody"
        );


    body.innerHTML = "";


    (data || []).forEach(review => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${review.product_id || "—"}
            </td>

            <td>
                ${escapeHTML(
                    review.user_name ||
                    review.customer_name ||
                    "Customer"
                )}
            </td>

            <td>
                ⭐ ${review.rating || 0}
            </td>

            <td>
                ${escapeHTML(
                    review.comment ||
                    review.review ||
                    ""
                )}
            </td>

            <td>
                ${formatDate(review.created_at)}
            </td>

            <td>

                <button
                    class="action-btn delete"
                    onclick="deleteReview('${review.id}')"
                >
                    🗑
                </button>

            </td>

        `;


        body.appendChild(row);

    });

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
   PRODUCT CHART
===================================================== */

async function loadProductChart() {

    const ctx =
        document.getElementById(
            "productChart"
        );


    if (!ctx)
        return;


    const labels =
        products.map(
            product => product.name
        );


    const values =
        products.map(
            product =>
                Number(product.stock || 0)
        );


    if (productChart)
        productChart.destroy();


    productChart =
        new Chart(ctx, {

            type: "doughnut",

            data: {

                labels,

                datasets: [{

                    data: values,

                    borderWidth: 2

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

}


/* =====================================================
   SIDEBAR COLLAPSE
===================================================== */

function toggleSidebar() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    const main =
        document.querySelector(
            ".main-content"
        );


    if (
        sidebar.style.width === "70px"
    ) {

        sidebar.style.width = "210px";

        main.style.marginLeft = "210px";

    } else {

        sidebar.style.width = "70px";

        main.style.marginLeft = "70px";

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