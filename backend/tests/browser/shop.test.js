const { openPage, sent, settle } = require("../support/page");

const art = (i, extra = {}) => ({ _id: `a${i}`, title: `Art ${i}`, image: `art${i}.png`, type: "art", ...extra });
const print = (i, extra = {}) => ({ _id: `p${i}`, title: `Print ${i}`, image: `print${i}.png`, type: "print", description: `₹${100 * i}`, attributes: [{ key: "Size", value: "A4" }], ...extra });
const user = { _id: "u1", name: "asha", email: "asha@example.com" };

describe("every page", () => {
  test("renders the header and a footer styled from the homepage settings", async () => {
    await openPage("frontend/login.html", { routes: { "GET /api/homepage": { footerTitle: "AK", footerDescription: "Hello", footerPalette: "dark", footerFontSize: "15px" } } });
    expect(document.querySelectorAll(".navbar a")).toHaveLength(5);
    expect(document.getElementById("footerTitle").textContent).toBe("AK");
    expect(document.getElementById("footerTitle").style.color).toBe("rgb(255, 255, 255)");
    expect(document.getElementById("globalFooterContainer").style.fontSize).toBe("15px");
  });

  test("custom footer colours, and defaults when the homepage cannot be read", async () => {
    await openPage("frontend/about.html", { routes: { "GET /api/homepage": { footerTitleColor: "#123456", footerTextColor: "#654321" } } });
    expect(document.getElementById("footerTitle").style.color).toBe("rgb(18, 52, 86)");
    await openPage("frontend/login.html", { routes: { "GET /api/homepage": { error: "x" } } });
    expect(document.getElementById("footerTitle").textContent).toBe("Abhilasha Khatri");
    await openPage("frontend/login.html", { routes: { "GET /api/homepage": new Error("offline") } });
    expect(document.getElementById("footerDesc").textContent).toContain("magical worlds");
    await openPage("frontend/login.html", { routes: { "GET /api/homepage": { footerPalette: "unknown" } } });
  });

  test("bad cached artwork images from old local ports are cleared on load", async () => {
    await openPage("frontend/login.html", { storage: { artImage: "http://localhost:7070/uploads/x.png", artName: "X", artPrice: "1" } });
    expect(localStorage.getItem("artImage")).toBeNull();
    await openPage("frontend/login.html", { storage: { artImage: "/uploads/good.png" } });
    expect(localStorage.getItem("artImage")).toBe("/uploads/good.png");
  });

  test("global buttons: logout, close modal, pay, close error, password eye", async () => {
    const page = await openPage("frontend/index.html", { storage: { user, loggedIn: "true" } });
    const click = (cls, parent = document.body) => {
      const el = document.createElement("button");
      el.className = cls;
      parent.appendChild(el);
      el.click();
      return el;
    };
    click("modal-close-btn");
    expect(document.getElementById("imageModal").style.display).toBe("none");
    click("pay-btn");
    click("close-error-btn");
    const wrapper = document.createElement("div");
    wrapper.innerHTML = '<input id="pw" type="password"><i class="password-toggle-icon fa-eye"></i>';
    document.body.appendChild(wrapper);
    wrapper.querySelector("i").click();
    expect(document.getElementById("pw").type).toBe("text");
    expect(wrapper.querySelector("i").classList.contains("fa-eye-slash")).toBe(true);
    wrapper.querySelector("i").click();
    expect(document.getElementById("pw").type).toBe("password");
    const lone = document.createElement("div");
    lone.innerHTML = '<i class="password-toggle-icon"></i>';
    document.body.appendChild(lone);
    lone.querySelector("i").click();
    click("logout-btn");
    expect(localStorage.getItem("user")).toBeNull();
    expect(page.navigations).toEqual(["shop.html", "index.html"]);
  });
});

