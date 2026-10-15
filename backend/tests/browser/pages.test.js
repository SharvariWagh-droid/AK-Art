const { openPage, sent, settle } = require("../support/page");

const fill = (values) => {
  for (const [id, value] of Object.entries(values)) document.getElementById(id).value = value;
};
const submit = async (id) => {
  document.getElementById(id).dispatchEvent(new Event("submit", { cancelable: true }));
  await settle();
};

describe("login and register", () => {
  test("a successful login remembers the user and goes to the shop", async () => {
    const page = await openPage("frontend/login.html", { routes: { "POST /api/auth/login": { message: "Login successful", user: { _id: "u1", name: "Asha" } } } });
    fill({ loginEmail: "asha@example.com", loginPassword: "secret1" });
    await submit("loginForm");
    expect(sent(page, "/api/auth/login")).toEqual({ email: "asha@example.com", password: "secret1" });
    expect(localStorage.getItem("loggedIn")).toBe("true");
    expect(JSON.parse(localStorage.getItem("user")).name).toBe("Asha");
    expect(page.navigations).toEqual(["shop.html"]);
  });

  test("a failed login shows the server's message", async () => {
    const page = await openPage("frontend/login.html", { routes: { "POST /api/auth/login": { message: "Incorrect password" } } });
    fill({ loginEmail: "a", loginPassword: "b" });
    await submit("loginForm");
    expect(page.alerts).toEqual(["Incorrect password"]);
    expect(localStorage.getItem("loggedIn")).toBeNull();
  });

  test("register checks the passwords match, then sends the account", async () => {
    const page = await openPage("frontend/register.html", { routes: { "POST /api/auth/register": { message: "Registration successful" } } });
    fill({ registerName: "Asha", registerEmail: "asha@example.com", password: "a", confirmPassword: "b" });
    await submit("registerForm");
    expect(page.alerts).toEqual(["Passwords do not match!"]);
    fill({ confirmPassword: "a" });
    await submit("registerForm");
    expect(sent(page, "/api/auth/register")).toEqual({ name: "Asha", email: "asha@example.com", password: "a" });
    expect(page.alerts[1]).toBe("Registration successful");
  });

  // FINDING: after registering, the script only moves on if the message contains "register";
  // "Registration successful" does not ("registr-ation"), so new users stay on the form.
  test.failing("a successful registration goes to the login page", async () => {
    const page = await openPage("frontend/register.html", { routes: { "POST /api/auth/register": { message: "Registration successful" } } });
    fill({ registerName: "Asha", registerEmail: "a@x.com", password: "a", confirmPassword: "a" });
    await submit("registerForm");
    expect(page.navigations).toEqual(["login.html"]);
  });

  test("register: an existing account stays on the page", async () => {
    const page = await openPage("frontend/register.html", { routes: { "POST /api/auth/register": { message: "User already exists" } } });
    fill({ registerName: "A", registerEmail: "a", password: "x", confirmPassword: "x" });
    await submit("registerForm");
    expect(page.navigations).toEqual([]);
  });
});

describe("forgot and reset password", () => {
  test("forgot password goes straight to the reset page with the token", async () => {
    const page = await openPage("frontend/forgot-password.html", { routes: { "POST /api/auth/forgot-password": { success: true, message: "Reset link sent", token: "abc" } } });
    fill({ forgotEmail: "asha@example.com" });
    await submit("forgotPasswordForm");
    expect(page.alerts).toEqual(["Reset link sent"]);
    expect(page.navigations).toEqual(["reset-password.html?token=abc"]);
    expect(document.querySelector("#forgotPasswordForm button").disabled).toBe(false);
  });

  test.each([
    [{ message: "User not found" }, "User not found"],
    [{ status: 500, body: "boom" }, "Error: 500 Error"],
    [{ status: 200, body: "<html>", contentType: "text/html" }, "Email not sent. Please check if the backend is running on port 5000."],
    [new Error("offline"), "Could not connect to the server. Please ensure the backend is running on port 5000."],
  ])("forgot password reports %j", async (route, alert) => {
    const page = await openPage("frontend/forgot-password.html", { routes: { "POST /api/auth/forgot-password": route } });
    fill({ forgotEmail: "x" });
    await submit("forgotPasswordForm");
    expect(page.alerts).toEqual([alert]);
  });

  test("reset sends the token from the link and goes to login", async () => {
    const page = await openPage("frontend/reset-password.html", { query: "?token=abc", routes: { "POST /api/auth/reset-password": { message: "Password reset successful" } } });
    fill({ newPassword: "new-1", confirmPassword: "nope" });
    await submit("resetPasswordForm");
    expect(page.alerts).toEqual(["Passwords do not match!"]);
    fill({ confirmPassword: "new-1" });
    await submit("resetPasswordForm");
    expect(sent(page, "/api/auth/reset-password")).toEqual({ token: "abc", password: "new-1" });
    expect(page.navigations).toEqual(["login.html"]);
  });

  test.each([
    [{ message: "Invalid or expired token" }, "Invalid or expired token"],
    [{ status: 400, body: "bad" }, "Error: 400 Error"],
    [{ status: 200, body: "<html>", contentType: "text/html" }, "Password reset failed. Please check if the backend is running on port 5000."],
    [new Error("offline"), "Could not connect to the server. Please ensure the backend is running on port 5000."],
  ])("reset reports %j", async (route, alert) => {
    const page = await openPage("frontend/reset-password.html", { query: "?token=abc", routes: { "POST /api/auth/reset-password": route } });
    fill({ newPassword: "a", confirmPassword: "a" });
    await submit("resetPasswordForm");
    expect(page.alerts).toEqual([alert]);
  });

  test("reset without a token in the link", async () => {
    const page = await openPage("frontend/reset-password.html");
    fill({ newPassword: "a", confirmPassword: "a" });
    await submit("resetPasswordForm");
    expect(page.alerts).toEqual(["Invalid or missing token."]);
  });
});

