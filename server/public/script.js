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
    if (currentSort === "newest") {
      filtered.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b._id || "").localeCompare(a._id || "");
      });
    } else if (currentSort === "popular") {
      filtered.sort((a, b) => {
        const getViews = p => {
          let hash = 0;
          const str = p._id || "";
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          return Math.abs(hash % 500) + 50; // Stable views count
        };
        return getViews(b) - getViews(a);
      });
    } else if (currentSort === "name-asc") {
      filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (currentSort === "name-desc") {
      filtered.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
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
                <span style="font-weight:600; color:var(--wine-dark); font-family:'Inter', sans-serif;">${p.price} g</span>
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
function getInstagramLabel(input) {
  if (!input) return "";
  try {
    if (input.startsWith("http")) {
      const url = new URL(input);
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        const cleanPart = pathParts[0].split("?")[0];
        return "@" + cleanPart;
      }
      return "Instagram";
    }
  } catch (e) {}
  return input.startsWith("@") ? input : "@" + input;
}

function getFacebookLabel(input) {
  if (!input) return "";
  if (input.includes("HI-TECH-GOLD-AND-DIAMOND") || input.includes("100067775102269")) {
    return "Hi-Tech Gold & Diamond";
  }
  try {
    if (input.startsWith("http")) {
      const url = new URL(input);
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        if (pathParts[0] === 'p' && pathParts.length > 1) {
          return pathParts[1].replace(/-/g, ' ');
        }
        return pathParts[0].replace(/-/g, ' ');
      }
      return "Facebook";
    }
  } catch (e) {}
  return "Facebook Page";
}

fetch("/api/contact")
  .then(res => res.json())
  .then(contact => {
    if (contact) {
      // 1. Address
      const footerAddr = document.getElementById("footerAddress");
      if (footerAddr && contact.address) {
        const mapUrl = contact.mapLink || "https://maps.google.com/?q=Hi-Tech+Gold+Kuttiyadi";
        footerAddr.innerHTML = `
          <a href="${mapUrl}" target="_blank" style="color:var(--white); text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; color:var(--gold-soft);"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>${contact.address}</span>
          </a>
        `;
      }

      // 2. Phones list with Icons
      const phonesList = document.getElementById("footerPhonesList");
      if (phonesList) {
        phonesList.innerHTML = "";
        const phones = [contact.phone, contact.phone2, contact.phone3, contact.phone4].filter(Boolean);
        phones.forEach(ph => {
          phonesList.innerHTML += `
            <p class="footer-phone-item">
              <a href="tel:${ph.replace(/[^+\d]/g, '')}">
                <svg class="footer-icon icon-phone" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:middle; color:var(--gold-soft);"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>${ph}</span>
              </a>
            </p>
          `;
        });
      }

      // 3. WhatsApp list with Icons
      const waList = document.getElementById("footerWhatsAppList");
      if (waList) {
        waList.innerHTML = "";
        const was = [
          { label: "Sales Inquiry 1", value: contact.whatsapp },
          { label: "Sales Inquiry 2", value: contact.whatsapp2 }
        ].filter(item => item.value);

        was.forEach((wa, index) => {
          const cleanNum = wa.value.replace(/\D/g, '');
          const displayLabel = wa.value.startsWith("+") ? wa.value : "+" + wa.value;
          waList.innerHTML += `
            <p class="footer-wa-item">
              <a href="https://wa.me/${cleanNum}" target="_blank" class="footer-link-wa">
                <svg class="footer-icon icon-wa" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px; vertical-align:middle; color:#25D366;"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.489 0 9.953-4.467 9.957-9.96.002-2.661-1.034-5.159-2.92-7.047C16.426 1.709 13.924.67 11.265.67c-5.489 0-9.956 4.47-9.96 9.963-.001 1.543.41 3.048 1.192 4.385l-.994 3.63 3.72-.975zm10.741-6.974c-.29-.145-1.714-.847-1.98-.943-.264-.097-.457-.145-.648.145-.192.29-.745.944-.913 1.137-.168.194-.336.218-.626.073-.29-.145-1.223-.45-2.33-1.439-.861-.768-1.442-1.716-1.611-2.007-.169-.29-.018-.446.126-.59.13-.13.29-.336.436-.505.145-.168.193-.29.29-.482.096-.193.048-.362-.024-.506-.073-.145-.648-1.56-.888-2.14-.233-.56-.47-.482-.648-.492-.167-.008-.36-.01-.55-.01s-.502.072-.765.358c-.264.286-1.008.985-1.008 2.4 0 1.416 1.031 2.784 1.176 2.977.144.192 2.029 3.1 4.914 4.343.686.296 1.22.473 1.637.606.69.22 1.319.19 1.815.115.553-.083 1.714-.7 1.956-1.378.242-.676.242-1.258.17-1.379-.073-.122-.265-.193-.554-.338z"/></svg>
                <span>${displayLabel}</span>
              </a>
            </p>
          `;
        });
      }

      // 4. Socials & Email with Icons
      const socialsList = document.getElementById("footerSocialsList");
      if (socialsList) {
        socialsList.innerHTML = "";
        
        if (contact.instagram) {
          const igUrl = contact.instagram.startsWith("http") ? contact.instagram : `https://instagram.com/${contact.instagram}`;
          const igLabel = getInstagramLabel(contact.instagram);
          socialsList.innerHTML += `
            <p class="footer-social-item">
              <a href="${igUrl}" target="_blank" class="footer-link-ig" style="color:#FFFCFC;">
                <svg class="footer-icon icon-ig" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:middle; color:#E1306C;"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                <span>${igLabel}</span>
              </a>
            </p>
          `;
        }
        
        if (contact.facebook) {
          const fbUrl = contact.facebook.startsWith("http") ? contact.facebook : `https://facebook.com/${contact.facebook}`;
          const fbLabel = getFacebookLabel(contact.facebook);
          socialsList.innerHTML += `
            <p class="footer-social-item">
              <a href="${fbUrl}" target="_blank" class="footer-link-fb" style="color:#FFFCFC;">
                <svg class="footer-icon icon-fb" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:middle; color:#1877F2;"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                <span>${fbLabel}</span>
              </a>
            </p>
          `;
        }
        
        if (contact.email) {
          socialsList.innerHTML += `
            <p class="footer-social-item">
              <a href="mailto:${contact.email}" class="footer-link-email">
                <svg class="footer-icon icon-email" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; vertical-align:middle; color:var(--gold-soft);"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span>${contact.email}</span>
              </a>
            </p>
          `;
        }
        
        if (socialsList.innerHTML === "") {
          socialsList.innerHTML = "<p style='color:#bbb; font-style:italic;'>No social links set.</p>";
        }
      }
    }
  })
  .catch(err => console.error("Error loading contact info in footer:", err));

