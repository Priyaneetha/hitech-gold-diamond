// Auth Check at Page Load
fetch("/api/admin/check")
  .then(res => {
    if (!res.ok) {
      window.location.href = "/admin.html";
    } else {
      // If authenticated, load dashboard content
      loadDashboardData();
    }
  })
  .catch(() => {
    window.location.href = "/admin.html";
  });

function loadDashboardData() {
  loadGoldRate();
  loadCategories();
  loadProducts();
  loadSliders();
  loadTagline();
  loadContact();
}

/* GOLD RATE */
function loadGoldRate() {
  fetch("/api/goldrate")
    .then(res => res.json())
    .then(data => {
      if (data && data.ratePerGram) {
        document.getElementById("goldRateInput").value = data.ratePerGram;
        if (document.getElementById("currentGoldRate")) {
          document.getElementById("currentGoldRate").innerText = `${data.ratePerGram} INR / g (8g: ${data.rate8g} INR)`;
        }
      }
    })
    .catch(err => console.error("Error loading gold rate:", err));
}

function updateGoldRate() {
  const rate = document.getElementById("goldRateInput").value;
  if (!rate || isNaN(rate) || rate <= 0) {
    alert("Please enter a valid positive gold rate.");
    return;
  }

  fetch("/api/goldrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ratePerGram: Number(rate) })
  })
  .then(res => {
    if (!res.ok) throw new Error("Unauthorized");
    alert("Gold rate updated successfully");
    loadGoldRate();
  })
  .catch(() => alert("Failed to update gold rate (unauthorized or server error)"));
}

/* CATEGORIES */
function loadCategories() {
  fetch("/api/categories")
    .then(res => res.json())
    .then(categories => {
      // Populate category dropdown in product form
      const dropdown = document.getElementById("category");
      if (dropdown) {
        dropdown.innerHTML = '<option value="">Select Category</option>';
        categories.forEach(cat => {
          dropdown.innerHTML += `<option value="${cat._id}">${cat.name}</option>`;
        });
      }

      // Populate category list in category management section
      const catList = document.getElementById("categoryList");
      if (catList) {
        catList.innerHTML = "";
        if (categories.length === 0) {
          catList.innerHTML = "<p>No categories found.</p>";
        } else {
          categories.forEach(cat => {
            catList.innerHTML += `
              <div class="list-item">
                <span>${cat.name}</span>
                <button class="btn-danger-sm" onclick="deleteCategory('${cat._id}')">Delete</button>
              </div>
            `;
          });
        }
      }
    })
    .catch(err => console.error("Error loading categories:", err));
}

function addCategory() {
  const name = document.getElementById("newCategoryName").value.trim();
  if (!name) {
    alert("Category name is required.");
    return;
  }

  fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  })
  .then(res => {
    if (!res.ok) throw new Error("Unauthorized");
    alert("Category added successfully");
    document.getElementById("newCategoryName").value = "";
    loadCategories();
  })
  .catch(() => alert("Failed to add category"));
}

function deleteCategory(id) {
  if (!confirm("Are you sure you want to delete this category? Products in this category might become orphaned.")) return;

  fetch(`/api/categories/${id}`, {
    method: "DELETE"
  })
  .then(res => {
    if (!res.ok) throw new Error("Unauthorized");
    alert("Category deleted");
    loadCategories();
    loadProducts(); // Reload products to reflect changes
  })
  .catch(() => alert("Failed to delete category"));
}

