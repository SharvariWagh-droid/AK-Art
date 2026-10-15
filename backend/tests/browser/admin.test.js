const { openPage, sent, settle } = require("../support/page");

const signedIn = { adminLoggedIn: "true", adminToken: "tok" };
const toasts = () => [...document.querySelectorAll("#toastContainer .toast")].map((t) => t.innerText);
const png = () => new File([new Uint8Array([137, 80, 78, 71])], "art.png", { type: "image/png" });
const choose = (input, file) => {
  Object.defineProperty(input, "files", { value: file ? [file] : [], configurable: true });
  input.dispatchEvent(new Event("change"));
};
const submit = async (form) => {
  form.dispatchEvent(new Event("submit", { cancelable: true }));
  await settle();
  // FileReader reads asynchronously.
  await new Promise((r) => setTimeout(r, 20));
  await settle();
};

describe("login", () => {
  test("a good login stores the token and opens the dashboard", async () => {
    jest.useFakeTimers({ doNotFake: ["setTimeout"] });
    const page = await openPage("admin/admin-login.html", { routes: { "POST /api/admin/login": { token: "jwt" } } });
    document.getElementById("username").value = "abhilasha";
    document.getElementById("password").value = "pw";
    await submit(document.querySelector("form"));
    expect(sent(page, "/api/admin/login")).toEqual({ username: "abhilasha", password: "pw" });
    expect(localStorage.getItem("adminToken")).toBe("jwt");
    expect(toasts()).toEqual(["Welcome back! 👋"]);
    await new Promise((r) => setTimeout(r, 1050));
    expect(page.navigations).toEqual(["dashboard.html"]);
    jest.useRealTimers();
  });

  test("bad credentials and network errors are shown; the eye toggles the password", async () => {
    await openPage("admin/admin-login.html", { routes: { "POST /api/admin/login": { status: 401, body: { message: "Invalid credentials" } } } });
    await submit(document.querySelector("form"));
    expect(toasts()).toEqual(["Invalid credentials"]);
    await openPage("admin/admin-login.html", { routes: { "POST /api/admin/login": { status: 500, body: {} } } });
    await submit(document.querySelector("form"));
    expect(toasts()).toEqual(["Invalid credentials ❌"]);
    await openPage("admin/admin-login.html", { routes: { "POST /api/admin/login": new Error("offline") } });
    await submit(document.querySelector("form"));
    expect(toasts()).toEqual(["Network error 🌐"]);
    window.togglePasswordVisibility();
    expect(document.getElementById("password").type).toBe("text");
    window.togglePasswordVisibility();
    expect(document.getElementById("password").type).toBe("password");
  });

  test("toasts disappear after three seconds", async () => {
    await openPage("admin/admin-login.html");
    jest.useFakeTimers();
    window.showToast("hi");
    jest.advanceTimersByTime(3000);
    expect(toasts()).toEqual([]);
    jest.useRealTimers();
  });
});

describe("pages behind the admin login", () => {
  test("without the stored flag and token, a page goes to the login", async () => {
    const page = await openPage("admin/dashboard.html");
    expect(page.navigations[0]).toBe("admin-login.html");
  });

  // FINDING: the admin "login" is only a localStorage flag; any visitor can set it (and the
  // token is never sent or checked), so the admin pages offer no protection of their own.
  test.failing("a made-up localStorage flag does not open the admin pages", async () => {
    const page = await openPage("admin/dashboard.html", { storage: { adminLoggedIn: "true", adminToken: "anything" } });
    expect(page.navigations).toContain("admin-login.html");
  });

  test("logout forgets the login; the sidebar opens and closes", async () => {
    const page = await openPage("admin/orders.html", { storage: signedIn, routes: { "GET /api/orders": [] } });
    window.toggleSidebar();
    expect(document.querySelector(".sidebar").classList.contains("open")).toBe(true);
    document.querySelector(".sidebar").click();
    expect(document.querySelector(".sidebar").classList.contains("open")).toBe(true);
    document.body.click();
    expect(document.querySelector(".sidebar").classList.contains("open")).toBe(false);
    window.logout();
    expect(localStorage.getItem("adminToken")).toBeNull();
    expect(page.navigations).toEqual(["admin-login.html"]);
  });
});

