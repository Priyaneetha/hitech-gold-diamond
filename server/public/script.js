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

/* PRODUCTS IN GRID */
if (document.getElementById("collectionGrid")) {
  fetch("/api/products")
    .then(res => res.json())
    .then(products => {
      const grid = document.getElementById("collectionGrid");
      grid.innerHTML = "";
      
      if (products.length === 0) {
        grid.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #666;'>No items found in our collections.</p>";
        return;
      }

      products.forEach(p => {
        const imagePath = p.image || "/logo.png";
        grid.innerHTML += `
          <a href="product.html?id=${p._id}" class="card-link fade-in">
            <div class="card">
              <img src="${imagePath}" alt="${p.name}">
              <div class="info">
                <h3>${p.name}</h3>
                <div style="display:flex; justify-content:space-between; margin-top:8px;">
                  <span style="font-size:12px; text-transform:uppercase; color:#999; font-family:'Inter', sans-serif;">${p.category ? p.category.name : 'Jewelry'}</span>
                  <span style="font-weight:600; color:var(--wine-dark); font-family:'Inter', sans-serif;">₹ ${p.price}</span>
                </div>
              </div>
            </div>
          </a>
        `;
      });
    })
    .catch(err => console.error("Error fetching products:", err));
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