/* PRODUCTS */
function loadProducts() {
  fetch("/api/products")
    .then(res => res.json())
    .then(products => {
      const prodList = document.getElementById("productListTable");
      if (prodList) {
        prodList.innerHTML = "";
        if (products.length === 0) {
          prodList.innerHTML = "<tr><td colspan='7' style='text-align:center;'>No products found.</td></tr>";
        } else {
          products.forEach(p => {
            const catName = p.category ? p.category.name : "<em style='color:red;'>No Category</em>";
            const imageTag = p.image ? `<img src="${p.image}" class="thumbnail-img">` : "No Image";
            
            // Check status – default to true if undefined
            const inStock = p.inStock !== false;
            const badgeClass = inStock ? "badge-instock" : "badge-outofstock";
            const badgeText = inStock ? "In Stock" : "Out of Stock";
            
            prodList.innerHTML += `
              <tr>
                <td>${imageTag}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.modelNo || "-"}</td>
                <td>${catName}</td>
                <td>₹ ${Number(p.price).toLocaleString("en-IN")}</td>
                <td>
                  <span class="badge-stock ${badgeClass}" onclick="toggleProductStock('${p._id}', ${inStock})">
                    ${badgeText}
                  </span>
                </td>
                <td>
                  <button class="btn-danger-sm" onclick="deleteProduct('${p._id}')">Delete</button>
                </td>
              </tr>
            `;
          });
        }
      }
    })
    .catch(err => console.error("Error loading products:", err));
}

function toggleProductStock(id, currentStatus) {
  const newStatus = !currentStatus;
  fetch(`/api/products/${id}/availability`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inStock: newStatus })
  })
  .then(res => {
    if (!res.ok) throw new Error("Unauthorized or Bad Request");
    loadProducts(); // reload catalog to reflect toggled status
  })
  .catch(err => {
    console.error("Failed to toggle stock status:", err);
    alert("Failed to toggle availability status");
  });
}

function addProduct() {
  const name = document.getElementById("name").value.trim();
  const modelNo = document.getElementById("modelNo").value.trim();
  const category = document.getElementById("category").value;
  const price = document.getElementById("price").value;
  const description = document.getElementById("description").value.trim();
  const image = document.getElementById("image").files[0];
  const inStockCheckbox = document.getElementById("inStock");
  const inStock = inStockCheckbox ? inStockCheckbox.checked : true;

  if (!name || !category || !price) {
    alert("Name, category, and price are required.");
    return;
  }

  const data = new FormData();
  data.append("name", name);
  data.append("modelNo", modelNo);
  data.append("category", category);
  data.append("price", price);
  data.append("description", description);
  data.append("inStock", inStock);
  if (image) {
    data.append("image", image);
  }

  fetch("/api/products", {
    method: "POST",
    body: data
  })
  .then(res => {
    if (!res.ok) throw new Error("Unauthorized");
    alert("Product added successfully");
    // Reset form fields
    document.getElementById("name").value = "";
    document.getElementById("modelNo").value = "";
    document.getElementById("category").value = "";
    document.getElementById("price").value = "";
    document.getElementById("description").value = "";
    document.getElementById("image").value = "";
    if (inStockCheckbox) inStockCheckbox.checked = true;
    loadProducts();
  })
  .catch(() => alert("Failed to add product (unauthorized or server error)"));
}


function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  fetch(`/api/products/${id}`, {
    method: "DELETE"
  })
  .then(res => {
    if (!res.ok) throw new Error("Unauthorized");
    alert("Product deleted successfully");
    loadProducts();
  })
  .catch(() => alert("Failed to delete product"));
}

/* SLIDERS */
function loadSliders() {
  fetch("/api/sliders")
    .then(res => res.json())
    .then(slides => {
      const sliderList = document.getElementById("sliderList");
      if (!sliderList) return;

      // Safety check – ensure we got an array
      if (!Array.isArray(slides)) {
        console.error("Unexpected response for slides:", slides);
        sliderList.innerHTML = `<p class="error">Failed to load slides.</p>`;
        return;
      }

      sliderList.innerHTML = "";
      if (slides.length === 0) {
        sliderList.innerHTML = "<p>No active banner slides.</p>";
      } else {
        slides.forEach(slide => {
          sliderList.innerHTML += `
            <div class="slider-item">
              <img src="${slide.image}" class="slider-thumbnail">
              <span>Order: ${slide.order}</span>
              <button class="btn-danger-sm" onclick="deleteSlide('${slide._id}')">Delete</button>
            </div>
          `;
        });
      }
    })
    .catch(err => {
      console.error("Error loading slides:", err);
      const sliderList = document.getElementById("sliderList");
      if (sliderList) sliderList.innerHTML = `<p class="error">Error loading slides.</p>`;
    });
}