describe("dashboard", () => {
  test("counts and recent items", async () => {
    await openPage("admin/dashboard.html", {
      storage: signedIn,
      routes: {
        "GET /api/artworks": [{ title: "A", type: "art", image: "a.png" }, { title: "P", type: "print" }, { type: "print" }, { title: "Last", type: "art" }],
        "GET /api/orders": [{ _id: "6640aaaabbbbccccdddd0001", userName: "Asha", artName: "A", date: "2026-01-01", status: "Completed" }, { userName: "Ravi", artName: "P" }],
      },
    });
    expect(document.getElementById("dash-total-art").textContent).toBe("4");
    expect(document.getElementById("dash-total-prints").textContent).toBe("2");
    expect(document.getElementById("dash-total-orders").textContent).toBe("2");
    expect(document.getElementById("dash-recent-art").textContent).toContain("Untitled");
    expect(document.getElementById("dash-recent-orders").textContent).toContain("#DD0001");
  });

  test("bad answers count as nothing; failures are logged", async () => {
    await openPage("admin/dashboard.html", { storage: signedIn, routes: { "GET /api/artworks": { error: "x" }, "GET /api/orders": { error: "y" } } });
    expect(document.getElementById("dash-total-art").textContent).toBe("0");
    await openPage("admin/dashboard.html", { storage: signedIn, routes: { "GET /api/artworks": new Error("offline") } });
    expect(console.error).toHaveBeenCalledWith("Error loading dashboard", expect.any(Error));
  });

  test("changing the credentials", async () => {
    const page = await openPage("admin/dashboard.html", { storage: signedIn, routes: { "POST /api/admin/update": { message: "ok" } } });
    const form = document.getElementById("new-username").closest("form");
    await submit(form);
    expect(toasts()).toContain("Fill all fields 😭");
    document.getElementById("new-username").value = "owner";
    document.getElementById("new-password").value = "new-pass";
    await submit(form);
    expect(sent(page, "/api/admin/update")).toEqual({ username: "owner", password: "new-pass" });
    expect(toasts()).toContain("Credentials updated Firebase! 🔥");
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    document.getElementById("new-username").value = "x";
    document.getElementById("new-password").value = "y";
    await submit(form);
    expect(toasts()).toContain("Update failed ❌");
    page.fetch.mockRejectedValueOnce(new Error("offline"));
    await submit(form);
    expect(toasts()).toContain("Network error 🌐");
    window.toggleNewPassword();
    expect(document.getElementById("new-password").type).toBe("text");
    window.toggleNewPassword();
  });

  test("the avatar picks a profile picture kept in this browser", async () => {
    await openPage("admin/dashboard.html", { storage: { ...signedIn, adminProfileImage: "data:image/png;base64,old" } });
    const avatar = document.querySelector(".admin-avatar");
    expect(avatar.querySelector("img").src).toBe("data:image/png;base64,old");
    const click = jest.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    avatar.onclick();
    avatar.onclick();
    expect(click).toHaveBeenCalledTimes(2);
    const input = document.getElementById("profile-upload-global");
    choose(input, png());
    await new Promise((r) => setTimeout(r, 20));
    expect(localStorage.getItem("adminProfileImage")).toMatch(/^data:image\/png;base64,/);
    choose(input, null);
  });
});