describe("about page", () => {
  const about = {
    name: "Abhilasha Khatri",
    bio: "Illustrator\n\nBased in Pune",
    image: "me.png",
    publishedWorks: ["Book A | https://a.example", "Book B", { title: "Book C", details: "2021", link: "https://c.example" }, { title: "Book D" }, 42],
  };

  test("shows the bio, works with links, agencies, testimonials and styles", async () => {
    await openPage("frontend/about.html", {
      routes: {
        "GET /api/about": about,
        "GET /api/agencies": [{ name: "Penguin" }],
        "GET /api/about/style": { palette: "dark", nameSize: "30px", bioSize: "18px", worksSize: "15px" },
        "GET /api/testimonials": [{ name: "Ravi", message: "Lovely work" }],
        // The testimonial style also colours the about heading (see TESTING.md); same palette here.
        "GET /api/testimonials/style": { palette: "dark", textSize: "17px", nameSize: "13px" },
      },
    });
    expect(document.getElementById("aboutName").innerHTML).toBe("<strong>Abhilasha Khatri</strong>");
    expect(document.getElementById("aboutImage").src).toBe("http://localhost/uploads/me.png");
    expect(document.querySelectorAll("#aboutBio p")).toHaveLength(2);
    const works = document.getElementById("publishedWorksList");
    expect([...works.querySelectorAll("a")].map((a) => a.href)).toEqual(["https://a.example/", "https://c.example/"]);
    expect(works.textContent).toContain("Book B");
    expect(works.textContent).toContain("Book D");
    expect(document.getElementById("agenciesList").textContent).toBe("Penguin");
    expect(document.getElementById("aboutName").style.color).toBe("rgb(255, 255, 255)");
    expect(document.querySelector(".testimonial-card p").textContent).toBe('"Lovely work"');
    expect(document.querySelector(".testimonial-card p").style.fontSize).toBe("17px");
  });

  test("defaults: no image, no works, independent artist, custom colours", async () => {
    await openPage("frontend/about.html", {
      routes: {
        "GET /api/about": { about: { name: "A", publishedWorks: [] } },
        "GET /api/agencies": [],
        "GET /api/about/style": { textColor: "#112233" },
        "GET /api/testimonials": "not a list",
        "GET /api/testimonials/style": new Error("offline"),
      },
    });
    expect(document.getElementById("aboutImage").style.display).toBe("none");
    expect(document.getElementById("publishedWorksList").textContent).toBe("No published works yet.");
    expect(document.getElementById("agenciesList").textContent).toBe("Independent Artist");
    expect(document.getElementById("aboutBio").style.color).toBe("rgb(17, 34, 51)");
  });

  test("style and page failures are logged, not shown", async () => {
    await openPage("frontend/about.html", { routes: { "GET /api/about": { name: "A" }, "GET /api/agencies": [], "GET /api/about/style": new Error("offline"), "GET /api/testimonials": new Error("offline") } });
    expect(console.log).toHaveBeenCalledWith("ABOUT STYLE ERROR:", expect.any(Error));
    expect(console.log).toHaveBeenCalledWith("TESTIMONIAL ERROR:", expect.any(Error));
    await openPage("frontend/about.html", { routes: { "GET /api/about": new Error("offline") } });
    expect(console.log).toHaveBeenCalledWith("ABOUT PAGE ERROR:", expect.any(Error));
  });

  test("testimonials elsewhere use custom colours", async () => {
    await openPage("frontend/about.html", { routes: { "GET /api/testimonials": [{ name: "R", message: "M" }], "GET /api/testimonials/style": { textColor: "#ff0000" } } });
    expect(document.querySelector(".testimonial-card h4").style.color).toBe("rgb(255, 0, 0)");
  });
});