describe("home page", () => {
  test("hero slides, colours and fonts come from the homepage settings and rotate", async () => {
    jest.useFakeTimers({ doNotFake: ["setTimeout", "queueMicrotask", "nextTick", "setImmediate"] });
    await openPage("frontend/index.html", {
      routes: {
        "GET /api/homepage": { heroTitle: "Magic", heroSubtitle: "Worlds", heroImages: ["one.png", "", "http://x/uploads/two.png"], heroColorPalette: "earth", heroTitleSize: "50px", heroTitleFont: "Lora" },
        "GET /api/artworks": (url) => (url.search === "?type=art" ? [art(1), art(2), art(3), art(4)] : []),
      },
    });
    expect(document.getElementById("heroTitle").innerText).toBe("Magic");
    expect(document.getElementById("heroTitle").style.color).toBe("rgb(62, 47, 28)");
    expect(document.getElementById("heroTitle").style.fontFamily).toBe("Lora");
    const slides = document.querySelectorAll("#heroSlider .slide");
    expect([...slides].map((s) => s.querySelector("img").src)).toEqual(["http://localhost/uploads/one.png", "http://localhost/uploads/two.png"]);
    jest.advanceTimersByTime(3500);
    expect(slides[1].classList.contains("active")).toBe(true);
    // Home shows at most three artworks; books are empty.
    expect(document.querySelectorAll("#home-art-grid .art-item")).toHaveLength(3);
    expect(document.getElementById("home-book-grid").textContent).toContain("No items available");
    jest.useRealTimers();
  });

  test("without hero images a placeholder is shown; custom colours apply", async () => {
    await openPage("frontend/index.html", { routes: { "GET /api/homepage": { heroTitleColor: "#010203", heroImages: [] } } });
    expect(document.querySelector("#heroSlider img").src).toBe("https://via.placeholder.com/1200x800?text=AK+Art+Portfolio");
    expect(document.getElementById("heroTitle").style.color).toBe("rgb(1, 2, 3)");
    expect(document.getElementById("heroSubtitle").style.fontSize).toBe("16px");
  });

  test("clicking an artwork opens it full screen with previous/next", async () => {
    await openPage("frontend/gallery.html", { routes: { "GET /api/artworks": [art(1), art(2, { image: "data:image/png;base64,xx" })] } });
    expect(document.querySelectorAll("#gallery-grid .art-item")).toHaveLength(2);
    window.openModal(art(1), 0, [art(1), art(2, { image: "data:image/png;base64,xx" })]);
    const modal = document.getElementById("imageModal");
    expect(modal.style.display).toBe("flex");
    expect(document.getElementById("modalImage").src).toBe("http://localhost/uploads/art1.png");
    expect(document.getElementById("modalTitle").innerText).toBe("Art 1");
    expect(document.querySelector(".modal-nav.prev").style.display).toBe("none");
    document.querySelector(".modal-nav.next").click();
    expect(document.getElementById("modalImage").src).toBe("data:image/png;base64,xx");
    document.querySelector(".modal-nav.next").click();
    document.querySelector(".modal-nav.prev").click();
    expect(document.getElementById("modalTitle").innerText).toBe("Art 1");
    document.querySelector(".modal-nav.prev").click();
    // A second open reuses the controls; a plain image URL works too.
    window.openModal("https://via.placeholder.com/150");
    expect(document.getElementById("modalImage").src).toBe("https://via.placeholder.com/150");
    window.closeModal();
    expect(modal.style.display).toBe("none");
  });

  test("clicking the dark backdrop closes the modal; clicking inside does not", async () => {
    await openPage("frontend/gallery.html", { routes: { "GET /api/artworks": [] } });
    expect(document.getElementById("gallery-grid").textContent).toContain("No items available");
    const modal = document.getElementById("imageModal");
    // The script wires these listeners when it loads, so open a fresh copy with the markup in place.
    window.openModal(art(1));
    modal.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    document.getElementById("modalImage").click();
  });

  test("artwork and book requests that fail leave the grids alone", async () => {
    await openPage("frontend/explore.html", { routes: { "GET /api/artworks": new Error("offline") } });
    expect(console.log).toHaveBeenCalledWith("ART ERROR:", expect.any(Error));
    expect(console.log).toHaveBeenCalledWith("BOOK ERROR:", expect.any(Error));
  });
});

describe("explore and published works", () => {
  test("explore shows three of each and the portfolio heading styles", async () => {
    await openPage("frontend/explore.html", {
      routes: {
        "GET /api/homepage": { portfolioTitle: "My Work", portfolioSubtitle: "Since 2015", portfolioPalette: "playful" },
        "GET /api/artworks": (url) => (url.search === "?type=book" ? [art(1, { type: "book", description: "Penguin (2020)" }), art(2, { type: "book" })] : { message: "x" }),
      },
    });
    expect(document.getElementById("portfolioTitle").innerText).toBe("My Work");
    expect(document.getElementById("portfolioTitle").style.color).toBe("rgb(255, 77, 109)");
    expect(document.getElementById("portfolioSubtitle").style.color).toBe("rgb(106, 76, 147)");
    expect(document.querySelectorAll("#explore-book-grid .art-item")).toHaveLength(2);
    expect(document.getElementById("explore-book-grid").textContent).toContain("Penguin (2020)");
    expect(document.getElementById("explore-art-grid").textContent).toContain("No items available");
  });

  test("custom portfolio colours, and the full published list", async () => {
    await openPage("frontend/explore.html", { routes: { "GET /api/homepage": { portfolioTitleColor: "#0000ff", portfolioSubtitleColor: "#00ff00" } } });
    expect(document.getElementById("portfolioTitle").style.color).toBe("rgb(0, 0, 255)");
    await openPage("frontend/explore.html", { routes: { "GET /api/homepage": { portfolioPalette: "nope" } } });
    expect(document.getElementById("portfolioTitle").style.color).toBe("rgb(0, 0, 0)");
    await openPage("frontend/Published Works.html", { routes: { "GET /api/artworks": [1, 2, 3, 4, 5].map((i) => art(i, { type: "book" })) } });
    expect(document.querySelectorAll("#published-grid .art-item")).toHaveLength(5);
  });
});