describe("artworks, prints and published works", () => {
  test("lists only this page's type, with view, edit and delete", async () => {
    const page = await openPage("admin/manage-art.html", {
      storage: signedIn,
      prompt: ["New title", "New desc"],
      routes: {
        "GET /api/artworks": [{ _id: "a1", title: "Bob's Cat", description: "it's", type: "art", image: "a.png" }, { _id: "p1", title: "P", type: "print" }],
        "PUT /api/artworks/a1": { message: "ok" },
        "DELETE /api/artworks/a1": { message: "ok" },
      },
    });
    // The shop script also runs on admin pages and makes its own requests.
    expect(page.fetch.mock.calls.map(([u]) => u)).toContain("/api/artworks?type=art");
    expect(document.querySelectorAll("#artworks-grid .art-card")).toHaveLength(1);
    expect(document.querySelector("#artworks-grid img").src).toBe("http://localhost/uploads/a.png");
    await window.editArtwork("a1", "Bob's Cat", "it's");
    expect(sent(page, "/api/artworks/a1")).toEqual({ title: "New title", description: "New desc" });
    expect(toasts()).toContain("Artwork updated successfully! ✨");
    await window.deleteArtwork("a1");
    expect(page.fetch.mock.calls.some(([u, i]) => u === "/api/artworks/a1" && i?.method === "DELETE")).toBe(true);
  });

  test("edit and delete: cancelled, refused and failing", async () => {
    const page = await openPage("admin/manage-art.html", { storage: signedIn, confirm: false, prompt: [null, "T", null], routes: { "GET /api/artworks": { error: "not a list" } } });
    await window.editArtwork("a1", "t", "d");
    await window.editArtwork("a1", "t", "d");
    await window.deleteArtwork("a1");
    expect(page.fetch.mock.calls.filter(([, i]) => i?.method)).toHaveLength(0);
    window.confirm = () => true;
    window.prompt = jest.fn().mockReturnValueOnce("T").mockReturnValueOnce("D").mockReturnValueOnce("T").mockReturnValueOnce("D");
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Artwork not found" }) });
    await window.editArtwork("x", "t", "d");
    expect(toasts()).toContain("Artwork not found");
    page.fetch.mockRejectedValueOnce(new Error("offline"));
    await window.editArtwork("x", "t", "d");
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    await window.deleteArtwork("x");
    expect(toasts()).toContain("Failed to delete artwork ❌");
    page.fetch.mockRejectedValueOnce(new Error("offline"));
    await window.deleteArtwork("x");
    expect(toasts()).toContain("Network Error 🌐");
  });

  test("adding art sends the image as base64 and refreshes the list", async () => {
    const page = await openPage("admin/manage-art.html", { storage: signedIn, routes: { "GET /api/artworks": [], "POST /api/artworks/add": { message: "Added" } } });
    const form = document.getElementById("art-image").closest("form");
    await submit(form);
    expect(toasts()).toContain("Upload image 😭");
    document.getElementById("art-title").value = "Sunrise";
    choose(document.getElementById("art-image"), png());
    await submit(form);
    expect(sent(page, "/api/artworks/add")).toMatchObject({ title: "Sunrise", type: "art", description: "" });
    expect(sent(page, "/api/artworks/add").image).toMatch(/^data:image\/png;base64,/);
    expect(toasts()).toContain("Artwork added 🎨");
  });

  test("adding art: refused and failing", async () => {
    const page = await openPage("admin/manage-art.html", { storage: signedIn, routes: { "GET /api/artworks": [], "POST /api/artworks/add": { status: 400, body: { error: "Artwork already exists" } } } });
    const form = document.getElementById("art-image").closest("form");
    choose(document.getElementById("art-image"), png());
    await submit(form);
    expect(toasts()).toContain("Artwork already exists");
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    await submit(form);
    expect(toasts()).toContain("Failed to add art ❌");
    page.fetch.mockRejectedValueOnce(new Error("offline"));
    await submit(form);
    expect(toasts()).toContain("Network error 🌐");
  });

  test("adding a print sends the price and up to 15 attributes", async () => {
    const page = await openPage("admin/digital-prints.html", { storage: signedIn, routes: { "GET /api/artworks": [{ _id: "p1", title: "P", type: "print" }], "POST /api/artworks/add": { message: "Added" } } });
    expect(page.fetch.mock.calls.map(([u]) => u)).toContain("/api/artworks?type=print");
    window.addAttributeField("Size", "A4");
    window.addAttributeField("", "ignored");
    for (let i = 0; i < 14; i++) window.addAttributeField("k", "v");
    expect(toasts()).toContain("Max 15 attributes allowed");
    document.getElementById("art-title").value = "Moon";
    document.getElementById("print-price").value = "499";
    const form = document.getElementById("print-price").closest("form");
    await submit(form);
    expect(toasts()).toContain("Upload image 😭");
    choose(document.getElementById("art-image"), png());
    await submit(form);
    const body = sent(page, "/api/artworks/add");
    expect(body).toMatchObject({ title: "Moon", description: "₹499", type: "print" });
    expect(body.attributes[0]).toEqual({ key: "Size", value: "A4" });
    expect(body.attributes).toHaveLength(14);
    expect(document.getElementById("attributes-container").children).toHaveLength(0);
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    await submit(form);
    expect(toasts()).toContain("Failed to add print ❌");
    page.fetch.mockRejectedValueOnce(new Error("offline"));
    await submit(form);
  });

  test("adding a published book with a preview", async () => {
    const page = await openPage("admin/published-works.html", { storage: signedIn, routes: { "GET /api/artworks": [], "POST /api/artworks/add": { message: "Added" } } });
    expect(page.fetch.mock.calls.map(([u]) => u)).toContain("/api/artworks?type=book");
    choose(document.getElementById("pub-image"), png());
    await new Promise((r) => setTimeout(r, 20));
    expect(document.getElementById("pub-preview").style.display).toBe("block");
    choose(document.getElementById("pub-image"), null);
    document.getElementById("pub-title").value = "Tales";
    document.getElementById("pub-publisher").value = "Penguin";
    document.getElementById("pub-year").value = "2020";
    choose(document.getElementById("pub-image"), png());
    const form = document.getElementById("pub-title").closest("form");
    await submit(form);
    expect(sent(page, "/api/artworks/add")).toMatchObject({ title: "Tales", description: "Penguin (2020)", type: "book" });
    expect(toasts()).toContain("Book added 📚✨");
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: "dup" }) });
    await submit(form);
    expect(toasts()).toContain("dup");
    page.fetch.mockRejectedValueOnce(new Error("offline"));
    await submit(form);
    choose(document.getElementById("pub-image"), null);
    await submit(form);
    expect(toasts()).toContain("Upload image 😭");
  });

  // FINDING: "View" calls openModal(artwork, index, list), but admin.js's openModal takes a
  // modal element id, so nothing opens.
  test.failing("the View button opens the artwork", async () => {
    await openPage("admin/manage-art.html", { storage: signedIn, routes: { "GET /api/artworks": [{ _id: "a1", title: "A", type: "art", image: "a.png" }] } });
    window.openModalByIndex(0, "art");
    expect(document.getElementById("view-art-modal").classList.contains("active")).toBe(true);
  });

  test("modals open, close, and close from the backdrop", async () => {
    await openPage("admin/manage-art.html", { storage: signedIn, routes: { "GET /api/artworks": [] } });
    window.openModal("add-art-modal");
    const modal = document.getElementById("add-art-modal");
    expect(modal.classList.contains("active")).toBe(true);
    modal.click();
    expect(modal.classList.contains("active")).toBe(false);
    window.openModal("add-art-modal");
    window.closeModal("add-art-modal");
    window.openModal("missing");
    window.closeModal("missing");
    window.openModalByIndex(0, "book");
    window.openModalByIndex(0, "print");
  });
});

