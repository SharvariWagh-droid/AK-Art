// ==============================
// 🚀 INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    setupAuth();
    loadGalleryFromDB();
    loadBooks();
    loadPrints();
    setupProfilePanel();
    loadTestimonials();
    loadAboutData();

    if (window.location.pathname.includes("success.html")) {
        loadSuccessPage();
    }

    // 👤 Profile Icon Visibility Fix
    const isShopPage = window.location.pathname.includes("shop.html");
    const profileIcon = document.getElementById("profileIcon");
    if (profileIcon) {
        profileIcon.style.display = isShopPage ? "flex" : "none";
    }

    // 👤 Initialize Avatar on Load
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.name) {
        const avatar = document.getElementById("profileAvatar");
        if (avatar) {
            avatar.innerText = user.name.charAt(0).toUpperCase();
        }
    }

    loadHeroFromBackend();
});
function setupProfilePanel() {
    const profileIcon = document.getElementById("profileIcon");
    const profilePanel = document.getElementById("profilePanel");

    if (!profileIcon || !profilePanel) return;

    profileIcon.addEventListener("click", async (e) => {
        e.stopPropagation();

        const user = JSON.parse(localStorage.getItem("user"));

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        // Toggle panel
        profilePanel.classList.toggle("active");

        if (profilePanel.classList.contains("active")) {
            // 👤 Dynamic User Data
            const greeting = document.getElementById("profileGreeting");
            const total = document.getElementById("totalPrints");
            const list = document.getElementById("profilePrints");
            const avatar = document.getElementById("profileAvatar");

            if (greeting) greeting.innerText = `Hey ${user.name} 👋`;
            if (avatar) avatar.innerText = user.name.charAt(0).toUpperCase();

            try {
                // 🔥 FETCH ALL ORDERS & FILTER (Support Legacy Data)
                const response = await fetch(`http://localhost:5000/api/orders`);
                const allOrders = await response.json();

                const userOrders = allOrders.filter(o =>
                    String(o.userId) === String(user._id) ||
                    o.userName === user.name
                );

                if (total) total.innerText = `Your Prints: ${userOrders.length}`;
                if (list) {
                    list.innerHTML = "";

                    if (userOrders.length === 0) {
                        list.innerHTML = "<p style='text-align:center;'>No prints yet 🥺</p>";
                    } else {
                        userOrders.forEach(order => {
                            const li = document.createElement("li");
                            const statusClass = order.status ? order.status.toLowerCase() : "paid";

                            li.innerHTML = `
                                <strong>${order.artName}</strong><br>
                                <small>${new Date(order.date).toLocaleDateString()}</small><br>
                                <span class="status ${statusClass}">
                                    ${order.status || "Paid"}
                                </span>
                            `;
                            list.appendChild(li);
                        });
                    }
                }
            } catch (err) {
                console.log("PROFILE FETCH ERROR:", err);
                if (list) list.innerHTML = "<p>Error loading prints</p>";
            }
        }
    });

    document.addEventListener("click", (e) => {
        if (
            profilePanel.classList.contains("active") &&
            !profilePanel.contains(e.target) &&
            !profileIcon.contains(e.target)
        ) {
            profilePanel.classList.remove("active");
        }
    });
}


// ==============================
// 🔥 BASE API
// ==============================
const API = "http://localhost:5000/api/artworks";

// ==============================
// 🎨 IMAGE HELPER (NORMALIZATION)
// ==============================
function getImageSrc(img) {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    if (img.includes("Personal work")) return "../" + img;
    return "http://localhost:5000/uploads/" + img;
}

// ==============================
// 🎨 ART
// ==============================
async function loadGalleryFromDB() {
    try {
        const res = await fetch(API + "?type=art");
        const arts = await res.json();

        const html = arts.map(a => {
            console.log("IMAGE URL:", a.image);
            return `
                <div class="art-item">
                    <img src="${getImageSrc(a.image)}" onclick="openModal(this)">
                    <h3>${a.title}</h3>
                </div>
            `;
        }).join("");

        document.querySelectorAll("#home-art-grid, #explore-art-grid")
            .forEach(c => c.innerHTML = html);

    } catch (err) {
        console.log("ART ERROR:", err);
    }
}

// ==============================
// 📚 BOOKS
// ==============================
async function loadBooks() {
    try {
        const res = await fetch(API + "?type=book");
        const books = await res.json();

        const html = books.map(b => {
            console.log("IMAGE URL:", b.image);
            return `
                <div class="art-item">
                    <img src="${getImageSrc(b.image)}" onclick="openModal(this)">
                    <h3>${b.title}</h3>
                    <p>${b.description || ""}</p>
                </div>
            `;
        }).join("");

        document.querySelectorAll("#home-book-grid, #explore-book-grid")
            .forEach(c => c.innerHTML = html);

    } catch (err) {
        console.log("BOOK ERROR:", err);
    }
}

// ==============================
// 🖼 PRINTS
// ==============================
let allPrints = [];
let currentPage = 1;
const itemsPerPage = 6;

