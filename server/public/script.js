/* GOLD RATE */
fetch("/api/goldrate")
  .then(res => res.json())
  .then(data => {
    if (document.getElementById("goldRate")) {
      document.getElementById("goldRate").innerText =
        `₹ ${data.ratePerGram} / g · ₹ ${data.rate8g} / 8g`;
    }
  })
  .catch(err => console.error("Error fetching gold rate:", err));

/* PRODUCTS IN GRID WITH ADVANCED FILTERING & SORTING */
if (document.getElementById("collectionGrid")) {
  let allProducts = [];
  let allCategories = [];
  let activeCategory = "all";
  let searchQuery = "";
  let currentSort = "default";
  
  const grid = document.getElementById("collectionGrid");
  const pillsContainer = document.getElementById("categoryPills");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  Promise.all([
    fetch("/api/products").then(res => res.json()),
    fetch("/api/categories").then(res => res.json())
  ])
  .then(([products, categories]) => {
    allProducts = products;
    allCategories = categories;

    // Dynamically render category pills
    if (pillsContainer) {
      pillsContainer.innerHTML = `<button class="category-pill active" data-category="all">All Collections</button>`;
      allCategories.forEach(cat => {
        pillsContainer.innerHTML += `<button class="category-pill" data-category="${cat._id}">${cat.name}</button>`;
      });

      // Add click listeners to pills
      const pills = pillsContainer.querySelectorAll(".category-pill");
      pills.forEach(pill => {
        pill.addEventListener("click", () => {
          pills.forEach(p => p.classList.remove("active"));
          pill.classList.add("active");
          activeCategory = pill.getAttribute("data-category");
          filterAndRenderProducts();
        });
      });
    }

    // Set up search listener (real-time keypress/input)
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        filterAndRenderProducts();
      });
    }

    // Set up sort listener
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        currentSort = e.target.value;
        filterAndRenderProducts();
      });
    }

    // Initial render
    filterAndRenderProducts();
  })
  .catch(err => console.error("Error loading collections:", err));

  function filterAndRenderProducts() {
    grid.innerHTML = "";

    // 1. Filter products
    let filtered = allProducts.filter(p => {
      // Category match
      const matchesCategory = (activeCategory === "all") || 
        (p.category && (p.category._id === activeCategory || p.category === activeCategory));

      // Search match
      const nameMatch = p.name ? p.name.toLowerCase().includes(searchQuery) : false;
      const modelMatch = p.modelNo ? p.modelNo.toLowerCase().includes(searchQuery) : false;
      const descMatch = p.description ? p.description.toLowerCase().includes(searchQuery) : false;
      const matchesSearch = searchQuery === "" || nameMatch || modelMatch || descMatch;

      return matchesCategory && matchesSearch;
    });

    // 2. Sort products
    if (currentSort === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (currentSort === "name-asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (currentSort === "name-desc") {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    }

    // 3. Render grid contents
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="no-results fade-in">
          <h3>No products match your filters</h3>
          <p>Try refining your search query or choosing another category from the collections list.</p>
          <button class="btn-reset-filters" id="resetFiltersBtn">Reset All Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById("resetFiltersBtn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          resetFilters();
        });
      }
      return;
    }

    filtered.forEach(p => {
      const imagePath = p.image || "/logo.png";
      const categoryName = p.category ? (p.category.name || 'Jewelry') : 'Jewelry';
      
      // Stock Status Overlay Badge
      const isOutOfStock = p.inStock === false;
      const stockBadge = isOutOfStock 
        ? `<span class="card-status-badge out-of-stock">Out of Stock</span>` 
        : "";

      grid.innerHTML += `
        <a href="product.html?id=${p._id}" class="card-link fade-in">
          <div class="card">
            ${stockBadge}
            <img src="${imagePath}" alt="${p.name}">
            <div class="info">
              <h3>${p.name}</h3>
              <div style="display:flex; justify-content:space-between; margin-top:8px; align-items: center;">
                <span style="font-size:12px; text-transform:uppercase; color:#999; font-family:'Inter', sans-serif;">${categoryName}</span>
                <span style="font-weight:600; color:var(--wine-dark); font-family:'Inter', sans-serif;">₹ ${p.price.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </a>
      `;
    });
  }

  function resetFilters() {
    activeCategory = "all";
    searchQuery = "";
    currentSort = "default";
    
    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "default";
    
    if (pillsContainer) {
      const pills = pillsContainer.querySelectorAll(".category-pill");
      pills.forEach(pill => {
        if (pill.getAttribute("data-category") === "all") {
          pill.classList.add("active");
        } else {
          pill.classList.remove("active");
        }
      });
    }

    filterAndRenderProducts();
  }
}