describe("orders", () => {
  test("lists orders newest first with status badges", async () => {
    await openPage("admin/orders.html", {
      storage: signedIn,
      routes: { "GET /api/orders": [{ _id: "6640aaaabbbbccccdddd0001", userName: "Asha", email: "a@x.com", artName: "Sunset", price: 499, date: "2026-01-01", paymentId: "pay_1", status: "Paid" }, { artName: "Moon", status: "Pending" }] },
    });
    const rows = document.querySelectorAll("#ordersTableBody tr");
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain("Guest");
    expect(rows[1].textContent).toContain("#DD0001");
    expect(rows[1].querySelector(".badge").className).toContain("badge-success");
    expect(rows[0].querySelector(".badge").className).toContain("badge-warning");
  });

  test("a failed load is logged", async () => {
    await openPage("admin/orders.html", { storage: signedIn, routes: { "GET /api/orders": new Error("offline") } });
    expect(console.error).toHaveBeenCalledWith("Error loading orders:", expect.any(Error));
  });
});

describe("about, agencies and testimonials", () => {
  const routes = {
    "GET /api/about": { name: "Abhilasha", bio: "Illustrator", image: "me.png", publishedWorks: [{ title: "Book A", details: "2021", link: "https://a.example" }, "Old Book | https://b.example", "Plain", null, { title: "No link" }] },
    "GET /api/about/style": { nameSize: "30px", palette: "dark" },
    "GET /api/agencies": [{ _id: "g1", name: "Penguin" }],
    "GET /api/testimonials": [{ _id: "t1", name: "Ravi's", message: "Line\nnext" }],
    "GET /api/testimonials/style": { textSize: "18px", palette: "earth" },
  };

  test("shows the about section, its edit form, styles, agencies and testimonials", async () => {
    await openPage("admin/testimonials.html", { routes });
    expect(document.getElementById("about-name-display").innerText).toBe("Abhilasha");
    expect(document.getElementById("about-img-preview").src).toBe("http://localhost/uploads/me.png");
    expect(document.querySelectorAll("#about-works-display li")).toHaveLength(4);
    expect(document.querySelectorAll(".work-item")).toHaveLength(4);
    expect(document.querySelectorAll(".work-item .work-link-input")[1].value).toBe("https://b.example");
    expect(document.getElementById("aboutNameSize").value).toBe("30px");
    expect(document.getElementById("aboutPalette").value).toBe("dark");
    expect(document.getElementById("testTextSize").value).toBe("18px");
    expect(document.getElementById("agencies-list").textContent).toContain("Penguin");
    expect(document.getElementById("testimonials-grid").textContent).toContain("Line");
  });

  test("about without an image, and failing loads", async () => {
    await openPage("admin/testimonials.html", { routes: { "GET /api/about": { name: "A", bio: "B" }, "GET /api/about/style": null, "GET /api/testimonials/style": null } });
    expect(document.getElementById("about-img-preview").style.display).toBe("none");
    await openPage("admin/testimonials.html", { routes: { "GET /api/about": new Error("x"), "GET /api/about/style": new Error("x"), "GET /api/agencies": new Error("x"), "GET /api/testimonials": new Error("x"), "GET /api/testimonials/style": new Error("x") } });
    expect(console.error).toHaveBeenCalledWith("Error loading about data:", expect.any(Error));
    expect(console.error).toHaveBeenCalledWith("Error loading testimonials:", expect.any(Error));
  });

  test("saving the about section sends name, bio, image and works with a title", async () => {
    const page = await openPage("admin/testimonials.html", { routes: { ...routes, "POST /api/about": { message: "ok" } } });
    window.openAboutModal();
    window.addWork();
    choose(document.getElementById("about-image-input") || document.querySelector('#about-modal input[type="file"]'), png());
    await new Promise((r) => setTimeout(r, 20));
    const form = document.getElementById("about-name").closest("form");
    await submit(form);
    const body = sent(page, "/api/about");
    expect(body).toMatchObject({ name: "Abhilasha", bio: "Illustrator" });
    expect(body.image).toMatch(/^data:image\/png;base64,/);
    expect(body.publishedWorks.map((w) => w.title)).toEqual(["Book A", "Old Book", "Plain", "No link"]);
    expect(toasts()).toContain("About section updated! ✨");
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: "bad" }) });
    await submit(form);
    expect(toasts()).toContain("bad");
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    await submit(form);
    page.fetch.mockRejectedValueOnce(new Error("offline"));
    await submit(form);
    expect(toasts()).toContain("Network Error 🌐");
    choose(document.querySelector('#about-modal input[type="file"]'), null);
  });

  test("style settings save, or report failure", async () => {
    const page = await openPage("admin/testimonials.html", { routes: { ...routes, "POST /api/about/style": { ok: 1 }, "POST /api/testimonials/style": { ok: 1 } } });
    await window.saveAboutStyle();
    expect(sent(page, "/api/about/style")).toMatchObject({ nameSize: "30px", palette: "dark" });
    await window.saveTestimonialStyles();
    expect(sent(page, "/api/testimonials/style")).toMatchObject({ testimonialTextSize: "18px", testimonialColorPalette: "earth" });
    for (const save of [window.saveAboutStyle, window.saveTestimonialStyles]) {
      page.fetch.mockResolvedValueOnce({ ok: false });
      await save();
      page.fetch.mockRejectedValueOnce(new Error("offline"));
      await save();
    }
    expect(toasts()).toEqual(expect.arrayContaining(["About style saved ✨", "Testimonial styles saved 🎨", "Failed to save about style ❌", "Failed to save styles ❌", "Network error 🌐"]));
  });

  test("agencies: add, edit, delete", async () => {
    const page = await openPage("admin/testimonials.html", { routes: { ...routes, "POST /api/agencies": { ok: 1 }, "PUT /api/agencies/g1": { ok: 1 }, "DELETE /api/agencies/g1": { ok: 1 } } });
    const form = document.getElementById("agency-name").closest("form");
    document.getElementById("agency-name").value = "Scholastic";
    await submit(form);
    expect(sent(page, "/api/agencies")).toEqual({ name: "Scholastic" });
    window.editAgency("g1", "Penguin");
    expect(document.getElementById("agency-modal-title").innerText).toBe("Edit Agency");
    document.getElementById("agency-name").value = "Penguin RH";
    await submit(form);
    expect(sent(page, "/api/agencies/g1")).toEqual({ name: "Penguin RH" });
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Name is required" }) });
    await submit(form);
    expect(toasts()).toContain("Name is required");
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    await submit(form);
    page.fetch.mockRejectedValueOnce(new Error("offline"));
    await submit(form);
    await window.deleteAgency("g1");
    expect(toasts()).toContain("Agency removed! 🗑️");
    page.fetch.mockResolvedValueOnce({ ok: false });
    await window.deleteAgency("g1");
    page.fetch.mockRejectedValueOnce(new Error("offline"));
    await window.deleteAgency("g1");
    window.confirm = () => false;
    await window.deleteAgency("g1");
  });

  test("testimonials: add, edit, delete", async () => {
    const page = await openPage("admin/testimonials.html", { routes: { ...routes, "POST /api/testimonials": { ok: 1 }, "PUT /api/testimonials/t1": { ok: 1 }, "DELETE /api/testimonials/t1": { ok: 1 } } });
    window.openAddTestimonialModal();
    document.getElementById("test-name").value = "Meera";
    document.getElementById("test-message").value = "Lovely";
    const form = document.getElementById("test-name").closest("form");
    await submit(form);
    expect(sent(page, "/api/testimonials")).toEqual({ name: "Meera", message: "Lovely" });
    window.editTestimonial("t1", "Ravi", "Great");
    await submit(form);
    expect(sent(page, "/api/testimonials/t1")).toEqual({ name: "Ravi", message: "Great" });
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    await submit(form);
    expect(toasts()).toContain("Operation failed ❌");
    page.fetch.mockRejectedValueOnce(new Error("offline"));
    await submit(form);
    await window.deleteTestimonial("t1");
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Testimonial not found" }) });
    await window.deleteTestimonial("t1");
    expect(toasts()).toContain("Testimonial not found");
    page.fetch.mockRejectedValueOnce(new Error("offline"));
    await window.deleteTestimonial("t1");
    window.confirm = () => false;
    await window.deleteTestimonial("t1");
  });

  // FINDING: testimonials.html (about, agencies, testimonials) never calls checkAuth.
  test.failing("the about & testimonials editor checks the admin login", async () => {
    const page = await openPage("admin/testimonials.html", { routes });
    expect(page.navigations).toContain("admin-login.html");
  });
});

