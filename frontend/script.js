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
       PROFILE PANEL TOGGLE
    ============================== */
    const icon = document.getElementById("profileIcon");
    const panel = document.getElementById("profilePanel");

    if (icon && panel) {

        icon.addEventListener("click", (e) => {
            e.stopPropagation();
            panel.classList.toggle("active");
            loadProfile();
        });

        panel.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        document.addEventListener("click", () => {
            panel.classList.remove("active");
        });
    }

    /* ==============================
       REGISTER USER
    ============================== */

    const registerForm = document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener("submit", async function (e) {

            e.preventDefault();

            const name = document.getElementById("registerName").value;
            const email = document.getElementById("registerEmail").value;
            const password = document.getElementById("registerPassword").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (password !== confirmPassword) {
                alert("Passwords do not match");
                return;
            }

            const res = await fetch("http://localhost:5000/api/auth/register", {

                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    password
                })

            });

            const data = await res.json();

            alert(data.message);

            if (data.message === "Registration successful") {
                window.location.href = "login.html";
            }

        });

    }


    /* ==============================
       LOGIN USER
    ============================== */

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", async function (e) {

            e.preventDefault();

            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            const res = await fetch("http://localhost:5000/api/auth/login", {

                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })

            });

            const data = await res.json();

            alert(data.message);

            if (data.message === "Login successful") {

                localStorage.setItem("loggedIn", "true");
                localStorage.setItem("userName", data.user);

                window.location.href = "index.html";

            }

        });

    }

    /* ==============================
       IMAGE MODAL
    ============================== */

    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const images = document.querySelectorAll(".art-item img");
    const closeBtn = document.querySelector(".close");

    if (modal && modalImg && images.length > 0) {

        images.forEach(img => {

            img.addEventListener("click", () => {

                modal.style.display = "flex";
                modalImg.src = img.src;

            });

        });

        if (closeBtn) {

            closeBtn.addEventListener("click", () => {
                modal.style.display = "none";
            });

        }

        modal.addEventListener("click", (e) => {

            if (e.target === modal) {
                modal.style.display = "none";
            }

        });
    }

});



/* ===================================
   BUY PRINT (REAL FLOW)
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
   SAVE PURCHASE AFTER PAYMENT
=================================== */

function completePurchase() {

    let prints = JSON.parse(localStorage.getItem("purchasedPrints")) || [];

    const artName = localStorage.getItem("artName");

    if (artName) {

        prints.push(artName);

        localStorage.setItem(
            "purchasedPrints",
            JSON.stringify(prints)
        );

    }

}



/* ===================================
   LOAD PROFILE PANEL
=================================== */

function loadProfile() {

    const name = localStorage.getItem("userName") || "User";

    const nameEl = document.getElementById("profileName");

    if (nameEl) {
        nameEl.innerText = name;
    }


    const prints = JSON.parse(
        localStorage.getItem("purchasedPrints")
    ) || [];

    const list = document.getElementById("profilePrints");

    if (list) {

        list.innerHTML = "";

        prints.forEach(print => {

            const li = document.createElement("li");
            li.innerText = print;

            list.appendChild(li);

        });

    }


    const total = document.getElementById("totalPrints");

    if (total) {
        total.innerText =
            "Total Prints Bought: " + prints.length;
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


/* ===============================
   PAYMENT PAGE LOGIC
================================ */

const artNameElement = document.getElementById("artName");
const artPriceElement = document.getElementById("artPrice");
const artImageElement = document.getElementById("artImage");

if (artNameElement && artPriceElement && artImageElement) {

    const name = localStorage.getItem("artName");
    const price = localStorage.getItem("artPrice");
    const image = localStorage.getItem("artImage");

    if (name && price && image) {
        artNameElement.innerText = name;
        artPriceElement.innerText = "₹" + price;
        artImageElement.src = image;
    }
}
function payNow() {

    const processingScreen = document.getElementById("paymentProcessing");

    const name = localStorage.getItem("artName");
    const price = localStorage.getItem("artPrice");
    const image = localStorage.getItem("artImage");

    if (!name || !price) {
        showErrorModal("Artwork information missing.");
        return;
    }

    /* SHOW PROCESSING SCREEN */

    if (processingScreen) {
        processingScreen.style.display = "flex";
    }

    const options = {
        key: "YOUR_RAZORPAY_KEY",
        amount: price * 100,
        currency: "INR",
        name: "AK Art Studio",
        description: name,
        image: "Personal work/logo.gif",

        handler: function (response) {
            const orderID = "AK" + Date.now();

            localStorage.setItem("orderID", orderID);

            let purchased = JSON.parse(localStorage.getItem("purchasedPrints")) || [];
            purchased.push(name);
            localStorage.setItem("purchasedPrints", JSON.stringify(purchased));
            window.location.href = "success.html";

        },
        modal: {
            ondismiss: function () {
                if (processingScreen) {
                    processingScreen.style.display = "none";
                }
            }
        }
    };
    const rzp = new Razorpay(options);
    rzp.open();
}
/*SUCCESS PAGE LOGIC*/

const artPreview = document.getElementById("artPreview");
const successName = document.getElementById("artName");
const successPrice = document.getElementById("artPrice");

if (artPreview && successName && successPrice) {

    const name = localStorage.getItem("artName");
    const price = localStorage.getItem("artPrice");
    const image = localStorage.getItem("artImage");

    if (name && price && image) {

        successName.innerText = name;

        successPrice.innerText = "₹" + price;

        artPreview.src = image;

    }
}

function downloadArt() {

    const image = localStorage.getItem("artImage");
    const name = localStorage.getItem("artName");

    if (!image) return;

    const link = document.createElement("a");

    link.href = image;

    link.download = name + ".jpg";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
}
function showErrorModal(message) {

    const modal = document.getElementById("errorModal");
    const text = document.getElementById("errorMessage");

    if (modal && text) {
        text.innerText = message;
        modal.style.display = "flex";
    }
}

function closeErrorModal() {

    const modal = document.getElementById("errorModal");

    if (modal) {
        modal.style.display = "none";
    }

}
const orderElement = document.getElementById("orderID");

if (orderElement) {

    const orderID = localStorage.getItem("orderID");

    if (orderID) {
        orderElement.innerText = "Order ID: " + orderID;
    }

}