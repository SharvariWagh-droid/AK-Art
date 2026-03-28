document.addEventListener("DOMContentLoaded", () => {

    /* ==============================
       SHOW / HIDE PASSWORD
    ============================== */
    const passwordField = document.querySelector("input[type='password']");

    if (passwordField) {
        const eye = document.createElement("span");
        eye.innerHTML = "👁";
        eye.style.cursor = "pointer";
        eye.style.marginLeft = "-30px";

        passwordField.parentNode.insertBefore(eye, passwordField.nextSibling);

        eye.addEventListener("click", () => {
            passwordField.type =
                passwordField.type === "password" ? "text" : "password";
        });
    }

    /* ==============================
       PROFILE PANEL
    ============================== */
    const icon = document.getElementById("profileIcon");
    const panel = document.getElementById("profilePanel");

    if (icon && panel) {
        icon.addEventListener("click", (e) => {
            e.stopPropagation();
            panel.classList.toggle("active");
            loadProfile();
        });

        panel.addEventListener("click", (e) => e.stopPropagation());

        document.addEventListener("click", () => {
            panel.classList.remove("active");
        });
    }

    /* ==============================
       REGISTER
    ============================== */
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const name = document.getElementById("registerName").value;
            const email = document.getElementById("registerEmail").value;
            const password = document.getElementById("password").value;

            try {
                const res = await fetch("http://localhost:5000/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await res.json();
                alert(data.message);

                if (data.message === "Registration successful") {
                    window.location.href = "login.html";
                }

            } catch {
                alert("Registration failed");
            }
        });
    }

    /* ==============================
       LOGIN
    ============================== */
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            try {
                const res = await fetch("http://localhost:5000/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                alert(data.message);

                if (data.message === "Login successful") {
                    localStorage.setItem("loggedIn", "true");
                    localStorage.setItem("userName", data.user);
                    window.location.href = "index.html";
                }

            } catch {
                alert("Login failed");
            }
        });
    }

    /* ==============================
       LOAD PAYMENT PAGE
    ============================== */
    const artNameEl = document.getElementById("artName");
    const artPriceEl = document.getElementById("artPrice");
    const artImageEl = document.getElementById("artImage");

    if (artNameEl && artPriceEl && artImageEl) {
        artNameEl.innerText = localStorage.getItem("artName");
        artPriceEl.innerText = "₹" + localStorage.getItem("artPrice");
        artImageEl.src = localStorage.getItem("artImage");
    }

    /* ==============================
       LOAD SUCCESS PAGE
    ============================== */
    const preview = document.getElementById("artPreview");

    if (preview) {
        preview.src = localStorage.getItem("artImage");
        document.getElementById("artName").innerText = localStorage.getItem("artName");
        document.getElementById("artPrice").innerText = "₹" + localStorage.getItem("artPrice");
    }

    /* ==============================
       LOAD ADMIN ORDERS
    ============================== */
    const table = document.getElementById("ordersTable");

    if (table) {
        loadOrders();
    }

});


/* ===================================
   BUY PRINT
=================================== */
function buyPrint(name, price, image) {

    localStorage.setItem("artName", name);
    localStorage.setItem("artPrice", price);
    localStorage.setItem("artImage", image);

    const loggedIn = localStorage.getItem("loggedIn");

    if (loggedIn === "true") {
        window.location.href = "payment.html";
    } else {
        window.location.href = "login.html";
    }
}


/* ===================================
   PAYMENT (SAVE TO MONGODB)
=================================== */
function payNow() {

    document.getElementById("paymentProcessing").style.display = "flex";

    const orderData = {
        userName: localStorage.getItem("userName"),
        email: "demo@gmail.com",
        artName: localStorage.getItem("artName"),
        price: localStorage.getItem("artPrice"),
        image: localStorage.getItem("artImage")
    };

    fetch("http://localhost:5000/api/orders/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
    })
    .then(res => res.json())
    .then(() => {
        setTimeout(() => {
            window.location.href = "success.html";
        }, 1500);
    })
    .catch(() => {
        alert("Order failed");
    });
}


/* ===================================
   LOAD ORDERS (ADMIN)
=================================== */
async function loadOrders() {

    const res = await fetch("http://localhost:5000/api/orders");
    const orders = await res.json();

    const table = document.getElementById("ordersTable");

    orders.forEach(order => {
        const row = `
            <tr>
                <td>${order.userName}</td>
                <td>${order.artName}</td>
                <td>₹${order.price}</td>
            </tr>
        `;
        table.innerHTML += row;
    });
}


/* ===================================
   PROFILE
=================================== */
function loadProfile() {

    const name = localStorage.getItem("userName") || "User";

    const nameEl = document.getElementById("profileName");
    if (nameEl) nameEl.innerText = name;

    const prints = JSON.parse(localStorage.getItem("purchasedPrints")) || [];
    const list = document.getElementById("profilePrints");

    if (list) {
        list.innerHTML = "";
        prints.forEach(print => {
            const li = document.createElement("li");
            li.innerText = print;
            list.appendChild(li);
        });
    }
}


/* ===================================
   LOGOUT
=================================== */
function logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userName");
    window.location.href = "index.html";
}


/* ===================================
   GLOBAL FUNCTIONS
=================================== */
window.buyPrint = buyPrint;
window.payNow = payNow;
window.logout = logout;