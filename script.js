let products = [];
let filteredProducts = [];
const productsPerPage = 4;
let currentPage = 1;

async function fetchProducts() {
  try {
    const response = await fetch("products.json");
    if (!response.ok) throw new Error("Network response was not ok");
    products = await response.json();
    filteredProducts = products;

    if (products.length === 0) {
      document.getElementById("products-container").innerHTML =
        "<p>Tidak ada produk tersedia.</p>";
    } else {
      renderProducts();
    }
  } catch (error) {
    console.error("Gagal mengambil data produk:", error);
    showToast("Gagal mengambil data produk. Silakan coba lagi.", false);
  }
}

// Fungsi untuk menampilkan detail produk di modal
function showProductDetail(productId) {
  const product = products.find((p) => p.id === productId);
  if (product) {
    document.getElementById("modal-product-image").src = product.image;
    document.getElementById("modal-product-title").textContent = product.title;
    document.getElementById("modal-product-description").textContent =
      product.description;
    document.getElementById("modal-product-price").textContent =
      product.price.toLocaleString();
    document
      .getElementById("modal-product-sold")
      .querySelector("span").textContent = product.sold;
    document
      .getElementById("modal-product-rating")
      .querySelector("span").textContent = product.rating;

    document.getElementById("add-to-cart-btn").onclick = () =>
      addToCart(product);

    const productModal = new bootstrap.Modal(
      document.getElementById("productModal")
    );
    productModal.show();
  }
}

// Fungsi untuk menambahkan produk ke keranjang
function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingProduct = cart.find((item) => item.id === product.id);

  if (existingProduct) {
    existingProduct.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  showToast("Produk berhasil ditambahkan ke keranjang!", true);
}

// Fungsi untuk menampilkan notifikasi toast
function showToast(message, success = true) {
  const toastElement = document.getElementById("toastNotification");
  const toastBody = toastElement.querySelector(".toast-body");

  toastBody.textContent = message;
  toastElement.className = `toast align-items-center ${
    success ? "text-bg-success" : "text-bg-danger"
  } border-0`;

  const toast = new bootstrap.Toast(toastElement);
  toast.show();
}

// Listen for input in the search field
document.getElementById("search-input").addEventListener("input", (event) => {
  const searchTerm = event.target.value.toLowerCase();
  filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchTerm)
  );
  currentPage = 1; // Reset to the first page after filtering
  renderProducts(currentPage); // Render filtered products
});

// Fungsi untuk merender produk di halaman
function renderProducts(page = 1) {
  const start = (page - 1) * productsPerPage;
  const end = start + productsPerPage;
  const visibleProducts = filteredProducts.slice(start, end);

  const productsContainer = document.getElementById("products-container");
  productsContainer.innerHTML = visibleProducts
    .map((product) => {
      const discountedPrice =
        product.price - (product.discount / 100) * product.price;
      return `  
            <div class="col-md-3 mb-4">  
                <div class="card position-relative">  
                    ${
                      product.discount > 0
                        ? `<div class="promo-label">Diskon ${product.discount}%</div>`
                        : ""
                    }  
                    <img src="${product.image}" class="card-img-top" alt="${
        product.title
      }">  
                    <div class="card-body">  
                        <h5 class="card-title">${product.title}</h5>  
                        <p class="card-text">${product.description}</p>  
                        <p class="text-danger">Rp${discountedPrice.toLocaleString()}</p>  
                        <p class="text-muted text-decoration-line-through">  
                            ${
                              product.discount > 0
                                ? `Rp${product.price.toLocaleString()}`
                                : ""
                            }  
                        </p>  
                        <button class="btn btn-primary" onclick="showProductDetail(${
                          product.id
                        })">  
                            Lihat Detail  
                        </button>  
                    </div>  
                </div>  
            </div>`;
    })
    .join("");

  renderPagination();
}

// Show the cart when the cart button is clicked
document.querySelector(".btn-outline-light").addEventListener("click", () => {
  document.getElementById("main-content").classList.add("hidden");
  document.getElementById("cart-content").classList.remove("hidden");
  renderCart(); // Render the cart items
});

// Show the product page when the back button is clicked
document.getElementById("back-to-shop").addEventListener("click", () => {
  document.getElementById("cart-content").classList.add("hidden");
  document.getElementById("main-content").classList.remove("hidden");
});

