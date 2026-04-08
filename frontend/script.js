// ==============================
// 🚀 INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    setupAuth();
    loadGalleryFromDB();
    loadBooks();
    loadPrints();

    if (typeof loadTestimonialsFrontend === "function") {
        loadTestimonialsFrontend();
    }
});

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
        pagination.innerHTML += `
            <button onclick="changePage(${i})">${i}</button>
        `;
    }
}

function changePage(page) {
    currentPage = page;
    displayPrints();
    setupPagination();
}

// ==============================
// 💳 PAYMENT
// ==============================
function buyPrint(name, price, image) {

    localStorage.setItem("artName", name);
    localStorage.setItem("artPrice", price);
    localStorage.setItem("artImage", image);

    if (localStorage.getItem("loggedIn") !== "true") {
        window.location.href = "login.html";
        return;
    }

    fetch("http://localhost:5000/api/payment/create-order", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({amount: price})
    })
    .then(res => res.json())
    .then(order => {
        const options = {
            key: "rzp_test_SWwx1VajdB2nHb",
            amount: order.amount,
            currency: "INR",
            name: "AK Art",
            description: name,
            image: image,
            order_id: order.id,
            handler: () => window.location.href = "success.html"
        };

        new Razorpay(options).open();
    })
    .catch(() => alert("Payment failed"));
}

// ==============================
// 🔐 AUTH
// ==============================
function setupAuth() {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async e => {
            e.preventDefault();

            const email = loginEmail.value;
            const password = loginPassword.value;

            const res = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email, password})
            });

            const data = await res.json();
            alert(data.message);

            if (data.message === "Login successful") {
                localStorage.setItem("loggedIn", "true");
                window.location.href = "index.html";
            }
        });
    }
}

// ==============================
// 🖼 IMAGE MODAL
// ==============================
function openModal(img) {
    const modal = document.createElement("div");
    modal.style = `
        position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;
    `;

    modal.innerHTML = `<img src="${img.src}" style="max-width:80%;border-radius:10px;">`;
    modal.onclick = () => modal.remove();

    document.body.appendChild(modal);
}


// ==============================
// 💬 TESTIMONIALS
// ==============================
async function loadTestimonialsFrontend() {
    try {
        const res = await fetch("http://localhost:5000/api/testimonials");
        const data = await res.json();

        console.log("Testimonials:", data); // DEBUG

        const container = document.getElementById("testimonial-grid");
        if (!container) return;

        if (data.length === 0) {
            container.innerHTML = "<p>No testimonials yet</p>";
            return;
        }

        const html = data.map(t => `
            <div class="testimonial-card">
                <p>"${t.message}"</p>
                <h4>— ${t.name}</h4>
            </div>
        `).join("");

        container.innerHTML = html;

    } catch (err) {
        console.error("Testimonial Error:", err);
    }
}

// ==============================
// 🌍 GLOBAL EXPORTS
// ==============================
window.changePage = changePage;
window.buyPrint = buyPrint;
window.openModal = openModal;