describe("homepage editor", () => {
  const homepage = {
    heroTitle: "Magic",
    heroSubtitle: "Worlds",
    heroColorPalette: "custom",
    heroImages: ["one.png", "two.png"],
    footerTitle: "AK",
    footerPalette: "Dark",
    digitalPrintPalette: "pastel",
    portfolioPalette: "earth",
  };

  test("fills the form, shows existing images, and saves new ones in their slots", async () => {
    URL.createObjectURL = jest.fn(() => "blob:new");
    const page = await openPage("admin/edit-homepage.html", {
      storage: signedIn,
      routes: { "GET /api/homepage": homepage, "POST /api/homepage/upload": { filenames: ["art_new.png"] }, "PUT /api/homepage": { message: "ok" } },
    });
    expect(document.getElementById("hero-title").value).toBe("Magic");
    expect(document.getElementById("customColorSelectors").style.display).toBe("flex");
    const radio = document.querySelector('input[name="palette"][value="pastel"]');
    if (radio) {
      radio.checked = true;
      radio.onchange({ target: radio });
      expect(document.getElementById("customColorSelectors").style.display).toBe("none");
    }
    const boxes = document.querySelectorAll("#heroUploadGrid .upload-box");
    expect(boxes).toHaveLength(5);
    expect(boxes[0].querySelector("img").getAttribute("src")).toBe("/api/uploads/one.png");

    // Replace slot 3 with a new file, clear slot 2.
    boxes[2].querySelector("input").onchange({ target: { files: [png()] } });
    document.querySelectorAll("#heroUploadGrid .upload-box")[1].querySelector(".remove-btn").click();
    document.querySelectorAll("#heroUploadGrid .upload-box")[4].querySelector("input").onchange({ target: { files: [] } });
    await submit(document.getElementById("hero-title").closest("form"));
    expect(page.fetch.mock.calls.some(([u]) => u === "/api/homepage/upload")).toBe(true);
    const body = sent(page, "/api/homepage");
    expect(body.heroImages).toEqual(["one.png", null, "art_new.png", null, null]);
    expect(body).toMatchObject({ heroTitle: "Magic", footerTitle: "AK" });
    expect(toasts()).toContain("Homepage changes saved successfully! 🚀");
  });

  test("save errors are shown; a failed load is logged", async () => {
    URL.createObjectURL = jest.fn(() => "blob:new");
    const page = await openPage("admin/edit-homepage.html", { storage: signedIn, routes: { "GET /api/homepage": { heroImages: [] }, "PUT /api/homepage": { status: 500, body: {} }, "POST /api/homepage/upload": { status: 500, body: {} } } });
    const form = document.getElementById("hero-title").closest("form");
    await submit(form);
    expect(toasts()).toContain("Database update failed");
    document.querySelectorAll("#heroUploadGrid .upload-box")[0].querySelector("input").onchange({ target: { files: [png()] } });
    await submit(form);
    expect(toasts()).toContain("Image upload failed");
    page.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    page.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await submit(form);
    page.fetch.mockRejectedValueOnce(new Error(""));
    await submit(form);
    expect(toasts()).toContain("Network error during save ❌");
    await openPage("admin/edit-homepage.html", { storage: signedIn, routes: { "GET /api/homepage": { status: 500, body: {} } } });
    expect(console.error).toHaveBeenCalledWith("Error loading homepage CMS:", expect.any(Error));
  });

  test("an existing image that fails to load leaves its slot empty", async () => {
    await openPage("admin/edit-homepage.html", { storage: signedIn, routes: { "GET /api/homepage": { heroImages: ["one.png"] } } });
    const img = document.querySelector("#heroUploadGrid img");
    img.onerror();
    expect(document.querySelectorAll("#heroUploadGrid .placeholder")).toHaveLength(5);
  });

  // FINDING: the editor previews saved hero images from /api/uploads/…, but the server serves them
  // at /uploads/…; every preview fails to load, the error handler empties its slot, and the next
  // Save sends the hero images as empty — opening the editor and saving deletes them.
  test.failing("saving keeps the hero images that were already there", async () => {
    const page = await openPage("admin/edit-homepage.html", { storage: signedIn, routes: { "GET /api/homepage": { heroImages: ["one.png"] }, "PUT /api/homepage": { message: "ok" } } });
    const img = document.querySelector("#heroUploadGrid img");
    // What a browser does when /api/uploads/one.png answers 404:
    if (img.getAttribute("src").startsWith("/api/uploads/")) img.onerror();
    await submit(document.getElementById("hero-title").closest("form"));
    expect(sent(page, "/api/homepage").heroImages[0]).toBe("one.png");
  });
});

