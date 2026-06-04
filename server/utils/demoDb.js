const bcrypt = require("bcrypt");

const demoDb = {
  admins: [],
  goldRate: { ratePerGram: 6250, rate8g: 50000 },
  tagline: {
    taglineEnglish: "Crafted in Gold. Defined by Elegance.",
    taglineMalayalam: "വിശ്വാസത്തിന്റെ സ്വർണ്ണം",
    active: true
  },
  contact: {
    phone: "+91 9539376916",
    phone2: "+91 9747048939",
    phone3: "+91 496-2597709",
    phone4: "+91 496-2934525",
    whatsapp: "919539376916",
    whatsapp2: "919747048939",
    instagram: "https://www.instagram.com/hitechgoldanddiamonds/?hl=en",
    facebook: "https://www.facebook.com/p/HI-TECH-GOLD-AND-DIAMOND-100067775102269/",
    email: "hitechgoldanddiamonds@gmail.com",
    address: "Kuttiadi, Kerala, India",
    mapLink: "https://maps.google.com/?q=Hi-Tech+Gold+Kuttiyadi",
    active: true
  },
  categories: [
    { _id: "cat_1", name: "Necklaces" },
    { _id: "cat_2", name: "Bangles" },
    { _id: "cat_3", name: "Rings" }
  ],
  products: [
    {
      _id: "prod_1",
      name: "Bridal Antique Gold Choker",
      modelNo: "HT-2045",
      category: { _id: "cat_1", name: "Necklaces" },
      price: 145000,
      inStock: true,
      description: "A traditional premium antique gold choker embellished with precious gemstones. Handcrafted for the elegant bride.",
      image: "/logo.png"
    },
    {
      _id: "prod_2",
      name: "Classic Sleek Gold Bangle",
      modelNo: "HT-5582",
      category: { _id: "cat_2", name: "Bangles" },
      price: 36000,
      inStock: true,
      description: "Minimalistic solid gold bangle suitable for daily wear and modern styling.",
      image: "/logo.png"
    }
  ],
  sliders: [
    {
      _id: "slide_1",
      image: "/logo.png",
      order: 1,
      active: true
    }
  ],
  offers: [
    {
      _id: "offer_1",
      title: "Gold Sovereign Celebrations",
      description: "Get a free 916 BIS Hallmark 1-gram gold coin on purchasing bridal jewelry sets above ₹2,00,000. Limited time festive offer!",
      image: "/logo.png",
      active: true
    }
  ]
};

// Initialize default admin with secure hashed password
const init = async () => {
  try {
    const hash = await bcrypt.hash("admin123", 10);
    demoDb.admins.push({
      _id: "admin_1",
      username: "admin",
      password: hash
    });
  } catch (err) {
    console.error("Failed to seed demo admin:", err);
  }
};

init();

module.exports = demoDb;
