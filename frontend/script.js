// ==============================
// 🚀 INIT
// ==============================
const HOMEPAGE_API = "http://13.233.50.44:5000/api/homepage";
let currentIndex = 0;
let currentList = [];
let currentModalType = 'print';
var allArts = [];
var allBooks = [];
var allPrints = [];
let currentPage = 1;
const itemsPerPage = 6;
let heroSliderIntervalId = null;

const palettes = {
    pastel: { title: "#2d2d2d", subtitle: "#777777", text: "#444" },
    earth: { title: "#3e2f1c", subtitle: "#7a5c3e", text: "#3e2f1c" },
    dark: { title: "#ffffff", subtitle: "#cccccc", text: "#ffffff" },
    playful: { title: "#ff4d6d", subtitle: "#6a4c93", text: "#6a4c93" }
};

// Clear any bad localStorage values on page load
function cleanupLocalStorage() {
    const artImage = localStorage.getItem("artImage");
    if (artImage && (artImage.includes("localhost:7070") || artImage.includes("localhost:37857") || (!artImage.includes("localhost:5000/uploads") && !artImage.includes("via.placeholder.com")))) {
        console.log("Cleaning up bad localStorage image values");
    }
}

// Load success page functionality
function loadSuccessPage() {
    // Display order details from localStorage or URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('payment_id');
    if (paymentId) {
        // Display payment success message
        const successMessage = document.querySelector('.success-message');
        if (successMessage) {
            successMessage.innerHTML = `Payment successful! Payment ID: ${paymentId}`;
        }
    }

    // Clear purchase-related localStorage after successful payment
    localStorage.removeItem("artName");
    localStorage.removeItem("artPrice");
    localStorage.removeItem("artImage");
}

document.addEventListener("DOMContentLoaded", () => {
    cleanupLocalStorage();
    renderHeader();
    setupAuth();

    if (document.getElementById("gallery-grid") || document.getElementById("home-art-grid") || document.getElementById("explore-art-grid")) {
        loadGalleryFromDB();
    }

    if (document.getElementById("published-grid") || document.getElementById("home-book-grid") || document.getElementById("explore-book-grid")) {
        loadBooks();
    }

    if (document.querySelector(".prints-grid") || document.getElementById("explore-print-grid")) {
        loadPrints();
    }
    setupProfilePanel();
    loadTestimonials();
    loadAboutData();



    const isShopPage = window.location.pathname.includes("shop.html");
    const profileIcon = document.getElementById("profileIcon");
    if (profileIcon) {
        profileIcon.style.display = isShopPage ? "flex" : "none";
    }

    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.name) {
        const avatar = document.getElementById("profileAvatar");
        if (avatar) {
            avatar.innerText = user.name.charAt(0).toUpperCase();
        }
    }

    loadHomepageData();

    // Page-specific handlers
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    if (forgotPasswordForm) {
        setupForgotPassword(forgotPasswordForm);
    }

    const resetPasswordForm = document.getElementById("resetPasswordForm");
    if (resetPasswordForm) {
        setupResetPassword(resetPasswordForm);
    }

    if (window.location.pathname.includes("success.html")) {
        loadSuccessPage();
        verifyPayment();
    }

    // Global listeners
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("logout-btn")) {
            logoutUser();
        }
        if (e.target.classList.contains("modal-close-btn")) {
            closeModal();
        }
        if (e.target.classList.contains("pay-btn")) {
            payNow();
        }
        if (e.target.classList.contains("close-error-btn")) {
            closeErrorModal();
        }
        if (e.target.classList.contains("download-btn")) {
            downloadArt();
        }
        if (e.target.classList.contains("password-toggle-icon")) {
            const input = e.target.parentElement.querySelector("input");
            if (input) {
                togglePasswordVisibility(input.id, e.target);
            }
        }
    });
});

