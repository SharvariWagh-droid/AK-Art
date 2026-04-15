// ==============================
// 🚀 INIT
// ==============================
const HOMEPAGE_API = "http://localhost:5000/api/homepage";
let currentIndex = 0;
let currentList = [];
let currentModalType = 'print';
document.addEventListener("DOMContentLoaded", () => {
    setupAuth();

    // 🔥 SAFE EXECUTION (ONLY RUN IF GRIDS EXIST)
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

    loadHomepageData(); // 🔥 GLOBAL FOOTER & HERO
 });
 
 async function loadHomepageData() {
    try {
        const res = await fetch(HOMEPAGE_API);
        const data = await res.json();
 
        renderFooter(data);
 
        // Only call hero if elements exist
        if (document.getElementById("heroSlider")) {
            loadHeroContent(data);
        }

        // Only call shop header if elements exist
        const dpTitle = document.getElementById("dpTitle");
        const dpDesc = document.getElementById("dpDesc");
        if (dpTitle && dpDesc) {
            dpTitle.textContent = data.digitalPrintTitle || "Digital Prints";
            dpDesc.textContent = data.digitalPrintDescription || "A curated collection of premium illustrations for your modern space.";

            dpTitle.style.fontSize = data.digitalPrintTitleSize || "32px";
            dpDesc.style.fontSize = data.digitalPrintDescSize || "16px";

            dpTitle.style.color = data.digitalPrintTextColor || "#000000";
            dpDesc.style.color = data.digitalPrintTextColor || "#000000";
        }
    } catch (err) {
        console.error("Homepage load error:", err);
        // Render footer anyway with default data if API fails
        renderFooter({});
    }
 }
 
 function renderFooter(data) {
    console.log("FOOTER DATA:", data);
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
        // ✅ CONDITIONAL STYLE APPLICATION
        if (data.footerTextColor) container.style.color = data.footerTextColor;
        if (data.footerFontSize) container.style.fontSize = data.footerFontSize;
        if (data.footerFontFamily) container.style.fontFamily = data.footerFontFamily;
        
        // Force inheritance for specific elements if browser defaults interfere
        const textElements = container.querySelectorAll("h2, p, a");
        textElements.forEach(el => {
            if (!el.classList.contains("fab")) { // Don't override icon fonts
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
const BASE_URL = "http://localhost:5000/uploads/";

// ==============================
// 🎨 IMAGE HELPER (NORMALIZATION)
// ==============================
function getImageSrc(img) {
    if (!img) return "";
    if (img.startsWith("http")) return img;

    // ✅ FORCE BACKEND URL ONLY (fixes Razorpay crash)
    return "http://localhost:5000/uploads/" + img;
}


// ==============================
// 🎨 ART
// ==============================
async function loadGalleryFromDB() {
    try {
        const res = await fetch(API + "?type=art");
        allArts = await res.json();

        const targets = ["home-art-grid", "explore-art-grid", "gallery-grid"];
        
        targets.forEach(id => {
            const container = document.getElementById(id);
            if (!container) return; // Safety check

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
            if (!container) return; // Safety check

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

// ==============================
// 🖼 PRINTS
// ==============================
// (Arrays moved to top)
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
                <button onclick="buyPrint('${p.title}', ${price}, '${imgSrc}')">
                    Buy Print
                </button>
            </div>`;
        }).join("");
    });
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

    // ✅ SAVE DATA (for success page)
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

            // ✅ IMPORTANT: DO NOT ADD image/config blocks (they broke UI earlier)

            prefill: {
                name: user?.name || "User",
                email: user?.email || "user@email.com",
                contact: "9999999999"
            },

            handler: async function (response) {

                try {
                    // ✅ Save locally
                    const existingOrders = JSON.parse(localStorage.getItem("orders")) || [];

                    existingOrders.push({
                        userId: user._id,
                        artName: name,
                        price: price,
                        paymentId: response.razorpay_payment_id
                    });

                    localStorage.setItem("orders", JSON.stringify(existingOrders));

                    // ✅ Save to backend
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

                } catch (err) {
                    console.error("Order Save Error:", err);
                    alert("Payment done but saving failed");
                }
            },

            modal: {
                ondismiss: function () {
                    console.log("Payment popup closed");
                }
            },

            theme: {
                color: "#3b5bdb"
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    })
    .catch(err => {
        console.error("Payment Error:", err);
        alert("Payment failed. Try again.");
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

        // 1. RENDER HTML FIRST
        container.innerHTML = data.map(t => `
            <div class="testimonial-card">
                <p>"${t.message}"</p>
                <h4>${t.name}</h4>
            </div>
        `).join("");

        // 2. FETCH STYLES (SAFE FETCH)
        let style = {};
        try {
            const styleRes = await fetch("http://localhost:5000/api/testimonials/style");
            style = await styleRes.json();
        } catch (err) {
            console.log("TESTIMONIAL STYLE FETCH ERROR:", err);
            style = {};
        }

        // 3. APPLY STYLES
        const palettes = {
            pastel: { text: "#444" },
            earth: { text: "#3e2f1c" },
            dark: { text: "#ffffff" },
            playful: { text: "#6a4c93" }
        };

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

        // 4. APPLY TO ABOUT SECTION (FRONTEND ONLY)
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
            worksList.innerHTML = ""; // Clear existing
            
            if (about.publishedWorks.length === 0) {
                worksList.innerHTML = "<li>No published works yet.</li>";
            } else {
                about.publishedWorks.forEach(work => {
                    const li = document.createElement("li");

                    // HANDLE OLD STRING DATA
                    if (typeof work === "string") {
                        const parts = work.split("|");
                        const text = parts[0]?.trim() || "";
                        const link = parts[1]?.trim() || null;

                        li.innerHTML = link
                            ? `<span class="work-title"><a href="${link}" target="_blank" rel="noopener noreferrer">${text}</a></span>`
                            : `<span class="work-title">${text}</span>`;
                    } else if (work && typeof work === "object") {
                        // NEW STRUCTURED DATA
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
                    } else {
                        return; // Skip invalid
                    }

                    worksList.appendChild(li);
                });
            }
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

        // --- APPLY ABOUT STYLES (FRONTEND ONLY) ---
        try {
            const styleRes = await fetch("http://localhost:5000/api/about/style");
            const style = await styleRes.json();

            const palettes = {
                pastel: { text: "#444" },
                earth: { text: "#3e2f1c" },
                dark: { text: "#ffffff" },
                playful: { text: "#6a4c93" }
            };

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
                
                // Ensure list items inherit color
                worksList.querySelectorAll("a, span, li").forEach(el => {
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
    if (modal) {
        modal.style.display = "none";
    }
}

function injectModalExtras() {
    const modal = document.getElementById("imageModal");
    const container = document.getElementById("modalContainer");
    if (!modal || !container) return;

    // 1. Title Div
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

    // 2. Navigation Buttons
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

    // Update Title Overlay
    if (modalTitle) {
        modalTitle.innerText = (typeof item === 'object' && item.title) ? item.title : "";
    }

    // Handle Shop Mode (Digital Prints)
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
            
            const price = item.description ? parseInt(item.description.replace('₹','')) || 0 : 0;

            modalDetails.innerHTML = `
                <h2 style="font-size:28px; font-weight:700; margin-bottom:12px;">${item.title || ""}</h2>
                <p style="font-size:22px; font-weight:700; color:#3b5bdb; margin-bottom:20px;">₹${price}</p>
                <div style="font-size:16px; line-height:1.8; color:#444; margin-bottom:25px;">
                    ${Array.isArray(item.attributes) ? item.attributes.map(attr => `<p><strong>${attr.key}:</strong> ${attr.value}</p>`).join("") : ""}
                </div>
                <button onclick="buyPrint('${item.title}', ${price}, '${imgSrc}')" style="padding:12px 25px; background:#3b5bdb; color:white; border:none; border-radius:8px; cursor:pointer;">
                    Buy Print
                </button>
            `;
        }
    } else {
        // Standard View (Art/Books)
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

    // Toggle Nav Button Visibility
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

async function loadHeroContent(data) {
    const slider = document.getElementById("heroSlider");
    const titleEl = document.getElementById("heroTitle");
    const subEl = document.getElementById("heroSubtitle");

    if (!slider) return;

    try {
        console.log("HERO DATA:", data);

        // ✅ TEXT
        // ✅ COLORS & PALETTES
        const palettes = {
            pastel: { title: "#2d2d2d", subtitle: "#777777" },
            earth: { title: "#3e2f1c", subtitle: "#7a5c3e" },
            dark: { title: "#ffffff", subtitle: "#cccccc" },
            playful: { title: "#ff4d6d", subtitle: "#6a4c93" }
        };

        console.log("COLOR DATA:", data);

        if (data.heroColorPalette && data.heroColorPalette !== "custom") {
            const p = palettes[data.heroColorPalette];
            if (titleEl && p) titleEl.style.color = p.title;
            if (subEl && p) subEl.style.color = p.subtitle;
        } else {
            if (titleEl) titleEl.style.color = data.heroTitleColor || "#1a1a1a";
            if (subEl) subEl.style.color = data.heroSubtitleColor || "#555555";
        }

        // ✅ TEXT CONTENT
        if (titleEl) titleEl.innerText = data.heroTitle || "";
        if (subEl) subEl.innerText = data.heroSubtitle || "";

        // ✅ APPLY TEXT STYLING (NEW)
        if (titleEl) {
            titleEl.style.fontSize = data.heroTitleSize || "48px";
            titleEl.style.fontFamily = data.heroTitleFont || "Poppins";
        }
        if (subEl) {
            subEl.style.fontSize = data.heroSubtitleSize || "16px";
            subEl.style.fontFamily = data.heroSubtitleFont || "Poppins";
        }

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