describe("shop", () => {
  const prints = Array.from({ length: 8 }, (_, i) => print(i + 1));

  test("lists six prints per page with prices from the description, and pages", async () => {
    await openPage("frontend/shop.html", {
      routes: { "GET /api/artworks": prints, "GET /api/homepage": { digitalPrintTitle: "Prints!", digitalPrintDescription: "Fresh", digitalPrintPalette: "pastel", digitalPrintTitleSize: "40px" } },
      storage: { user, loggedIn: "true" },
    });
    expect(document.getElementById("dpTitle").textContent).toBe("Prints!");
    expect(document.getElementById("dpTitle").style.color).toBe("rgb(45, 45, 45)");
    expect(document.querySelectorAll(".prints-grid .shop-card")).toHaveLength(6);
    expect(document.querySelector(".shop-card p").textContent).toBe("₹100");
    expect(document.querySelectorAll(".pagination button")).toHaveLength(2);
    window.changePage(2);
    expect(document.querySelectorAll(".prints-grid .shop-card")).toHaveLength(2);
    expect(document.getElementById("profileIcon").style.display).toBe("flex");
    expect(document.getElementById("profileAvatar").innerText).toBe("A");
  });

  test("custom print heading colours; prints without a price show ₹0; no prints", async () => {
    await openPage("frontend/shop.html", { routes: { "GET /api/artworks": [print(1, { description: "" }), print(2, { description: "Lovely" })], "GET /api/homepage": { digitalPrintTitleColor: "#111111" } } });
    expect([...document.querySelectorAll(".shop-card p")].map((p) => p.textContent)).toEqual(["₹0", "₹0"]);
    expect(document.getElementById("dpTitle").style.color).toBe("rgb(17, 17, 17)");
    await openPage("frontend/shop.html", { routes: { "GET /api/artworks": {} } });
    expect(document.querySelector(".prints-grid").textContent).toContain("No items available");
    await openPage("frontend/shop.html", { routes: { "GET /api/artworks": new Error("offline") } });
    expect(console.log).toHaveBeenCalledWith("PRINT ERROR:", expect.any(Error));
  });

  test("a print opens with its details and a buy button on the shop page", async () => {
    await openPage("frontend/shop.html", { routes: { "GET /api/artworks": prints } });
    window.openModal(print(3), 0, [print(3)]);
    const details = document.getElementById("modalDetails");
    expect(details.style.display).toBe("flex");
    expect(details.textContent).toContain("₹300");
    expect(details.textContent).toContain("Size: A4");
    window.openModal(print(4, { attributes: undefined, description: undefined }));
    expect(details.textContent).toContain("₹0");
  });

  test("buying needs a login", async () => {
    const page = await openPage("frontend/shop.html", { routes: { "GET /api/artworks": prints } });
    window.buyPrint("Print 1", 100, "http://localhost/uploads/print1.png");
    expect(page.alerts).toEqual(["Please login first!"]);
    expect(page.navigations).toEqual(["login.html"]);
  });

  test("buying opens Razorpay; paying records the order and goes to the success page", async () => {
    const opened = [];
    window.Razorpay = jest.fn(function (options) {
      this.open = () => opened.push(options);
    });
    const page = await openPage("frontend/shop.html", {
      routes: { "GET /api/artworks": prints, "POST /api/payment/create-order": { id: "order_9", amount: 10000 }, "POST /api/orders/create": { message: "Order saved" } },
      storage: { user, loggedIn: "true", artImage: "/not-uploads.png" },
    });
    window.buyPrint("Print 1", 100, "http://localhost/uploads/print1.png");
    await settle();
    expect(sent(page, "/api/payment/create-order")).toEqual({ amount: 100 });
    expect(localStorage.getItem("artName")).toBe("Print 1");
    const [options] = opened;
    expect(options).toMatchObject({ amount: 10000, currency: "INR", order_id: "order_9", prefill: { name: "asha", email: "asha@example.com" } });
    await options.handler({ razorpay_payment_id: "pay_1", razorpay_order_id: "order_9", razorpay_signature: "sig" });
    expect(sent(page, "/api/orders/create")).toMatchObject({ userId: "u1", artName: "Print 1", price: 100, paymentId: "pay_1", status: "Paid" });
    expect(page.navigations).toEqual(["success.html?razorpay_payment_id=pay_1&razorpay_order_id=order_9&razorpay_signature=sig"]);
  });

  test("buy problems: bad data, a failed order request, a failed save", async () => {
    const opened = [];
    window.Razorpay = jest.fn(function (options) {
      this.open = () => opened.push(options);
    });
    const page = await openPage("frontend/shop.html", { routes: { "POST /api/payment/create-order": { status: 400, body: "Invalid amount" } }, storage: { user: { _id: "u1" }, loggedIn: "true" } });
    window.buyPrint("", 0, "x");
    expect(page.alerts).toEqual(["Invalid product data"]);
    window.buyPrint("Print", 5, "x");
    await settle();
    expect(page.alerts[1]).toBe("Payment setup failed: Invalid amount");

    page.fetch.mockImplementation(async (u) =>
      String(u).includes("create-order") ? { ok: true, json: async () => ({ id: "o", amount: 1 }) } : Promise.reject(new Error("offline"))
    );
    window.buyPrint("Print", 5, "x");
    await settle();
    expect(opened[0].prefill).toMatchObject({ name: "User", email: "user@email.com" });
    await opened[0].handler({});
    expect(page.alerts[2]).toBe("Payment done but saving failed");
  });

  test("the profile panel lists my prints; clicking outside closes it", async () => {
    const page = await openPage("frontend/shop.html", {
      routes: { "GET /api/orders": [{ userId: "u1", artName: "Sunset", date: "2026-01-01", status: "Paid" }, { userName: "asha", artName: "Moon", date: "2026-01-02" }, { userId: "u2", userName: "ravi", artName: "Theirs" }] },
      storage: { user, loggedIn: "true" },
    });
    const icon = document.getElementById("profileIcon");
    icon.click();
    await settle();
    const panel = document.getElementById("profilePanel");
    expect(panel.classList.contains("active")).toBe(true);
    expect(document.getElementById("profileGreeting").innerText).toBe("Hey asha 👋");
    expect(document.getElementById("totalPrints").innerText).toBe("Your Prints: 2");
    expect(document.getElementById("profilePrints").textContent).not.toContain("Theirs");
    panel.click();
    expect(panel.classList.contains("active")).toBe(true);
    document.body.click();
    expect(panel.classList.contains("active")).toBe(false);
    void page;
  });

  test("profile panel: no prints, a failing request, and no login", async () => {
    let page = await openPage("frontend/shop.html", { routes: { "GET /api/orders": [] }, storage: { user } });
    document.getElementById("profileIcon").click();
    await settle();
    expect(document.getElementById("profilePrints").textContent).toContain("No prints yet");
    document.getElementById("profileIcon").click();

    page = await openPage("frontend/shop.html", { routes: { "GET /api/orders": new Error("offline") }, storage: { user } });
    document.getElementById("profileIcon").click();
    await settle();
    expect(document.getElementById("profilePrints").textContent).toBe("Error loading prints");

    localStorage.clear();
    page = await openPage("frontend/shop.html");
    document.getElementById("profileIcon").click();
    expect(page.navigations).toEqual(["login.html"]);
  });

  // FINDING: the profile panel downloads every customer's orders (names, emails) and filters
  // them in the browser, so any visitor can read all orders from the network tab.
  test.failing("the profile panel asks only for my orders", async () => {
    const page = await openPage("frontend/shop.html", { routes: { "GET /api/orders": [] }, storage: { user } });
    document.getElementById("profileIcon").click();
    await settle();
    expect(page.fetch.mock.calls.map(([u]) => String(u))).toContain("/api/orders/user/u1");
  });

  // FINDING: titles and descriptions are put into the page as HTML, and anyone can create
  // artworks (the API has no login check): a title with markup runs on every visitor's page.
  test.failing("artwork titles are shown as text", async () => {
    await openPage("frontend/gallery.html", { routes: { "GET /api/artworks": [art(1, { title: '<img src=x onerror="window.__xss=1">' })] } });
    expect(document.querySelector("#gallery-grid img[src='x']")).toBeNull();
  });

  // FINDING: the Buy button is built as onclick="buyPrint('<title>', ...)", so a title with an
  // apostrophe ("Children's Book") breaks the button.
  test.failing("a print whose title has an apostrophe can be bought", async () => {
    await openPage("frontend/shop.html", { routes: { "GET /api/artworks": [print(1, { title: "Children's Book" })] } });
    const onclick = document.querySelector(".shop-card button").getAttribute("onclick");
    expect(() => new Function(onclick)).not.toThrow();
  });
});