describe("admin forgot and reset password", () => {
  test("forgot goes to the reset page with the returned token", async () => {
    const page = await openPage("admin/forgot-password.html", { routes: { "POST /api/admin/forgot-password": { success: true, token: "tok" } } });
    document.getElementById("forgotEmail").value = "admin@akart.com";
    await submit(document.getElementById("adminForgotPasswordForm"));
    expect(console.log).toHaveBeenCalledWith("ADMIN RESET TOKEN:", "tok");
    await new Promise((r) => setTimeout(r, 2050));
    expect(page.navigations).toEqual(["reset-password.html?token=tok"]);
  });

  test("forgot: unknown email and network error", async () => {
    let page = await openPage("admin/forgot-password.html", { routes: { "POST /api/admin/forgot-password": { message: "Admin with this email not found" } } });
    await submit(document.getElementById("adminForgotPasswordForm"));
    expect(toasts()).toContain("Admin with this email not found");
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    await submit(document.getElementById("adminForgotPasswordForm"));
    expect(toasts()).toContain("Error occurred ❌");
    page.fetch.mockRejectedValueOnce(new Error("offline"));
    await submit(document.getElementById("adminForgotPasswordForm"));
    expect(toasts()).toContain("Network error 🌐");
  });

  test("reset checks the passwords match and goes to login", async () => {
    const page = await openPage("admin/reset-password.html", { query: "?token=tok", routes: { "POST /api/admin/reset-password": { message: "ok" } } });
    document.getElementById("resetPassword").value = "a";
    document.getElementById("confirmPassword").value = "b";
    await submit(document.getElementById("adminResetPasswordForm"));
    expect(toasts()).toContain("Passwords do not match! ❌");
    document.getElementById("confirmPassword").value = "a";
    await submit(document.getElementById("adminResetPasswordForm"));
    expect(sent(page, "/api/admin/reset-password")).toEqual({ token: "tok", password: "a" });
    await new Promise((r) => setTimeout(r, 2050));
    expect(page.navigations).toEqual(["admin-login.html"]);
    page.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    await submit(document.getElementById("adminResetPasswordForm"));
    expect(toasts()).toContain("Invalid or expired token");
    page.fetch.mockRejectedValueOnce(new Error("offline"));
    await submit(document.getElementById("adminResetPasswordForm"));
  });
});
