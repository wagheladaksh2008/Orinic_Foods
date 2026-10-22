/* Orinic Foods admin panel — reads the existing Supabase tables. */
const $ = (id) => document.getElementById(id);
let products = [], orders = [], customers = [], reviews = [], orderItems = [], payments = [];
const money = (value) => new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(value || 0));
const safe = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date = (value) => value ? new Date(value).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const norm = (v) => String(v ?? "").trim().toLowerCase();
function getProductImageUrl(image) {
    if (!image) return "";

    // Already an online image URL
    if (/^https?:\/\//i.test(image)) {
        return image;
    }

    // Existing local image filename
    return `../images/${image}`;
}
function showNotice(message,type="info"){const n=$("notice");n.textContent=message;n.className=`notice show ${type}`;window.clearTimeout(showNotice.timer);showNotice.timer=window.setTimeout(()=>n.className="notice",6000)}
function statusBadge(status){const s=norm(status)||"unknown";return `<span class="badge ${safe(s)}">${safe(s)}</span>`}
function valueOf(obj,keys,fallback="—"){for(const k of keys){if(obj && obj[k]!==undefined && obj[k]!==null && obj[k]!=="")return obj[k]}return fallback}
function orderStatus(o) {
    return norm(o.order_status || "pending");
}

function paymentStatus(o) {
    return norm(o.payment_status || "pending"); 
}
function productNameForItem(item){return valueOf(item,["product_name","name"], products.find(p=>String(p.id)===String(item.product_id))?.name || "Product")}
document.addEventListener("DOMContentLoaded", init);
async function init(){
  $("sideNav").addEventListener("click",e=>{const b=e.target.closest("[data-section]");if(b)navigate(b.dataset.section)});
  document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));
  $("logoutBtn").addEventListener("click",logout);
  $("addProductBtn").addEventListener("click",()=>openProductModal());
  ["closeProductModal","cancelProductBtn"].forEach(id=>$(id).addEventListener("click",closeProductModal));
  $("productModal").addEventListener("click",e=>{if(e.target===$("productModal"))closeProductModal()});
  $("productForm").addEventListener("submit",saveProduct);
  $("productImageUpload").addEventListener("change", async function () {
    const file = this.files[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
        showNotice("Please select a JPG, PNG, or WEBP image.", "error");
        this.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotice("Image size must be less than 5 MB.", "error");
        this.value = "";
        return;
    }

    const preview = $("productImagePreview");

    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";

    const safeName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "-");

    const filePath = `${Date.now()}-${safeName}`;

    showNotice("Uploading product image...", "info");

    try {
        const { data, error } = await supabaseClient
            .storage
            .from("product-images")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false
            });

        if (error) throw error;

        const { data: publicData } = supabaseClient
            .storage
            .from("product-images")
            .getPublicUrl(data.path);

        $("productImage").value = publicData.publicUrl;

        showNotice("Product image uploaded successfully!", "success");

    } catch (error) {
        console.error("Image upload error:", error);
        showNotice("Image upload failed: " + error.message, "error");

        preview.src = "";
        preview.style.display = "none";
        this.value = "";
    }
});
  $("productSearch").addEventListener("input",renderProducts);
  $("orderSearch").addEventListener("input",renderOrders);
  $("orderFilter").addEventListener("change",renderOrders);
  $("customerSearch").addEventListener("input",renderCustomers);
  $("reviewSearch").addEventListener("input",renderReviews);
  $("reviewRatingFilter").addEventListener("change",renderReviews);
  $("refreshOrders").addEventListener("click",loadOrders);
  $("refreshCustomers").addEventListener("click",loadCustomers);
  $("refreshReviews").addEventListener("click",loadReviews);
  const {data:{user},error}=await supabaseClient.auth.getUser();
  if(error||!user){location.replace("../Login.html");return}
  const {data:admin,error:adminError}=await supabaseClient.from("admin_users").select("id,full_name,email").eq("id",user.id).maybeSingle();
  if(adminError||!admin){await supabaseClient.auth.signOut();location.replace("../Login.html");return}
  $("adminName").textContent=admin.full_name||admin.email||"Administrator";
  await Promise.all([loadProducts(),loadOrders(),loadCustomers(),loadReviews()]);
  renderProducts(); renderOrders(); renderCustomers(); renderReviews(); renderDashboard();
}
function navigate(name){document.querySelectorAll(".page-section").forEach(s=>s.classList.toggle("active",s.id===`section-${name}`));document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.section===name));const labels={dashboard:"Dashboard",products:"Products",orders:"Orders",customers:"Customers",reviews:"Product reviews"};$("pageTitle").textContent=labels[name]||"Dashboard";window.scrollTo({top:0,behavior:"smooth"})}
async function logout(){const {error}=await supabaseClient.auth.signOut();if(error){showNotice("Could not log out: "+error.message,"error");return}location.replace("../Login.html")}
async function loadProducts(){const {data,error}=await supabaseClient.from("products").select("*").order("created_at",{ascending:false});if(error){showNotice("Products could not be loaded: "+error.message,"error");$("productsBody").innerHTML=`<tr><td colspan="6" class="empty">Unable to load products. Check products-table permissions.</td></tr>`;return}products=data||[];renderProducts();renderDashboard()}
function renderProducts(){const q=norm($("productSearch").value);const list=products.filter(p=>norm(p.name).includes(q)||norm(p.tag).includes(q));$("productCount").textContent=`${list.length} product${list.length===1?"":"s"}`;$("productsBody").innerHTML=list.length?list.map(p=>`<tr><td><div class="product-cell"><img
    class="product-thumb"
    src="${safe(getProductImageUrl(p.image))}"
    alt="${safe(p.name)}"
    onerror="this.style.visibility='hidden'"
><div><b>${safe(p.name)}</b><span class="subtext">ID: ${safe(p.id)}</span></div></div></td><td>${safe(p.tag||"—")}</td><td><b>${money(p.price)}</b></td><td>${safe(p.stock??"—")}</td><td>${safe(p.description||"—")}</td><td><div class="row-actions"><button class="mini-btn edit" data-edit-product="${safe(p.id)}">Edit</button><button class="mini-btn delete" data-delete-product="${safe(p.id)}">Delete</button></div></td></tr>`).join(""):`<tr><td colspan="6" class="empty">No products found.</td></tr>`; $("productsBody").querySelectorAll("[data-edit-product]").forEach(b=>b.addEventListener("click",()=>openProductModal(products.find(p=>String(p.id)===b.dataset.editProduct))));$("productsBody").querySelectorAll("[data-delete-product]").forEach(b=>b.addEventListener("click",()=>deleteProduct(b.dataset.deleteProduct)))}
function openProductModal(p = null) {
    $("productForm").reset();

    $("productId").value = p?.id ?? "";
    $("productModalTitle").textContent = p ? "Update product" : "Add product";

    $("productName").value = p?.name || "";
    $("productPrice").value = p?.price ?? "";
    $("productStock").value = p?.stock ?? 0;
    $("productTag").value = p?.tag || "";
    $("productImage").value = p?.image || "";
    $("productDescription").value = p?.description || "";
    $("productIngredients").value = p?.ingredients || "";
    $("productNutrition").value = p?.nutritional_info || "";
    $("productBenefits").value = p?.benefits || "";
    $("productImage2").value = p?.image_2 || "";
    $("productImage3").value = p?.image_3 || "";

    $("productImageUpload").value = "";

    const preview = $("productImagePreview");

    if (p?.image) {
        preview.src = getProductImageUrl(p.image);
        preview.style.display = "block";
    } else {
        preview.src = "";
        preview.style.display = "none";
    }

    $("productModal").classList.add("show");
    $("productModal").setAttribute("aria-hidden", "false");
}
function closeProductModal(){$("productModal").classList.remove("show");$("productModal").setAttribute("aria-hidden","true")}
async function saveProduct(e){e.preventDefault();const id=$("productId").value;const payload={name:$("productName").value.trim(),price:Number($("productPrice").value),tag:$("productTag").value.trim(),description:$("productDescription").value.trim(),image:$("productImage").value.trim(),ingredients:$("productIngredients").value.trim(),nutritional_info:$("productNutrition").value.trim(),benefits:$("productBenefits").value.trim(),image_2:$("productImage2").value.trim(),image_3:$("productImage3").value.trim()};const stock=Number($("productStock").value);if(!payload.name||!Number.isFinite(payload.price)||payload.price<=0||!Number.isInteger(stock)||stock<0){showNotice("Enter a product name, valid price, and non-negative whole-number stock.","error");return}payload.stock=stock;const btn=$("saveProductBtn");btn.disabled=true;btn.textContent="Saving…";try{let result=id?await supabaseClient.from("products").update(payload).eq("id",id):await supabaseClient.from("products").insert(payload);if(result.error)throw result.error;closeProductModal();showNotice(id?"Product updated successfully.":"Product added successfully.","success");await loadProducts()}catch(err){console.error(err);showNotice("Could not save product: "+(err.message||"Database error"),"error")}finally{btn.disabled=false;btn.textContent="Save product"}}
async function deleteProduct(id){const p=products.find(x=>String(x.id)===String(id));if(!p||!confirm(`Delete “${p.name}” from the catalogue? This cannot be undone.`))return;const {error}=await supabaseClient.from("products").delete().eq("id",id);if(error){showNotice("Could not delete product: "+error.message,"error");return}showNotice("Product deleted.","success");await loadProducts()}
async function loadOrders(){ $("ordersBody").innerHTML=`<tr><td colspan="9" class="empty">Loading orders…</td></tr>`;const [or,ir,pr]=await Promise.all([supabaseClient.from("orders").select("*").order("created_at",{ascending:false}),supabaseClient.from("order_items").select("*"),supabaseClient.from("payments").select("*").order("created_at",{ascending:false})]);if(or.error){console.error(or.error);$("ordersBody").innerHTML=`<tr><td colspan="9" class="empty">Orders unavailable: ${safe(or.error.message)}</td></tr>`;showNotice("Could not load orders: "+or.error.message,"error");return}orders=or.data||[];orderItems=ir.error?[]:(ir.data||[]);payments=pr.error?[]:(pr.data||[]);renderOrders();renderRecentOrders();renderDashboard()}
function itemsFor(o){return orderItems.filter(i=>String(i.order_id)===String(o.id))}
function paymentFor(o){return payments.find(p=>String(p.order_id)===String(o.id))||{}}
function productText(o){const items=itemsFor(o);if(items.length)return items.map(i=>`${productNameForItem(i)} × ${valueOf(i,["quantity"],1)}`).join(", ");return valueOf(o,["product_name","products"],"—")}
function orderNumber(o){return valueOf(o,["order_number","razorpay_order_id","id"])}
function paymentId(o){return valueOf(o,["razorpay_payment_id","payment_id"],valueOf(paymentFor(o),["razorpay_payment_id","payment_id"],"—"))}
function orderAmount(o){return valueOf(o,["amount","total_amount","total"],valueOf(paymentFor(o),["amount"],0))}
function address(o){return valueOf(o,["shipping_address","delivery_address","address"],[o.city,o.state,o.postal_code].filter(Boolean).join(", ")||"—")}
function renderOrders() {
    const q = norm($("orderSearch").value);
    const filter = $("orderFilter").value;

    const list = orders.filter(o => {
        const hay = [
            orderNumber(o),
            paymentId(o),
            o.customer_name,
            o.customer_email,
            o.phone,
            productText(o)
        ].join(" ");

        const st = orderStatus(o);

        return (!q || norm(hay).includes(q)) &&
            (filter === "all" || st === filter);
    });

    $("ordersBody").innerHTML = list.length
        ? list.map(o => {
            const st = orderStatus(o);
            const ps = paymentStatus(o);

            return `
                <tr>
                    <td>
                        <b>${safe(orderNumber(o))}</b>
                        <span class="subtext">${date(o.created_at)}</span>
                    </td>

                    <td>${safe(paymentId(o))}</td>

                    <td>
                        <b>${safe(valueOf(o, ["customer_name"], "Customer"))}</b>
                        <span class="subtext">${safe(valueOf(o, ["customer_email"], ""))}</span>
                        <span class="subtext">${safe(valueOf(o, ["phone"], ""))}</span>
                    </td>

                    <td>${safe(productText(o))}</td>

                    <td><b>${money(orderAmount(o))}</b></td>

                    <td class="address-cell">
                        ${safe(address(o))}
                    </td>

                    <td>
                        <button
                            type="button"
                            class="mini-btn edit"
                            data-copy-order="${safe(o.id)}">
                            Copy Order Info
                        </button>
                    </td>

                    <td>
                        <select
                            class="status-select"
                            data-order-status="${safe(o.id)}"
                            aria-label="Update delivery status">

                            <option value="pending" ${st === "pending" ? "selected" : ""}>
                                Pending
                            </option>

                            <option value="delivered" ${st === "delivered" ? "selected" : ""}>
                                Delivered
                            </option>
                        </select>
                    </td>

                    <td>
                        ${statusBadge(ps)}
                    </td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="9" class="empty">No matching orders found.</td></tr>`;

    // Delivery status change
    $("ordersBody").querySelectorAll("[data-order-status]")
        .forEach(select => {
            select.addEventListener("change", () => {
                updateOrderStatus(
                    select.dataset.orderStatus,
                    select.value
                );
            });
        });

    // Copy order information
    $("ordersBody").querySelectorAll("[data-copy-order]")
        .forEach(button => {
            button.addEventListener("click", () => {
                copyOrderInfo(button.dataset.copyOrder, button);
            });
        });
}
async function copyOrderInfo(id, button) {

    const o = orders.find(
        order => String(order.id) === String(id)
    );

    if (!o) {
        showNotice("Order not found.", "error");
        return;
    }

    const items = itemsFor(o);

    const productDetails = items.length
        ? items.map(item =>
            `${productNameForItem(item)} x ${item.quantity}`
        ).join("\n")
        : productText(o);

    const info = `
ORINIC FOODS - ORDER DETAILS

Order ID: ${orderNumber(o)}
Order Date: ${new Date(o.created_at).toLocaleString("en-IN")}

CUSTOMER DETAILS
Customer Name: ${o.customer_name || "—"}
Phone: ${o.phone || "—"}

PRODUCT DETAILS
${productDetails}

Total Amount: ${money(orderAmount(o))}

DELIVERY ADDRESS
${address(o)}

DELIVERY STATUS: ${orderStatus(o) === "delivered" ? "Delivered" : "Pending"}

PAYMENT STATUS: ${paymentStatus(o) === "paid" ? "Paid" : "Pending"}

Razorpay Payment ID: ${paymentId(o)}

Thank you!
ORINIC FOODS
`.trim();

    try {
        await navigator.clipboard.writeText(info);

        const oldText = button.textContent;
        button.textContent = "Copied!";

        setTimeout(() => {
            button.textContent = oldText;
        }, 1500);

        showNotice(
            "Order information copied successfully!",
            "success"
        );

    } catch (error) {
        console.error("Clipboard error:", error);

        showNotice(
            "Could not copy order information. Use localhost or HTTPS and allow clipboard access.",
            "error"
        );
    }
}
async function updateOrderStatus(id, status) {

    if (!["pending", "delivered"].includes(status)) {
        showNotice("Invalid delivery status.", "error");
        await loadOrders();
        return;
    }

    try {

        const { data, error } = await supabaseClient
            .from("orders")
            .update({
                order_status: status
            })
            .eq("id", id)
            .select("id, order_status")
            .maybeSingle();

        // Check for database errors
        if (error) {
            console.error("Order status update error:", error);

            showNotice(
                "Update failed: " + error.message,
                "error"
            );

            await loadOrders();
            return;
        }

        // Check whether Supabase actually updated a row
        if (!data) {

            console.error(
                "No order was updated. Check the RLS UPDATE policy.",
                { id, status }
            );

            showNotice(
                "No row updated. Check Supabase RLS permissions.",
                "error"
            );

            await loadOrders();
            return;
        }

        // Update local order data
        const order = orders.find(
            o => String(o.id) === String(data.id)
        );

        if (order) {
            order.order_status = data.order_status;
        }

        showNotice(
            "Delivery status updated successfully!",
            "success"
        );

        await loadOrders();

    } catch (error) {

        console.error(error);

        showNotice(
            "Unexpected error: " + error.message,
            "error"
        );

        await loadOrders();
    }
}
function renderRecentOrders(){const list=orders.slice(0,6);$("recentOrdersBody").innerHTML=list.length?list.map(o=>`<tr><td><b>${safe(orderNumber(o))}</b><span class="subtext">${date(o.created_at)}</span></td><td>${safe(valueOf(o,["customer_name"],"Customer"))}</td><td>${safe(productText(o))}</td><td><b>${money(orderAmount(o))}</b></td><td>${statusBadge(orderStatus(o))}</td></tr>`).join(""):`<tr><td colspan="5" class="empty">No orders received yet.</td></tr>`}
async function loadCustomers(){ $("customersBody").innerHTML=`<tr><td colspan="6" class="empty">Loading customers…</td></tr>`;const {data,error}=await supabaseClient.from("profiles").select("*").order("created_at",{ascending:false});if(error){console.error(error);$("customersBody").innerHTML=`<tr><td colspan="6" class="empty">Customers unavailable: ${safe(error.message)}</td></tr>`;showNotice("Could not load customers: "+error.message,"error");return}customers=data||[];renderCustomers();renderDashboard()}
function customerOrderCount(c){return orders.filter(o=>{const linkedIds=[o.customer_id,o.user_id,o.profile_id].filter(v=>v!==undefined&&v!==null).map(String);const emails=[o.customer_email,o.email].filter(Boolean).map(norm);const names=[o.customer_name,o.full_name].filter(Boolean).map(norm);return linkedIds.includes(String(c.id))||(c.email&&emails.includes(norm(c.email)))||(valueOf(c,["full_name","name"],"")&&names.includes(norm(valueOf(c,["full_name","name"],""))))}).length}
function renderCustomers() {
    const q = norm($("customerSearch").value);

    const list = customers.filter(c =>
        norm([
            c.full_name,
            c.name,
            c.email,
            c.phone,
            c.address
        ].join(" ")).includes(q)
    );

    $("customerCount").textContent =
        `${list.length} customer${list.length === 1 ? "" : "s"}`;

    $("customersBody").innerHTML = list.length
        ? list.map(c => {
            const count = reviews.filter(
                r => String(r.user_id) === String(c.id)
            ).length;

            const ordersCount = customerOrderCount(c);

            return `
                <tr>
                    <td><b>${safe(valueOf(c, ["full_name", "name"], "Customer"))}</b></td>
                    <td>${safe(c.email || "—")}</td>
                    <td>${safe(c.phone || "—")}</td>
                    <td>${safe(c.address || "—")}</td>
                    <td><b>${ordersCount}</b></td>
                    <td>
                        <button
                            class="mini-btn edit"
                            data-customer-reviews="${safe(c.id)}"
                        >${count} view</button>
                    </td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="6" class="empty">No customers found.</td></tr>`;

    $("customersBody")
        .querySelectorAll("[data-customer-reviews]")
        .forEach(b => b.addEventListener("click", () => {
            navigate("reviews");

            $("reviewSearch").value =
                customers.find(c =>
                    String(c.id) === b.dataset.customerReviews
                )?.email || "";

            renderReviews();
        }));
}

async function loadReviews(){ $("reviewsBody").innerHTML=`<tr><td colspan="5" class="empty">Loading reviews…</td></tr>`;const {data,error}=await supabaseClient.from("reviews").select("*").order("created_at",{ascending:false});if(error){console.error(error);reviews=[];$("reviewsBody").innerHTML=`<tr><td colspan="5" class="empty">Reviews unavailable: ${safe(error.message)}</td></tr>`;showNotice("Could not load reviews: "+error.message,"error");return}reviews=data||[];renderReviews();renderCustomers();renderDashboard()}
function renderReviews(){const q=norm($("reviewSearch").value),rating=$("reviewRatingFilter").value;const list=reviews.filter(r=>{const p=products.find(x=>String(x.id)===String(r.product_id));const c=customers.find(x=>String(x.id)===String(r.user_id));return (!q||norm([p?.name,r.product_name,r.review,r.comment,c?.full_name,c?.email].join(" ")).includes(q))&&(rating==="all"||String(r.rating)===rating)});const average=reviews.length?reviews.reduce((s,r)=>s+Number(r.rating||0),0)/reviews.length:0;$("reviewSummary").innerHTML=`<div class="summary-pill"><b>${reviews.length}</b> reviews</div><div class="summary-pill"><b>★ ${average.toFixed(1)}</b> average rating</div>`;$("reviewsBody").innerHTML=list.length?list.map(r=>{const p=products.find(x=>String(x.id)===String(r.product_id)),c=customers.find(x=>String(x.id)===String(r.user_id));const stars="★".repeat(Math.max(0,Math.min(5,Number(r.rating)||0)))+"☆".repeat(5-Math.max(0,Math.min(5,Number(r.rating)||0)));return `<tr><td><b>${safe(p?.name||r.product_name||"Product")}</b></td><td>${safe(c?.full_name||r.customer_name||"Customer")}<span class="subtext">${safe(c?.email||"")}</span></td><td><span class="stars">${stars}</span><span class="subtext">${safe(r.rating||0)}/5</span></td><td><div class="review-text">${safe(valueOf(r,["review","comment","content"],"No written comment"))}</div></td><td>${date(r.created_at)}</td></tr>`}).join(""):`<tr><td colspan="5" class="empty">No matching reviews found.</td></tr>`}
function renderDashboard(){const paid=orders.filter(o=>paymentStatus(o)==="paid");const revenue=paid.reduce((sum,o)=>sum+Number(orderAmount(o)||0),0);const pending=orders.filter(o=>orderStatus(o)==="pending").length;$("statRevenue").textContent=money(revenue);$("statOrders").textContent=orders.length;$("statPendingOrders").textContent=pending;$("statCustomers").textContent=customers.length;$("statProducts").textContent=products.length;$("pendingOrdersCount").textContent=pending;$("pendingBadge").textContent=pending;$("reviewsCount").textContent=reviews.length;$("latestOrderDate").textContent=orders.length?date(orders[0].created_at):"—";renderRecentOrders()}