async function loadHomepageData() {
    try {
        const res = await fetch(HOMEPAGE_API);
        const data = await res.json();
        console.log("Homepage Data:", data);

        renderFooter(data);

        if (document.getElementById("heroSlider")) {
            loadHeroContent(data);
        }

        const dpTitle = document.getElementById("dpTitle");
        const dpDesc = document.getElementById("dpDesc");
        if (dpTitle && dpDesc) {
            dpTitle.textContent = data.digitalPrintTitle || "Digital Prints";
            dpDesc.textContent = data.digitalPrintDescription || "A curated collection of premium illustrations for your modern space.";

            dpTitle.style.fontSize = data.digitalPrintTitleSize || "32px";
            dpDesc.style.fontSize = data.digitalPrintDescSize || "16px";

            if (data.digitalPrintPalette && data.digitalPrintPalette !== "custom") {
                const p = palettes[data.digitalPrintPalette];
                if (dpTitle && p) dpTitle.style.color = p.title;
                if (dpDesc && p) dpDesc.style.color = p.subtitle;
            } else {
                if (dpTitle) dpTitle.style.color = data.digitalPrintTitleColor || "#000000";
                if (dpDesc) dpDesc.style.color = data.digitalPrintDescColor || "#555555";
            }
        }

        // --- PORTFOLIO (EXPLORE PAGE) ---
        const pTitle = document.getElementById("portfolioTitle");
        const pSub = document.getElementById("portfolioSubtitle");

        if (pTitle) {
            pTitle.innerText = data.portfolioTitle || "Explore Art & Works";
            pTitle.style.fontSize = data.portfolioTitleSize || "48px";
            
            if (data.portfolioPalette && data.portfolioPalette !== "custom") {
                pTitle.style.color = palettes[data.portfolioPalette]?.title || "#000";
            } else {
                pTitle.style.color = data.portfolioTitleColor || "#000";
            }
        }

        if (pSub) {
            pSub.innerText = data.portfolioSubtitle || "A curated portfolio of my creative journey.";
            pSub.style.fontSize = data.portfolioSubtitleSize || "16px";

            if (data.portfolioPalette && data.portfolioPalette !== "custom") {
                pSub.style.color = palettes[data.portfolioPalette]?.subtitle || "#555";
            } else {
                pSub.style.color = data.portfolioSubtitleColor || "#555";
            }
        }
    } catch (err) {
        console.error("Homepage load error:", err);
        renderFooter({});
    }
}

function renderHeader() {
    const headerPlaceholder = document.getElementById("header");
    if (!headerPlaceholder) return;

    headerPlaceholder.innerHTML = `
        <header class="header">
            <div class="logo-container">
                <a href="index.html">
                    <img src="Personal work/logo.gif" alt="Abhilasha Khatri Logo" class="logo">
                </a>
            </div>
            <nav class="navbar">
                <ul>
                    <li><a href="index.html">Home</a></li>
                    <li><a href="explore.html">Explore Art</a></li>
                    <li><a href="shop.html">Buy Prints</a></li>
                    <li><a href="about.html">About</a></li>
                    <li><a href="login.html">Login</a></li>
                </ul>
                <div class="user-profile">
                    <i class="fas fa-user-circle" id="profileIcon"></i>
                </div>
            </nav>
        </header>
    `;
}