/* HERO SLIDERS & BRAND TAGLINE */
Promise.all([
  fetch("/api/sliders").then(res => res.json()),
  fetch("/api/tagline").then(res => res.json())
])
.then(([slides, tagline]) => {
  // Update Tagline
  if (tagline) {
    const taglineEngEl = document.getElementById("taglineEng");
    const taglineMalEl = document.getElementById("taglineMal");
    if (taglineEngEl && tagline.taglineEnglish) {
      taglineEngEl.innerText = tagline.taglineEnglish;
    }
    if (taglineMalEl && tagline.taglineMalayalam) {
      taglineMalEl.innerText = tagline.taglineMalayalam;
    }
  }

  // Handle Slides
  const slidesContainer = document.getElementById("heroSlides");
  const indicatorsContainer = document.getElementById("slideIndicators");
  if (!slidesContainer || !indicatorsContainer) return;

  slidesContainer.innerHTML = "";
  indicatorsContainer.innerHTML = "";

  // If no slides, fallback to a single default slide using logo or solid color
  const activeSlides = Array.isArray(slides) && slides.length > 0 
    ? slides.filter(s => s.active) 
    : [{ _id: 'default', image: '/logo.png', order: 0 }];

  if (activeSlides.length === 0) {
    activeSlides.push({ _id: 'default', image: '/logo.png', order: 0 });
  }

  // Sort slides by order
  activeSlides.sort((a, b) => a.order - b.order);

  activeSlides.forEach((slide, index) => {
    // Create slide element
    const slideEl = document.createElement("div");
    slideEl.className = `hero-slide${index === 0 ? " active" : ""}`;
    slideEl.style.backgroundImage = `url('${slide.image}')`;
    slidesContainer.appendChild(slideEl);

    // Create indicator element
    const indicatorEl = document.createElement("div");
    indicatorEl.className = `indicator${index === 0 ? " active" : ""}`;
    indicatorEl.addEventListener("click", () => {
      goToSlide(index);
    });
    indicatorsContainer.appendChild(indicatorEl);
  });

  let currentSlideIndex = 0;
  let slideInterval;
  const progressBar = document.getElementById("sliderProgressBar");

  function showSlide(index) {
    const heroSlides = document.querySelectorAll(".hero-slide");
    const indicators = document.querySelectorAll(".indicator");
    if (heroSlides.length === 0) return;

    // Reset progress bar animation
    if (progressBar) {
      progressBar.classList.remove("active");
      void progressBar.offsetWidth; // trigger reflow
      progressBar.classList.add("active");
    }

    heroSlides[currentSlideIndex].classList.remove("active");
    indicators[currentSlideIndex].classList.remove("active");

    currentSlideIndex = (index + heroSlides.length) % heroSlides.length;

    heroSlides[currentSlideIndex].classList.add("active");
    indicators[currentSlideIndex].classList.add("active");
  }

  function goToSlide(index) {
    showSlide(index);
    resetInterval();
  }

  function nextSlide() {
    showSlide(currentSlideIndex + 1);
  }

  function prevSlide() {
    showSlide(currentSlideIndex - 1);
  }

  function resetInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5000); // cycle every 5s
  }

  // Set up navigation button listeners
  const prevBtn = document.getElementById("prevSlideBtn");
  const nextBtn = document.getElementById("nextSlideBtn");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prevSlide();
      resetInterval();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      nextSlide();
      resetInterval();
    });
  }

  // Initialize progress bar active class on load
  if (progressBar) {
    progressBar.classList.add("active");
  }

  if (activeSlides.length > 1) {
    resetInterval();
  } else {
    // Hide arrows and progress bar if only 1 slide exists
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
    if (progressBar) progressBar.style.display = "none";
  }
})
.catch(err => console.error("Error loading homepage sliders/tagline:", err));

/* FOOTER CONTACT DETAILS */
fetch("/api/contact")
  .then(res => res.json())
  .then(contact => {
    if (contact) {
      const footerAddr = document.getElementById("footerAddress");
      const footerPh = document.getElementById("footerPhone");
      if (footerAddr && contact.address) {
        footerAddr.innerText = contact.address;
      }
      if (footerPh && contact.phone) {
        footerPh.innerText = contact.phone;
      }
    }
  })
  .catch(err => console.error("Error loading contact info in footer:", err));