async function loadPrints() {
    try {
        const res = await fetch(API + "?type=print");
        allPrints = await res.json();

        displayPrints();
        setupPagination();

    } catch (err) {
        console.log("PRINT ERROR:", err);
    }
}

function displayPrints() {
    const containers = document.querySelectorAll(".prints-grid, #explore-print-grid");
    if (!containers.length) return;

    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = allPrints.slice(start, start + itemsPerPage);

    const html = pageItems.map(p => {
        console.log("IMAGE URL:", p.image);
        const price = p.description ? parseInt(p.description.replace('₹', '')) || 0 : 0;
        const imgSrc = getImageSrc(p.image);

        return `
        <div class="shop-card">
            <img src="${imgSrc}">
            <h3>${p.title}</h3>
            <p>₹${price}</p>
            <button onclick="buyPrint('${p.title}', ${price}, '${imgSrc}')">
                Buy Print
            </button>
        </div>`;
    }).join("");

    containers.forEach(c => c.innerHTML = html);
}

// ==============================
// 🔢 PAGINATION
// ==============================
function setupPagination() {
    const pagination = document.querySelector(".pagination");
    if (!pagination) return;

    const total = Math.ceil(allPrints.length / itemsPerPage);
    pagination.innerHTML = "";

    for (let i = 1; i <= total; i++) {
        pagination.innerHTML += `<button onclick="changePage(${i})">${i}</button>`;
    }
}

function changePage(page) {
    currentPage = page;
    displayPrints();
}

// ==============================
// 💳 PAYMENT
// ==============================
function buyPrint(name, price, image) {

    if (localStorage.getItem("loggedIn") !== "true") {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    localStorage.setItem("artName", name);
    localStorage.setItem("artPrice", price);
    localStorage.setItem("artImage", image);

    fetch("http://localhost:5000/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: price })
    })
        .then(res => res.json())
        .then(order => {

            const options = {
                key: "rzp_test_SWwx1VajdB2nHb",
                amount: order.amount,
                currency: "INR",
                name: "AK Art",
                description: name,
                order_id: order.id,

                handler: async function (response) {

                    // ✅ SAVE TO LOCAL STORAGE
                    const existingOrders = JSON.parse(localStorage.getItem("orders")) || [];

                    existingOrders.push({
                        userId: user._id,
                        artName: name,
                        price: price,
                        paymentId: response.razorpay_payment_id
                    });

                    localStorage.setItem("orders", JSON.stringify(existingOrders));

                    await fetch("http://localhost:5000/api/orders/create", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: user._id,
                            userName: user.name,
                            email: user.email,
                            artName: name,
                            price: price,
                            image: image,
                            paymentId: response.razorpay_payment_id,
                            status: "Paid"
                        })
                    });

                    window.location.href = "success.html";
                }
            };

            new Razorpay(options).open();
        });
}

// ==============================
// 💬 TESTIMONIALS (FRONTEND)
// ==============================
async function loadTestimonials() {
    try {
        const res = await fetch("http://localhost:5000/api/testimonials");
        const data = await res.json();

        const container = document.getElementById("testimonial-grid");
        if (!container) return;

        container.innerHTML = data.map(t => `
            <div class="testimonial-card">
                <p>"${t.message}"</p>
                <h4>${t.name}</h4>
            </div>
        `).join("");

    } catch (err) {
        console.log("TESTIMONIAL ERROR:", err);
    }
}
// ==============================
// 💬 ABOUT PAGE DYNAMIC (NEW)
// ==============================
async function loadAboutData() {
    if (!window.location.pathname.includes("about.html")) return;

    try {
        const aboutRes = await fetch("http://localhost:5000/api/about");
        const about = await aboutRes.json();

        // ✅ NEW CORRECT IDs
        const nameEl = document.getElementById("aboutName");
        const imgEl = document.getElementById("aboutImage");
        const bioEl = document.getElementById("aboutBio");
        const worksList = document.getElementById("publishedWorksList");

        nameEl.innerHTML = `<strong>${about.name}</strong>`;

        if (imgEl) {
            if (about.image) {
                imgEl.src = about.image; // ✅ BASE64 DIRECT
            } else {
                imgEl.style.display = "none";
            }
        }

        if (bioEl && about.bio) {
            bioEl.innerHTML = about.bio
                .split("\n")
                .map(p => p.trim() ? `<p>${p}</p>` : "")
                .join("");
        }

        if (worksList && about.publishedWorks) {
            worksList.innerHTML = about.publishedWorks.map(w => {
                const parts = w.split("(");
                const title = parts[0];
                const rest = parts[1] ? "(" + parts[1] : "";

                return `
                    <li>
                        <a href="#" class="work-link">${title.trim()}</a><br>
                        <span class="work-meta">${rest}</span>
                    </li>
                `;
            }).join("");
        }

        // ✅ AGENCIES FIX
        const agencyRes = await fetch("http://localhost:5000/api/agencies");
        const agencies = await agencyRes.json();

        const agencyList = document.getElementById("agenciesList");

        if (agencyList) {
            agencyList.innerHTML = agencies.length
                ? agencies.map(a => `<li>${a.name}</li>`).join("")
                : "<li>Independent Artist</li>";
        }

    } catch (err) {
        console.log("ABOUT PAGE ERROR:", err);
    }
}