/* SPECIAL OFFERS FOR LANDING PAGE SHOWCASE */
if (document.getElementById("promoBanners")) {
  fetch("/api/offers")
    .then(res => res.json())
    .then(offers => {
      const promotionsSection = document.getElementById("promotionsSection");
      const promoBanners = document.getElementById("promoBanners");
      if (!promotionsSection || !promoBanners) return;

      if (Array.isArray(offers) && offers.length > 0) {
        promotionsSection.style.display = "block";
        promoBanners.innerHTML = "";

        // Limit home page showcase to latest 3 offers
        const latestOffers = offers.slice(0, 3);
        
        // Fetch WhatsApp contact details dynamically to populate on inquiry buttons
        fetch("/api/contact")
          .then(res => res.json())
          .catch(() => null)
          .then(contact => {
            const waNumber = contact && contact.whatsapp ? contact.whatsapp : "919447384746";
            
            latestOffers.forEach(offer => {
              const imagePath = offer.image || "/logo.png";
              const encodedMsg = encodeURIComponent(`Hi! I'm interested in the Special Offer: "${offer.title}". Please provide more details.`);
              
              promoBanners.innerHTML += `
                <div class="promo-card fade-in">
                  <div class="promo-img-box">
                    <img src="${imagePath}" alt="${offer.title}">
                  </div>
                  <div class="promo-info">
                    <h3>${offer.title}</h3>
                    <p>${offer.description || ""}</p>
                    <a href="https://wa.me/${waNumber}?text=${encodedMsg}" target="_blank" class="btn-promo-inquire">
                      Inquire on WhatsApp
                    </a>
                  </div>
                </div>
              `;
            });
          });
      } else {
        promotionsSection.style.display = "none";
      }
    })
    .catch(err => console.error("Error loading promotional offers on home page:", err));
}