function renderFooter(data) {
    if (!data) data = {};
    console.log("Rendering Footer with data:", data);
    const footer = document.getElementById("footer");
    if (!footer) return;

    footer.innerHTML = `
        <div class="global-footer" id="globalFooterContainer">
            <h2 id="footerTitle">${data.footerTitle != null ? data.footerTitle : "Abhilasha Khatri"}</h2>
            <p id="footerDesc">${data.footerDescription != null ? data.footerDescription : "Creating magical worlds and unforgettable characters for the next generation of dreamers. Let’s work together on your next project."}</p>
            
            <div class="social-icons">
                <a href="https://www.behance.net/abhilashakhatri0603" target="_blank"><i class="fab fa-behance"></i></a>
                <a href="https://www.instagram.com/abhilashakhatri0603/" target="_blank"><i class="fab fa-instagram"></i></a>
                <a href="https://www.linkedin.com/in/abhilasha-khatri-73201b7" target="_blank"><i class="fab fa-linkedin-in"></i></a>
            </div>

            <p class="copyright">
                © 2026 Abhilasha Khatri. All Rights Reserved.
            </p>
        </div>
    `;

    const container = document.getElementById("globalFooterContainer");
    if (container) {
        const footerTitle = document.getElementById("footerTitle");
        const footerDesc = document.getElementById("footerDesc");

        if (data.footerPalette && data.footerPalette !== "custom") {
            const p = palettes[data.footerPalette];
            if (p) {
                if (footerTitle) footerTitle.style.color = p.title;
                if (footerDesc) footerDesc.style.color = p.subtitle;
                container.style.color = p.text;
            }
        } else {
            if (footerTitle) footerTitle.style.color = data.footerTitleColor || "#333333";
            if (footerDesc) footerDesc.style.color = data.footerDescColor || "#555555";
            if (data.footerTextColor) container.style.color = data.footerTextColor;
        }

        if (data.footerFontSize) container.style.fontSize = data.footerFontSize;

        const textElements = container.querySelectorAll("h2, p, a");
        textElements.forEach(el => {
            if (!el.classList.contains("fab")) {
                el.style.fontFamily = "inherit";
            }
        });
    }
}

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

        profilePanel.classList.toggle("active");

        if (profilePanel.classList.contains("active")) {
            const greeting = document.getElementById("profileGreeting");
            const total = document.getElementById("totalPrints");
            const list = document.getElementById("profilePrints");
            const avatar = document.getElementById("profileAvatar");

            if (greeting) greeting.innerText = `Hey ${user.name} 👋`;
            if (avatar) avatar.innerText = user.name.charAt(0).toUpperCase();

            try {
                const response = await fetch(`http://13.233.50.44:5000/api/orders`);
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

const API = "http://13.233.50.44:5000/api/artworks";
const BACKEND_ORIGIN = "http://13.233.50.44:5000";

function getImageSrc(img) {
    if (!img || typeof img !== 'string') return "";
    if (img.startsWith('data:image')) return img;
    if (img.startsWith('https://via.placeholder.com')) return img;


    const filename = img.split('/').pop();
    return BACKEND_ORIGIN + "/uploads/" + filename;
}

function getRazorpayImageSrc(img) {
    return "https://via.placeholder.com/150";
}

async function loadGalleryFromDB() {
    try {
        const res = await fetch(API + "?type=art");
        allArts = await res.json();

        const targets = ["home-art-grid", "explore-art-grid", "gallery-grid"];

        targets.forEach(id => {
            const container = document.getElementById(id);
            if (!container) return;

            if (!allArts.length) {
                container.innerHTML = "<p class='no-data'>No items available</p>";
                return;
            }

            const isPreview = id.includes("explore") || id.includes("home");
            const limit = isPreview ? 3 : allArts.length;

            container.innerHTML = allArts.slice(0, limit).map((a, i) => {
                const imgSrc = getImageSrc(a.image);
                const list = allArts.slice(0, limit);
                return `
                    <div class="art-item">
                        <img src="${imgSrc}" onclick='openModal(${JSON.stringify(a)}, ${i}, ${JSON.stringify(list)})'>
                        <h3>${a.title}</h3>
                    </div>
                `;
            }).join("");
        });

    } catch (err) {
        console.log("ART ERROR:", err);
    }
}

async function loadBooks() {
    try {
        const res = await fetch(API + "?type=book");
        allBooks = await res.json();

        const targets = ["home-book-grid", "explore-book-grid", "published-grid"];

        targets.forEach(id => {
            const container = document.getElementById(id);
            if (!container) return;

            if (!allBooks.length) {
                container.innerHTML = "<p class='no-data'>No items available</p>";
                return;
            }

            const isPreview = id.includes("explore") || id.includes("home");
            const limit = isPreview ? 3 : allBooks.length;

            container.innerHTML = allBooks.slice(0, limit).map((b, i) => {
                const imgSrc = getImageSrc(b.image);
                const list = allBooks.slice(0, limit);
                return `
                    <div class="art-item">
                        <img src="${imgSrc}" onclick='openModal(${JSON.stringify(b)}, ${i}, ${JSON.stringify(list)})'>
                        <h3>${b.title}</h3>
                        <p>${b.description || ""}</p>
                    </div>
                `;
            }).join("");
        });

    } catch (err) {
        console.log("BOOK ERROR:", err);
    }
}

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

    containers.forEach(c => {
        const items = c.id.includes("explore") ? allPrints.slice(0, 3) : pageItems;

        if (!items.length) {
            c.innerHTML = "<p class='no-data'>No items available</p>";
            return;
        }

        c.innerHTML = items.map((p, i) => {
            const price = p.description ? parseInt(p.description.replace('₹', '')) || 0 : 0;
            const imgSrc = getImageSrc(p.image);

            return `
                <div class="shop-card">
                    <img src="${imgSrc}" onclick='openModal(${JSON.stringify(p)}, ${i}, ${JSON.stringify(items)})'>
                    <h3>${p.title}</h3>
                    <p>₹${price}</p>
                    <button onclick="buyPrint('${p.title}', ${price}, '${getImageSrc(p.image)}')">
                         Buy Print
                      </button>
                    
                </div>
            `;
        }).join("");
    });
}

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

function buyPrint(name, price, image) {
    if (localStorage.getItem("loggedIn") !== "true") {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    if (!name || !price) {
        alert("Invalid product data");
        return;
    }

    // Clear any existing bad localStorage values
    const existingImage = localStorage.getItem("artImage");
    if (existingImage && (existingImage.includes("localhost:7070") || existingImage.includes("localhost:37857") || !existingImage.includes("localhost:5000/uploads"))) {
        localStorage.removeItem("artImage");
        localStorage.removeItem("artName");
        localStorage.removeItem("artPrice");
    }

    localStorage.setItem("artName", name);
    localStorage.setItem("artPrice", price);
    localStorage.setItem("artImage", image);

    fetch("http://13.233.50.44:5000/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: price })
    })
        .then(async res => {
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText);
            }
            return res.json();
        })
        .then(order => {
            const options = {
               key: "rzp_test_ScwfKDA2qTOJyf".trim(),
                amount: order.amount,
                currency: "INR",
                name: "AK Art",
                description: "Art Purchase",
                order_id: order.id,
                prefill: {
                    name: user?.name || "User",
                    email: user?.email || "user@email.com",
                    contact: "9999999999"
                },
                handler: async function (response) {
                    try {
                        await fetch("http://13.233.50.44:5000/api/orders/create", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                userId: user._id,
                                userName: user.name,
                                email: user.email,
                                artName: name,
                                price: price,
                                image: image, // Send only filename to backend
                                paymentId: response.razorpay_payment_id,
                                status: "Paid"
                            })
                        });
                        
                        window.location.href = `success.html?razorpay_payment_id=${response.razorpay_payment_id}&razorpay_order_id=${response.razorpay_order_id}&razorpay_signature=${response.razorpay_signature}`;
                    } catch (err) {
                        alert("Payment done but saving failed");
                    }
                }
            };
            new Razorpay(options).open();
        })
        .catch(err => {
            console.error("Payment setup failed:", err);
            alert("Payment setup failed: " + err.message);
        });
}

