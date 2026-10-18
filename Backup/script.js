let currentImageIndex = 0;
const productKeys = [
  "mango",
  "jamun",
  "coco",
  "corn"
];
let currentProductKey = "";
//PRODUCTS 

const products = {

  mango: {
    title: "Mango Crunchy Fruits",
    price: "₹149",
    images:[
    "Mango_pro.png",
    "MANGO_image.png",
    "Mango_info.png"
    ],
    tagline: "Real Mango. Real Crunch.",
    description:
"Made from real Alphonso mangoes using freeze-drying technology that preserves taste and delivers a natural light & crunchy snack.",
    benefits: [
      "Natural Vitamin C",
      "No Preservatives",
      "Real Fruit Goodness",
      "Travel Friendly"
    ]
  },

  jamun: {
    title: "Jamun Crunchy Fruits",
    price: "₹149",
    images:[
    "Jamun_pro.png",
    "JAMUN_image.png",
    "Jamun_info.png"
    ],
    tagline: "The Power Of Jamun.",
    description:
"Crafted from real jamun fruit with a unique sweet-tangy flavour and satisfying crunch.",
    benefits: [
      "Made From Real Jamun",
      "Unique Fruity Taste",
      "No Preservatives",
      "Light & Crunchy Texture"
    ]
  },

  coco: {
    title: "Coco Crunch",
    price: "₹199",
    images:[
    "Coco_pro.png",
    "Coco_image.png",
    "Coco_info.png"
    ],
    tagline: "Rich Cocoa. Light Crunch.",
    description:
      "A fun and delicious crunchy treat inspired by the rich taste of Coco. Enjoy every bite packed with flavour and satisfying texture.",
    benefits: [
      "Coco's Goodness",
      "Crunchy Texture",
      "Fun Anytime Snack",
      "Unique Freeze-Dried Experience"
    ]
  },

  corn: {
    title: "Cream & Onion Corn",
    price: "₹99",
    images:[
    "Corn_pro.png",
    "CORN_image.png",
    "Corn_info.png"
    ],
    tagline: "Savory. Crispy. Addictive.",
    description:
      "A perfect blend of cream and onion flavour with crunchy corn. Packed with taste and texture, it's an ideal snack for every occasion.",
    benefits: [
      "Rich Cream & Onion Flavour",
      "Crispy Corn Crunch",
      "Perfect Tea-Time Snack",
      "Delicious Anytime Treat"
    ]
  }

};

// OPEN MODAL
function openModal(product) {
  document.getElementById("productName").value = product;
  document.getElementById("orderModal").style.display = "flex";
}

// CLOSE MODAL
function closeModal() {
  document.getElementById("orderModal").style.display = "none";
}

// SEND WHATSAPP MESSAGE
function sendWhatsApp() {

  let product = document.getElementById("productName").value;
  let qty = document.getElementById("quantity").value;
  let name = document.getElementById("customerName").value;
  let address = document.getElementById("address").value;
  let phone = document.getElementById("phone").value;

  if(!product || !qty || !name || !address || !phone){
    alert("Please fill all fields");
    return;
  }

  let message =
`Hello Orinic Foods,

I want to place an order:

Product: ${product}
Quantity: ${qty}

Name: ${name}
Phone: ${phone}
Address: ${address}

Payment Method: Cash on Delivery`;

  let whatsappNumber = "919284931474";

  let url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
}

function updateDots(index){

  const dots =
  document.querySelectorAll(".dot");

  dots.forEach(dot =>
    dot.classList.remove("active")
  );

  dots[index].classList.add("active");

}

function showDetails(productKey){
  currentProductKey = productKey;

  document.body.style.overflow = "hidden";

  const product = products[productKey];

  currentImageIndex = 0;
  updateDots(0);
  document.getElementById("detailImage").src =
  product.images[currentImageIndex];

  document.getElementById("detailTitle").innerText =
    product.title;

  document.getElementById("detailPrice").innerText =
    product.price;

  document.getElementById("detailTagline").innerText =
    product.tagline;

  document.getElementById("detailDescription").innerText =
    product.description;

  let benefitsHTML = "";

    product.benefits.forEach(function(item){
      benefitsHTML += `<p class="benefit-item">✓ ${item}</p>`;
    });

document.getElementById("detailBenefits").innerHTML =
benefitsHTML;

  document.getElementById("detailOrderBtn").onclick =
    function(){
      closeDetails();
      openModal(product.title);
    };

  document.getElementById("detailsModal").style.display =
    "flex";

  document.getElementById("prevImage").onclick =
function(){

  currentImageIndex--;

  if(currentImageIndex < 0){

    currentImageIndex =
    product.images.length - 1;

  }

  document.getElementById("detailImage").src =
  product.images[currentImageIndex];
  updateDots(currentImageIndex);

};

document.getElementById("nextImage").onclick =
function(){

  currentImageIndex++;

  if(currentImageIndex >= product.images.length){

    currentImageIndex = 0;

  }

  document.getElementById("detailImage").src =
  product.images[currentImageIndex];
  updateDots(currentImageIndex);
};

document.getElementById("prevProduct").onclick =
function(){

  let index =
  productKeys.indexOf(currentProductKey);

  index--;

  if(index < 0){
    index = productKeys.length - 1;
  }

  showDetails(productKeys[index]);
};

document.getElementById("nextProduct").onclick =
function(){

  let index =
  productKeys.indexOf(currentProductKey);

  index++;

  if(index >= productKeys.length){
    index = 0;
  }

  showDetails(productKeys[index]);
};

}

function closeDetails(){

  document.body.style.overflow = "auto";
  
  document.getElementById("detailsModal").style.display =
    "none";
}

window.onclick = function(event){

  const detailsModal =
  document.getElementById("detailsModal");

  const orderModal =
  document.getElementById("orderModal");

  if(event.target === detailsModal){
    closeDetails();
  }

  if(event.target === orderModal){
    closeModal();
  }

}

let touchStartX = 0;
let touchEndX = 0;

const imageElement =
document.getElementById("detailImage");

imageElement.addEventListener(
  "touchstart",
  function(e){
    touchStartX =
    e.changedTouches[0].screenX;
  }
);

imageElement.addEventListener(
  "touchend",
  function(e){

    touchEndX =
    e.changedTouches[0].screenX;

    handleSwipe();
  }
);

function handleSwipe(){

  if(touchEndX < touchStartX - 50){
    document.getElementById("nextImage").click();
  }

  if(touchEndX > touchStartX + 50){
    document.getElementById("prevImage").click();
  }

}