describe("success page", () => {
  const query = "?razorpay_payment_id=pay_1&razorpay_order_id=order_1&razorpay_signature=sig";

  test("verifies the payment, then shows the order and offers the download", async () => {
    const page = await openPage("frontend/success.html", {
      query,
      routes: { "POST /api/payment/verify": { success: true }, "GET /api/orders/payment/pay_1": { artName: "Sunset", price: 499, image: "sunset.png" } },
    });
    expect(document.getElementById("paymentStatus").innerHTML).toBe("Payment successful! Payment ID: pay_1");
    expect(sent(page, "/api/payment/verify")).toEqual({ razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "sig" });
    await settle();
    expect(document.getElementById("verificationStatus").textContent).toBe("✔ Payment Verified");
    expect(document.getElementById("artName").innerText).toBe("Sunset");
    expect(document.getElementById("artPrice").innerText).toBe("₹499");
    expect(localStorage.getItem("artImage")).toBe("/uploads/sunset.png");

    document.querySelector('.size-btn[data-size="8x12"]').click();
    document.querySelector('.format-btn[data-format="png"]').click();
    window.downloadArt();
    expect(page.navigations).toEqual(["/api/orders/download/sunset.png/8x12/png?title=Sunset"]);
  });

  test("an order not found falls back to what was saved before paying", async () => {
    await openPage("frontend/success.html", {
      query,
      storage: { artImage: "/uploads/local.png", artName: "Local", artPrice: "99" },
      routes: { "POST /api/payment/verify": { success: true }, "GET /api/orders/payment/pay_1": { message: "Order not found" } },
    });
    await settle();
    expect(document.getElementById("artName").innerText).toBe("Local");
    expect(document.getElementById("artPrice").innerText).toBe("₹99");
  });

  test("and the same if the order request fails", async () => {
    await openPage("frontend/success.html", {
      query,
      storage: { artImage: "/uploads/local.png", artName: "Local", artPrice: "99" },
      routes: { "POST /api/payment/verify": { success: true }, "GET /api/orders/payment/pay_1": new Error("offline") },
    });
    await settle();
    expect(document.getElementById("artPreview").src).toBe("http://localhost/uploads/local.png");
  });

  test("a failed verification, a failed request, and a broken link", async () => {
    let page = await openPage("frontend/success.html", { query, routes: { "POST /api/payment/verify": { success: false } } });
    expect(document.getElementById("verificationStatus").textContent).toBe("✖ Verification Failed");
    expect(page.alerts).toEqual(["Payment verification failed!"]);
    page = await openPage("frontend/success.html", { query, routes: { "POST /api/payment/verify": new Error("offline") } });
    expect(document.getElementById("verificationStatus").textContent).toBe("Error verifying payment.");
    page = await openPage("frontend/success.html");
    expect(document.getElementById("verificationStatus").textContent).toBe("Invalid payment session!");
  });

  test("download: nothing bought, or an old cached address", async () => {
    let page = await openPage("frontend/success.html");
    window.downloadArt();
    expect(page.alerts).toEqual(["No artwork found!"]);
    localStorage.setItem("artImage", "http://localhost:37857/uploads/x.png");
    window.downloadArt();
    expect(page.alerts[1]).toBe("Invalid image URL found! Clearing cache...");
    expect(localStorage.getItem("artImage")).toBeNull();
    localStorage.setItem("artImage", "/uploads/y.png");
    document.querySelector(".download-btn")?.click();
  });

  // FINDING: the page says "Payment successful! Payment ID: …" for whatever id is in its link,
  // before (and regardless of) verification.
  test.failing("the page only claims success once the payment is verified", async () => {
    await openPage("frontend/success.html", { query: "?razorpay_payment_id=fake&razorpay_order_id=x&razorpay_signature=y", routes: { "POST /api/payment/verify": { success: false } } });
    expect(document.getElementById("paymentStatus").innerHTML).not.toContain("Payment successful");
  });
});