function addSlide() {
  const image = document.getElementById("sliderImage").files[0];
  const order = document.getElementById("sliderOrder").value || 0;

  if (!image) {
    alert("An image file is required for the slider banner.");
    return;
  }

  const data = new FormData();
  data.append("image", image);
  data.append("order", order);

  fetch("/api/sliders", {
    method: "POST",
    body: data
  })
    .then(res => {
      if (!res.ok) {
        // try to extract JSON error message
        return res.json().then(err => {
          throw new Error(err.error || err.message || "Failed to add slide");
        }).catch(() => {
          throw new Error("Failed to add slide");
        });
      }
      return res.json(); // server may return created slide
    })
    .then(payload => {
      alert("Slide banner added successfully");
      document.getElementById("sliderImage").value = "";
      document.getElementById("sliderOrder").value = "";
      loadSliders();
    })
    .catch(err => {
      console.error("Add slide error:", err);
      alert(err.message || "Failed to add slider image");
    });
}

function deleteSlide(id) {
  if (!confirm("Are you sure you want to delete this slide banner?")) return;

  fetch(`/api/sliders/${id}`, {
    method: "DELETE"
  })
  .then(res => {
    if (!res.ok) throw new Error("Unauthorized");
    alert("Slide deleted");
    loadSliders();
  })
  .catch(() => alert("Failed to delete slide"));
}

/* BRAND TAGLINE */
function loadTagline() {
  fetch("/api/tagline")
    .then(res => res.json())
    .then(data => {
      if (data) {
        document.getElementById("taglineEnglish").value = data.taglineEnglish || "";
        document.getElementById("taglineMalayalam").value = data.taglineMalayalam || "";
      }
    })
    .catch(err => console.error("Error loading tagline:", err));
}

function updateTagline() {
  const taglineEnglish = document.getElementById("taglineEnglish").value.trim();
  const taglineMalayalam = document.getElementById("taglineMalayalam").value.trim();

  if (!taglineEnglish || !taglineMalayalam) {
    alert("Both English and Malayalam taglines are required.");
    return;
  }

  fetch("/api/tagline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taglineEnglish, taglineMalayalam })
  })
  .then(res => {
    if (!res.ok) throw new Error("Unauthorized");
    alert("Brand taglines updated successfully");
    loadTagline();
  })
  .catch(() => alert("Failed to update brand taglines"));
}

/* CONTACT DETAILS */
function loadContact() {
  fetch("/api/contact")
    .then(res => res.json())
    .then(data => {
      if (data) {
        document.getElementById("contactPhone").value = data.phone || "";
        document.getElementById("contactWhatsApp").value = data.whatsapp || "";
        document.getElementById("contactAddress").value = data.address || "";
      }
    })
    .catch(err => console.error("Error loading contact details:", err));
}

function updateContact() {
  const phone = document.getElementById("contactPhone").value.trim();
  const whatsapp = document.getElementById("contactWhatsApp").value.trim();
  const address = document.getElementById("contactAddress").value.trim();

  if (!phone || !whatsapp || !address) {
    alert("Phone, WhatsApp, and Address are required.");
    return;
  }

  fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, whatsapp, address })
  })
  .then(res => {
    if (!res.ok) throw new Error("Unauthorized");
    alert("Contact details updated successfully");
    loadContact();
  })
  .catch(() => alert("Failed to update contact details"));
}

/* LOGOUT */
function logout() {
  fetch("/api/admin/logout", {
    method: "POST"
  })
  .then(() => {
    window.location.href = "/admin.html";
  })
  .catch(() => {
    window.location.href = "/admin.html";
  });
}