function renderCart() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotalContainer = document.getElementById("cart-total");

  if (cart.length === 0) {
    cartItemsContainer.innerHTML =
      "<p class='text-center'>Keranjang Anda kosong.</p>";
    cartTotalContainer.textContent = "Rp0";
    return;
  }

  let total = 0;
  cartItemsContainer.innerHTML = cart
    .map((item, index) => {
      // Calculate discounted price
      const discountedPrice = item.price - (item.discount / 100) * item.price;
      const subTotal = discountedPrice * item.quantity;
      total += subTotal;
      return `  
          <div class="cart-item border-bottom py-3 d-flex align-items-center">  
            <img src="${item.image}" alt="${
        item.title
      }" class="img-thumbnail me-3" style="width: 80px; height: auto;">  
            <div class="d-flex justify-content-between flex-grow-1">  
              <div>  
                <h6 class="mb-1">${item.title}</h6>  
                <p class="mb-0">Rp${discountedPrice.toLocaleString()} x ${
        item.quantity
      }</p>  
              </div>  
              <p class="mb-0 text-danger fs-6">Rp${subTotal.toLocaleString()}</p>  
            </div>  
            <button class="btn btn-danger btn-sm ms-2" onclick="removeFromCart(${index})">Hapus</button>  
          </div>`;
    })
    .join("");

  cartTotalContainer.textContent = `Rp${total.toLocaleString()}`;
}

document.getElementById("checkout-btn").addEventListener("click", () => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const shippingAddress = document.getElementById("shipping-address").value;

  if (cart.length === 0) {
    Swal.fire("Error", "Keranjang Anda kosong!", "error");
    return;
  }

  if (!shippingAddress.trim()) {
    Swal.fire("Error", "Mohon masukkan alamat pengiriman.", "error");
    return;
  }

  Swal.fire({
    title: "Konfirmasi Pesanan",
    text: "Apakah pesanan Anda sudah sesuai?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Ya, Beli!",
    cancelButtonText: "Batal",
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire(
        "Sukses!",
        "Pembelian sukses! Terima kasih telah berbelanja.",
        "success"
      );
      localStorage.removeItem("cart"); // Clear the cart
      renderCart(); // Update the cart display
    } else {
      Swal.fire("Dibatalkan", "Pembelian dibatalkan.", "info");
    }
  });
});

// Navigasi ke halaman keranjang
document.querySelector(".btn-outline-light").addEventListener("click", () => {
  document.getElementById("main-content").classList.add("hidden");
  document.getElementById("cart-content").classList.remove("hidden");
  renderCart();
});

// Tombol kembali ke toko
document.getElementById("back-to-shop").addEventListener("click", () => {
  document.getElementById("main-content").classList.remove("hidden");
  document.getElementById("cart-content").classList.add("hidden");
});

function removeFromCart(index) {
  Swal.fire({
    title: "Konfirmasi Hapus",
    text: "Anda yakin ingin menghapus item ini dari keranjang?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  }).then((result) => {
    if (result.isConfirmed) {
      // Remove item from cart
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      cart.splice(index, 1); // Remove the item at the specified index
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart(); // Refresh the cart display
      Swal.fire("Terhapus!", "Item telah dihapus dari keranjang.", "success");
    }
  });
}

// Fungsi untuk merender pagination
function renderPagination() {
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginationContainer = document.getElementById("pagination");

  paginationContainer.innerHTML = Array.from({ length: totalPages }, (_, i) => {
    const pageNumber = i + 1;
    return `
      <li class="page-item ${pageNumber === currentPage ? "active" : ""}">
        <a href="#" class="page-link" data-page="${pageNumber}">${pageNumber}</a>
      </li>`;
  }).join("");

  paginationContainer.querySelectorAll(".page-link").forEach((link) =>
    link.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = parseInt(e.target.dataset.page, 10);
      renderProducts(currentPage);
    })
  );
}

// Fungsi Filter dan Sorting
function filterAndSort() {
  const selectedCategory = document.getElementById("category-filter").value;
  const sortOption = document.getElementById("sort-options").value;

  // Filter berdasarkan kategori
  filteredProducts = products.filter((product) => {
    return selectedCategory === "all" || product.category === selectedCategory;
  });

  // Sorting
  if (sortOption === "price-asc") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortOption === "price-desc") {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortOption === "discount") {
    filteredProducts.sort((a, b) => b.discount - a.discount);
  }

  renderProducts(currentPage); // Render ulang produk
}

// Event Listener untuk Filter dan Sort
document.getElementById("category-filter").addEventListener("change", () => {
  currentPage = 1; // Reset ke halaman pertama
  filterAndSort();
});

document.getElementById("sort-options").addEventListener("change", () => {
  currentPage = 1; // Reset ke halaman pertama
  filterAndSort();
});

// Inisialisasi
fetchProducts();