function payNow() {
    window.location.href = "shop.html";
}

async function loadTestimonials() {
    try {
        const res = await fetch("http://13.233.50.44:5000/api/testimonials");
        const data = await res.json();

        const container = document.getElementById("testimonial-grid");
        if (!container) return;

        container.innerHTML = data.map(t => `
            <div class="testimonial-card">
                <p>"${t.message}"</p>
                <h4>${t.name}</h4>
            </div>
        `).join("");

        let style = {};
        try {
            const styleRes = await fetch("http://13.233.50.44:5000/api/testimonials/style");
            style = await styleRes.json();
        } catch (err) {
            console.log("TESTIMONIAL STYLE FETCH ERROR:", err);
            style = {};
        }

        const palette = style.palette || "custom";

        document.querySelectorAll(".testimonial-card p").forEach(el => {
            el.style.fontSize = style.textSize || "16px";
            if (palette !== "custom") {
                el.style.color = palettes[palette]?.text;
            } else {
                el.style.color = style.textColor || "#333";
            }
        });

        document.querySelectorAll(".testimonial-card h4").forEach(el => {
            el.style.fontSize = style.nameSize || "14px";
            if (palette !== "custom") {
                el.style.color = palettes[palette]?.text;
            } else {
                el.style.color = style.textColor || "#333";
            }
        });

        const aboutName = document.querySelector(".about-name");
        const aboutBio = document.querySelector(".about-bio");

        if (aboutName) {
            aboutName.style.fontSize = style.nameSize || "28px";
            if (palette !== "custom") {
                aboutName.style.color = palettes[palette]?.text;
            } else {
                aboutName.style.color = style.textColor || "#000";
            }
        }

        if (aboutBio) {
            aboutBio.style.fontSize = style.textSize || "16px";
            if (palette !== "custom") {
                aboutBio.style.color = palettes[palette]?.text;
            } else {
                aboutBio.style.color = style.textColor || "#333";
            }
        }

    } catch (err) {
        console.log("TESTIMONIAL ERROR:", err);
    }
}

