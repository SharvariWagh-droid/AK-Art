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

    if (window.location.pathname.includes("success.html")) {
        loadSuccessPage();
    }
});
function setupProfilePanel() {
    const profileIcon = document.getElementById("profileIcon");
    const profilePanel = document.getElementById("profilePanel");

    if (!profileIcon || !profilePanel) return;

    profileIcon.addEventListener("click", (e) => {
        e.stopPropagation();

        const user = JSON.parse(localStorage.getItem("user"));

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        // Toggle panel
        profilePanel.classList.toggle("active");

        if (profilePanel.classList.contains("active")) {

            // 👤 Set username
            document.getElementById("profileName").innerText =
                user.name || "User";

            // 🔥 FETCH REAL ORDERS FROM BACKEND
            fetch("http://localhost:5000/api/orders")
                .then(res => res.json())
                .then(orders => {

                    const userOrders = orders.filter(
                        o => o.userId === user._id
                    );

                    const list = document.getElementById("profilePrints");

                    if (userOrders.length === 0) {
                        list.innerHTML = "<li>No prints purchased yet</li>";
                    } else {
                        list.innerHTML = userOrders.map(order =>
                            `<li>${order.artName} - ₹${order.price}</li>`
                        ).join("");
                    }

                    document.getElementById("totalPrints").innerText =
                        "Total Prints: " + userOrders.length;
                })
                .catch(err => {
                    console.log("PROFILE FETCH ERROR:", err);
                });
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
// 🎨 ART
// ==============================
async function loadGalleryFromDB() {
    try {
        const res = await fetch(API + "?type=art");
        const arts = await res.json();

        const html = arts.map(a => `
            <div class="art-item">
                <img src="${a.image}" onclick="openModal(this)">
                <h3>${a.title}</h3>
            </div>
        `).join("");

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

        const html = books.map(b => `
            <div class="art-item">
                <img src="${b.image}" onclick="openModal(this)">
                <h3>${b.title}</h3>
                <p>${b.description || ""}</p>
            </div>
        `).join("");

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
        const price = p.description ? parseInt(p.description.replace('₹', '')) || 0 : 0;

        return `
        <div class="shop-card">
            <img src="${p.image}">
            <h3>${p.title}</h3>
            <p>₹${price}</p>
            <button onclick="buyPrint('${p.title}', ${price}, '${p.image}')">
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

    // extract filename from URL
    const filename = image.split("/").pop();

    // redirect to backend download route
    window.location.href = `http://localhost:5000/api/orders/download/${filename}`;
}

// ==============================
// 🖼 MODAL FIX (IMPORTANT)
// ==============================
function openModal(img) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");

    modal.style.display = "flex";
    modalImg.src = img.src;
}
// close modal
document.querySelector(".close")?.addEventListener("click", () => {
    document.getElementById("imageModal").style.display = "none";
});

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
window.downloadArt = downloadArt;