// ==============================
// 🔐 AUTH
// ==============================
function setupAuth() {

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async e => {
            e.preventDefault();

            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            const res = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.message === "Login successful") {
                localStorage.setItem("loggedIn", "true");
                localStorage.setItem("user", JSON.stringify(data.user));
                window.location.href = "shop.html";
            } else {
                alert(data.message);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async e => {
            e.preventDefault();

            const name = document.getElementById("registerName").value;
            const email = document.getElementById("registerEmail").value;
            const password = document.getElementById("password").value;
            const confirm = document.getElementById("confirmPassword").value;

            if (password !== confirm) {
                alert("Passwords do not match!");
                return;
            }

            const res = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();
            alert(data.message);

            if (data.message.toLowerCase().includes("register")) {
                window.location.href = "login.html";
            }
        });
    }
}
// ==============================
// 🎉 SUCCESS PAGE
// ==============================
function loadSuccessPage() {
    const img = document.querySelector("#artPreview");
    const name = document.querySelector("#artName");
    const price = document.querySelector("#artPrice");

    const artName = localStorage.getItem("artName");
    const artPrice = localStorage.getItem("artPrice");
    const artImage = localStorage.getItem("artImage");

    if (img) img.src = artImage;
    if (name) name.innerText = artName;
    if (price) price.innerText = "₹" + artPrice;
}
function downloadArt() {
    const image = localStorage.getItem("artImage");

    if (!image) {
        alert("No artwork found!");
        return;
    }

    const filename = image.split("/").pop();

    const size =
        document.querySelector(".size-btn.active")?.dataset.size || "6x7";

    const format =
        document.querySelector(".format-btn.active")?.dataset.format || "jpg";

    const title = localStorage.getItem("artName") || "artwork";

    window.location.href =
        `http://localhost:5000/api/orders/download/${filename}/${size}/${format}?title=${encodeURIComponent(title)}`;
}

function closeModal() {
    const modal = document.getElementById("imageModal");
    if (modal) modal.style.display = "none";
}
// size selection
document.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

// format selection
document.querySelectorAll(".format-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".format-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

// ==============================
// 🖼 MODAL FIX (IMPORTANT)
// ==============================
function openModal(img) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");

    if (modal) modal.style.display = "flex";
    if (modalImg) modalImg.src = img.src;
}
// close modal
document.querySelector(".close")?.addEventListener("click", closeModal);

// close on outside click
document.getElementById("imageModal")?.addEventListener("click", (e) => {
    if (e.target.id === "imageModal") {
        e.target.style.display = "none";
    }
});

function logoutUser() {
    // clear user session
    localStorage.removeItem("user");
    localStorage.removeItem("loggedIn");

    // optional cleanup
    localStorage.removeItem("artName");
    localStorage.removeItem("artPrice");
    localStorage.removeItem("artImage");

    // redirect
    window.location.href = "index.html";
}
// ==============================
// 🌍 GLOBAL
// ==============================
window.changePage = changePage;
window.buyPrint = buyPrint;
window.logoutUser = logoutUser;
window.openModal = openModal;
window.closeModal = closeModal;
window.downloadArt = downloadArt;
// ==============================
// 🎨 HOMEPAGE CMS (FINAL FIXED)
// ==============================

let heroSliderIntervalId = null;

async function loadHeroFromBackend() {
    const slider = document.getElementById("heroSlider");
    const titleEl = document.getElementById("heroTitle");
    const subEl = document.getElementById("heroSubtitle");

    if (!slider) return;

    try {
        const res = await fetch("http://localhost:5000/api/homepage");
        const data = await res.json();

        console.log("HERO DATA:", data);

        // ✅ TEXT
        if (titleEl) titleEl.innerText = data.heroTitle || "";
        if (subEl) subEl.innerText = data.heroSubtitle || "";

        // ✅ RESET SLIDER
        slider.innerHTML = "";

        const BASE_URL = "http://localhost:5000/uploads/";
        const images = data.heroImages || [];

        console.log("IMAGES:", images);

        if (images.length === 0) return;

        // ✅ CREATE SLIDES
        images.forEach((img, index) => {
            const fullPath = BASE_URL + img;

            console.log("IMAGE PATH:", fullPath);

            slider.innerHTML += `
                <div class="slide ${index === 0 ? "active" : ""}">
                    <img src="${fullPath}" />
                </div>
            `;
        });

        initHeroSlider();

    } catch (err) {
        console.error("HERO ERROR:", err);
    }
}

// ==============================
// 🎞 SLIDER
// ==============================
function initHeroSlider() {
    const slides = document.querySelectorAll("#heroSlider .slide");

    if (slides.length === 0) return;

    if (heroSliderIntervalId) {
        clearInterval(heroSliderIntervalId);
    }

    let index = 0;

    heroSliderIntervalId = setInterval(() => {
        slides[index].classList.remove("active");
        index = (index + 1) % slides.length;
        slides[index].classList.add("active");
    }, 3500);
}