async function loadAboutData() {
    if (!window.location.pathname.includes("about.html")) return;

    try {
        const aboutResponse = await fetch("http://13.233.50.44:5000/api/about");
        const aboutData = await aboutResponse.json();
        const about = aboutData.about || aboutData;

        const nameEl = document.getElementById("aboutName");
        const imgEl = document.getElementById("aboutImage");
        const bioEl = document.getElementById("aboutBio");
        const worksList = document.getElementById("publishedWorksList");

        nameEl.innerHTML = `<strong>${about.name}</strong>`;

        if (imgEl) {
            if (about.image) {
                imgEl.src = getImageSrc(about.image);
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
            worksList.innerHTML = "";

            if (about.publishedWorks.length === 0) {
                worksList.innerHTML = "<li>No published works yet.</li>";
            } else {
                about.publishedWorks.forEach(work => {
                    const li = document.createElement("li");

                    if (typeof work === "string") {
                        const parts = work.split("|");
                        const text = parts[0]?.trim() || "";
                        const link = parts[1]?.trim() || null;

                        li.innerHTML = link
                            ? `<span class="work-title"><a href="${link}" target="_blank" rel="noopener noreferrer">${text}</a></span>`
                            : `<span class="work-title">${text}</span>`;
                    } else if (work && typeof work === "object") {
                        const { title, details, link } = work;

                        if (link) {
                            li.innerHTML = `
                                <span class="work-title">
                                    <a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a>
                                </span>
                                <span class="work-rest">${details || ""}</span>
                            `;
                        } else {
                            li.innerHTML = `
                                <span class="work-title">${title}</span>
                                <span class="work-rest">${details || ""}</span>
                            `;
                        }
                    }

                    worksList.appendChild(li);
                });
            }
        }

        console.log("ABOUT DATA RESPONSE:", about);
        const agenciesData = [];

        const agencyRes = await fetch("http://13.233.50.44:5000/api/agencies");
        const agencyData = await agencyRes.json();

        const agenciesList = document.getElementById("agenciesList");

        if (agenciesList) {
            agenciesList.innerHTML = agencyData.length
                ? agencyData.map(a => `<li>${a.name}</li>`).join("")
                : "<li>Independent Artist</li>";
        }

        try {
            const styleRes = await fetch("http://13.233.50.44:5000/api/about/style");
            const style = await styleRes.json();

            const palette = style.palette || "custom";

            if (nameEl) {
                nameEl.style.fontSize = style.nameSize || "28px";
                nameEl.style.color = (palette !== "custom")
                    ? palettes[palette]?.text
                    : (style.textColor || "#000");
            }

            if (bioEl) {
                bioEl.style.fontSize = style.bioSize || "16px";
                bioEl.style.color = (palette !== "custom")
                    ? palettes[palette]?.text
                    : (style.textColor || "#333");
            }

            if (worksList) {
                worksList.style.fontSize = style.worksSize || "14px";
                worksList.style.color = (palette !== "custom")
                    ? palettes[palette]?.text
                    : (style.textColor || "#333");

                worksList.querySelectorAll("a, span, li").forEach(el => {
                    el.style.color = "inherit";
                    el.style.fontSize = "inherit";
                });
            }

            if (agenciesList) {
                agenciesList.style.fontSize = style.worksSize || "14px";
                agenciesList.style.color = (palette !== "custom")
                    ? palettes[palette]?.text
                    : (style.textColor || "#333");

                agenciesList.querySelectorAll("li").forEach(el => {
                    el.style.color = "inherit";
                    el.style.fontSize = "inherit";
                });
            }

        } catch (styleErr) {
            console.log("ABOUT STYLE ERROR:", styleErr);
        }

    } catch (err) {
        console.log("ABOUT PAGE ERROR:", err);
    }
}

function setupAuth() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async e => {
            e.preventDefault();

            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            const res = await fetch("http://13.233.50.44:5000/api/auth/login", {
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

            const res = await fetch("http://13.233.50.44:5000/api/auth/register", {
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

function displayArtDetails() {
    const img = document.querySelector("#artImage");
    const name = document.querySelector("#artName");
    const price = document.querySelector("#artPrice");

    const artName = localStorage.getItem("artName");
    const artPrice = localStorage.getItem("artPrice");
    const imageUrl = localStorage.getItem("artImage");

    // Defensive filter - only allow valid backend URLs or placeholder
    if (imageUrl && (imageUrl.includes("localhost:7070") || imageUrl.includes("localhost:37857") || (!imageUrl.includes("localhost:5000/uploads") && !imageUrl.includes("via.placeholder.com")))) {
        // Clear bad localStorage values
        localStorage.removeItem("artImage");
        localStorage.removeItem("artName");
        localStorage.removeItem("artPrice");
        if (img) img.src = "";
        if (name) name.innerText = "";
        if (price) price.innerText = "";
        return;
    }

    if (img) img.src = imageUrl;
    if (name) name.innerText = artName;
    if (price) price.innerText = "₹" + artPrice;
}

function downloadArt() {
    const image = localStorage.getItem("artImage");

    if (!image) {
        alert("No artwork found!");
        return;
    }

    // Defensive filter - only allow valid backend URLs or placeholder
    if (image.includes("localhost:7070") || image.includes("localhost:37857") || (!image.includes("localhost:5000/uploads") && !image.includes("via.placeholder.com"))) {
        alert("Invalid image URL found! Clearing cache...");
        localStorage.removeItem("artImage");
        localStorage.removeItem("artName");
        localStorage.removeItem("artPrice");
        return;
    }

    const filename = image.split("/uploads/").pop().split("?")[0];

    const size = document.querySelector(".size-btn.active")?.dataset.size || "6x7";
    const format = document.querySelector(".format-btn.active")?.dataset.format || "jpg";
    const title = localStorage.getItem("artName") || "artwork";

   window.location.href =
       `http://13.233.50.44:5000/api/orders/download/${filename}/${size}/${format}?title=${encodeURIComponent(title)}`;
}

function closeModal() {
    const modal = document.getElementById("imageModal");
    if (modal) {
        modal.style.display = "none";
    }
}

function injectModalExtras() {
    const modal = document.getElementById("imageModal");
    const container = document.getElementById("modalContainer");
    if (!modal || !container) return;

    if (!document.getElementById("modalTitle")) {
        const titleDiv = document.createElement("div");
        titleDiv.id = "modalTitle";
        titleDiv.style.cssText = `
            position:absolute;
            bottom:20px;
            left:20px;
            color:white;
            font-size:18px;
            z-index:10000;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            pointer-events: none;
        `;
        modal.appendChild(titleDiv);
    }

    if (!document.querySelector(".modal-nav")) {
        const prevBtn = document.createElement("button");
        prevBtn.className = "modal-nav prev";
        prevBtn.innerHTML = "&#10094;";
        prevBtn.onclick = (e) => { e.stopPropagation(); prevImage(); };

        const nextBtn = document.createElement("button");
        nextBtn.className = "modal-nav next";
        nextBtn.innerHTML = "&#10095;";
        nextBtn.onclick = (e) => { e.stopPropagation(); nextImage(); };

        modal.appendChild(prevBtn);
        modal.appendChild(nextBtn);
    }
}

function openModal(item, index = 0, list = []) {
    currentList = list.length ? list : [item];
    currentIndex = index;

    if (!currentList.length) return;

    const modal = document.getElementById("imageModal");
    if (modal) {
        modal.style.display = "flex";
        injectModalExtras();
        showImage(currentIndex);
    }
}

function showImage(index) {
    if (index < 0 || index >= currentList.length) return;

    const item = currentList[index];
    const modalImg = document.getElementById("modalImage");
    const modalDetails = document.getElementById("modalDetails");
    const modalContainer = document.getElementById("modalContainer");
    const modalTitle = document.getElementById("modalTitle");

    if (!modalImg) return;

    const imgSrc = typeof item === 'string' ? item : getImageSrc(item.image);
    modalImg.src = imgSrc;
    currentIndex = index;

    if (modalTitle) {
        modalTitle.innerText = (typeof item === 'object' && item.title) ? item.title : "";
    }

    const isShopPage = window.location.pathname.includes("shop.html");
    const isPrint = typeof item === 'object' && item.type === 'print';

    if (isShopPage && isPrint) {
        if (modalContainer) {
            modalContainer.style.display = "flex";
            modalContainer.style.background = "#fff";
            modalContainer.style.borderRadius = "12px";
            modalContainer.style.overflow = "hidden";
        }
        modalImg.style.width = "40%";
        modalImg.style.objectFit = "cover";

        if (modalDetails) {
            modalDetails.style.display = "flex";
            modalDetails.style.flexDirection = "column";
            modalDetails.style.width = "60%";
            modalDetails.style.padding = "30px";

            const price = item.description ? parseInt(item.description.replace('₹', '')) || 0 : 0;

            modalDetails.innerHTML = `
                <h2 style="font-size:28px; font-weight:700; margin-bottom:12px;">${item.title || ""}</h2>
                <p style="font-size:22px; font-weight:700; color:#3b5bdb; margin-bottom:20px;">₹${price}</p>
                <div style="font-size:16px; line-height:1.8; color:#444; margin-bottom:25px;">
                    ${Array.isArray(item.attributes) ? item.attributes.map(attr => `<p><strong>${attr.key}:</strong> ${attr.value}</p>`).join("") : ""}
                </div>

               <button onclick="buyPrint('${item.title}', ${price}, '${getImageSrc(item.image)}')" style="padding:12px 25px; background:#3b5bdb; color:white; border:none; border-radius:8px; cursor:pointer;">
                    Buy Print
                </button>
            `;
        }
    } else {
        if (modalContainer) {
            modalContainer.style.display = "block";
            modalContainer.style.background = "transparent";
            modalContainer.style.boxShadow = "none";
        }
        modalImg.style.width = "auto";
        modalImg.style.maxWidth = "90vw";
        modalImg.style.maxHeight = "85vh";
        modalImg.style.objectFit = "contain";
        if (modalDetails) modalDetails.style.display = "none";
    }

    const prevBtn = document.querySelector(".modal-nav.prev");
    const nextBtn = document.querySelector(".modal-nav.next");
    if (prevBtn) prevBtn.style.display = index > 0 ? "block" : "none";
    if (nextBtn) nextBtn.style.display = index < currentList.length - 1 ? "block" : "none";
}

function nextImage() {
    if (currentIndex < currentList.length - 1) {
        showImage(currentIndex + 1);
    }
}

function prevImage() {
    if (currentIndex > 0) {
        showImage(currentIndex - 1);
    }
}

const closeBtn = document.querySelector(".close");
if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
}

const modalEl = document.getElementById("imageModal");
if (modalEl) {
    modalEl.addEventListener("click", (e) => {
        if (e.target.id === "imageModal") {
            e.target.style.display = "none";
        }
    });
}

function logoutUser() {
    localStorage.removeItem("user");
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("artName");
    localStorage.removeItem("artPrice");
    localStorage.removeItem("artImage");
    window.location.href = "index.html";
}

window.changePage = changePage;
window.buyPrint = buyPrint;
window.logoutUser = logoutUser;
window.openModal = openModal;
window.closeModal = closeModal;
window.downloadArt = downloadArt;

async function loadHeroContent(data) {
    const slider = document.getElementById("heroSlider");
    const titleEl = document.getElementById("heroTitle");
    const subEl = document.getElementById("heroSubtitle");

    if (!slider) return;

    try {
        const palettes = {
            pastel: { title: "#2d2d2d", subtitle: "#777777" },
            earth: { title: "#3e2f1c", subtitle: "#7a5c3e" },
            dark: { title: "#ffffff", subtitle: "#cccccc" },
            playful: { title: "#ff4d6d", subtitle: "#6a4c93" }
        };

        if (data.heroColorPalette && data.heroColorPalette !== "custom") {
            const p = palettes[data.heroColorPalette];
            if (titleEl && p) titleEl.style.color = p.title;
            if (subEl && p) subEl.style.color = p.subtitle;
        } else {
            if (titleEl) titleEl.style.color = data.heroTitleColor || "#1a1a1a";
            if (subEl) subEl.style.color = data.heroSubtitleColor || "#555555";
        }

        if (titleEl) titleEl.innerText = data.heroTitle || "";
        if (subEl) subEl.innerText = data.heroSubtitle || "";

        if (titleEl) {
            titleEl.style.fontSize = data.heroTitleSize || "48px";
            titleEl.style.fontFamily = data.heroTitleFont || "Poppins";
        }
        if (subEl) {
            subEl.style.fontSize = data.heroSubtitleSize || "16px";
            subEl.style.fontFamily = data.heroSubtitleFont || "Poppins";
        }

        slider.innerHTML = "";

        const images = (data.heroImages || []).filter(img => img);

        if (images.length === 0) return;

        images.forEach((img, index) => {
            const fullPath = getImageSrc(img);

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

function togglePasswordVisibility(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        if (iconElement) {
            iconElement.classList.replace("fa-eye", "fa-eye-slash");
        }
    } else {
        input.type = "password";
        if (iconElement) {
            iconElement.classList.replace("fa-eye-slash", "fa-eye");
        }
    }
}
// SIZE BUTTONS
document.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

// FORMAT BUTTONS
document.querySelectorAll(".format-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".format-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

// ==============================
// 🔐 AUTH (FORGOT/RESET)
// ==============================
function setupForgotPassword(form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("forgotEmail").value;
        const btn = e.target.querySelector("button");
        
        btn.innerText = "Sending...";
        btn.disabled = true;

        try {
            const response = await fetch("http://13.233.50.44:5000/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server Error:", errorText);
                alert("Error: " + response.status + " " + response.statusText);
                return;
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                alert(data.message);
                if (data.success && data.token) {
                    window.location.href = `reset-password.html?token=${data.token}`;
                }
            } else {
                const text = await response.text();
                console.error("Non-JSON response:", text);
                alert("Email not sent. Please check if the backend is running on port 5000.");
            }

        } catch (err) {
            console.error("Fetch error:", err);
            alert("Could not connect to the server. Please ensure the backend is running on port 5000.");
        } finally {
            btn.innerText = "Send Reset Link";
            btn.disabled = false;
        }
    });
}

function setupResetPassword(form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = document.getElementById("newPassword").value;
        const confirm = document.getElementById("confirmPassword").value;
        
        if (password !== confirm) {
            alert("Passwords do not match!");
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            alert("Invalid or missing token.");
            return;
        }

        try {
            const response = await fetch("http://13.233.50.44:5000/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server Error:", errorText);
                alert("Error: " + response.status + " " + response.statusText);
                return;
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                alert(data.message);
                if (data.message.toLowerCase().includes("successful")) {
                    window.location.href = "login.html";
                }
            } else {
                const text = await response.text();
                console.error("Non-JSON response:", text);
                alert("Password reset failed. Please check if the backend is running on port 5000.");
            }

        } catch (err) {
            console.error("Fetch error:", err);
            alert("Could not connect to the server. Please ensure the backend is running on port 5000.");
        }
    });
}

// ==============================
// ✅ SUCCESS PAGE VERIFICATION
// ==============================
async function verifyPayment() {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get("razorpay_payment_id");
    const orderId = params.get("razorpay_order_id");
    const signature = params.get("razorpay_signature");

    const statusEl = document.getElementById("verificationStatus");

    if (!paymentId || !orderId || !signature) {
        if (statusEl) {
            statusEl.innerHTML = "<span style='color:#e74c3c;'>Invalid payment session!</span>";
        }
        return;
    }

    try {
        const response = await fetch("http://13.233.50.44:5000/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature
            })
        });

        const data = await response.json();

        if (data.success) {
            if (statusEl) {
                statusEl.innerHTML = "<span style='color:#27ae60;'>✔ Payment Verified</span>";
            }
            fetchOrderDetails(paymentId);
        } else {
            if (statusEl) {
                statusEl.innerHTML = "<span style='color:#e74c3c;'>✖ Verification Failed</span>";
            }
            alert("Payment verification failed!");
        }
    } catch (err) {
        console.error("Verification error:", err);
        if (statusEl) {
            statusEl.innerHTML = "<span style='color:#e74c3c;'>Error verifying payment.</span>";
        }
    }
}

async function fetchOrderDetails(paymentId) {
    try {
        const orderRes = await fetch("http://13.233.50.44:5000/api/orders/payment/" + paymentId);
        const result = await orderRes.json();

        if (result) {
            const order = result;
            const artPreview = document.getElementById("artPreview");
            const artName = document.getElementById("artName");
            const artPrice = document.getElementById("artPrice");

            const fullImageUrl = "http://13.233.50.44:5000/uploads/" + order.image;

            if (artPreview) artPreview.src = fullImageUrl;
            if (artName) artName.innerText = order.artName;
            if (artPrice) artPrice.innerText = "₹" + order.price;

            localStorage.setItem("artImage", fullImageUrl);
            localStorage.setItem("artName", order.artName);
            localStorage.setItem("artPrice", order.price);
        } else {
            alert("No artwork found!");
        }
    } catch (orderErr) {
        console.error("Error loading order details:", orderErr);
    }
}

function closeErrorModal() {
    const errorModal = document.getElementById("errorModal");
    if (errorModal) {
        errorModal.style.display = "none";
    }
}

window.closeErrorModal = closeErrorModal;
