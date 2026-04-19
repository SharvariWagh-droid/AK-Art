// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ===== SIDEBAR =====
function toggleSidebar() {
  var sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

document.addEventListener('click', function (e) {
  var sidebar = document.querySelector('.sidebar');
  var menuBtn = document.querySelector('.mobile-menu-btn');
  if (sidebar && sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuBtn) {
    sidebar.classList.remove('open');
  }
});

// ===== LOGIN =====
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('password');
  const icon = document.querySelector('.toggle-eye i');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

function handleLogin(e) {
  e.preventDefault();

  var username = document.getElementById('username').value;
  var password = document.getElementById('password').value;

  const savedUser = localStorage.getItem('adminUser') || 'abhilasha';
  const savedPass = localStorage.getItem('adminPass') || 'admin123';

  if (username === savedUser && password === savedPass) {
    localStorage.setItem('adminLoggedIn', 'true');
    window.location.href = 'dashboard.html';
  } else {
    showToast('Invalid credentials ❌', 'error');
  }
}

function checkAuth() {
  if (localStorage.getItem('adminLoggedIn') !== 'true') {
    window.location.href = 'admin-login.html';
  }
}

function logout() {
  localStorage.removeItem('adminLoggedIn');
  window.location.href = 'admin-login.html';
}

// ===== MODALS =====
function openModal(id) {
  var modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  var modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

document.addEventListener('click', function (e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// ======================================================
// 🚀 ARTWORKS (DB BASED - ALL TYPES)
// ======================================================

// Global arrays to store artwork data
var allArts = [];
var allBooks = [];
var allPrints = [];

function openModalByIndex(index, type) {
    let list = [];
    if (type === "art") list = allArts;
    else if (type === "book") list = allBooks;
    else if (type === "print") list = allPrints;
    openModal(list[index], index, list);
}

function getType() {
  const page = window.location.pathname.toLowerCase();

  if (page.includes("published-works")) return "book";
  if (page.includes("digital-prints")) return "print";

  return "art";
}

// LOAD
async function loadArtworks() {

  const type = getType();

  const res = await fetch(`http://13.233.50.44:5000/api/artworks?type=${type}`);
  let artworks = await res.json();

  // Apply filtering on the frontend
  artworks = artworks.filter(item => item.type === type);

  // Store in global arrays
  if (type === "art") allArts = artworks;
  else if (type === "book") allBooks = artworks;
  else if (type === "print") allPrints = artworks;

  var container =
    document.getElementById('artworks-grid') ||
    document.getElementById('prints-grid') ||
    document.getElementById('published-grid');

  if (!container) return;

  container.innerHTML = artworks.map((a, index) => {
    const safeTitle = a.title ? a.title.replace(/'/g, "\\'") : "";
    const safeDesc = a.description ? a.description.replace(/'/g, "\\'") : "";
    return `
    <div class="art-card">
      <div class="art-card-img">
        <img src="${getImageSrc(a.image)}">
      </div>
      <div class="art-card-body">
        <h3>${a.title}</h3>
        <p>${a.description || ""}</p>
        <div style="margin-top: 10px; display: flex; gap: 10px;">
          <button class="btn btn-primary btn-sm" onclick="openModalByIndex(${index}, '${type}')">View</button>
          <button class="btn btn-primary btn-sm" onclick="editArtwork('${a._id}', '${safeTitle}', '${safeDesc}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteArtwork('${a._id}')">Delete</button>
        </div>
      </div>
    </div>
  `}).join('');
}

// 🚀 LOCAL FILE UPLOADER SYSTEM
// (Uses new FileReader hooks instead of mock Cloudinary)


// ADD ART (manage-art.html)
async function addArt(e) {
  e.preventDefault();

  const titleElem = document.getElementById('art-title');
  const title = titleElem ? titleElem.value : "";
  const fileInput = document.getElementById('art-image');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (!fileInput.files[0]) {
    showToast("Upload image 😭", "warning");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (ev) {
    const base64Image = ev.target.result;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "Processing...";
    }

    console.log("ADDING TYPE: art");

    try {
      const res = await fetch("http://13.233.50.44:5000/api/artworks/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title,
          description: "",
          image: base64Image,
          type: "art"
        })
      });

      const data = await res.json();
      if (!res.ok) showToast(data.error || "Failed to add art ❌", "error");
      else {
        showToast("Artwork added 🎨", "success");
        closeModal('add-art-modal');
        e.target.reset();
        loadArtworks();
      }
    } catch (error) {
      showToast("Network error 🌐", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Add Artwork";
      }
    }
  };
  reader.readAsDataURL(fileInput.files[0]);
}

// ADD PRINT (digital-prints.html)
async function addPrint(e) {
  e.preventDefault();

  const title = document.getElementById('art-title').value;
  const price = document.getElementById('print-price').value;
  const fileInput = document.getElementById('art-image');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (!fileInput.files[0]) {
    showToast("Upload image 😭", "warning");
    return;
  }

  // ✅ COLLECT ATTRIBUTES
  const attrRows = document.querySelectorAll("#attributes-container .attr-row");
  const attributes = Array.from(attrRows).map(row => {
    const inputs = row.querySelectorAll("input");
    return {
      key: inputs[0].value,
      value: inputs[1].value
    };
  }).filter(a => a.key.trim() !== "" && a.value.trim() !== "");

  const reader = new FileReader();

  reader.onload = async function (ev) {
    const base64Image = ev.target.result;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "Processing...";
    }

    console.log("ADDING TYPE: print");
    console.log("SENDING ATTRIBUTES:", attributes);

    try {
      const res = await fetch("http://13.233.50.44:5000/api/artworks/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: title,
          description: "₹" + price,
          image: base64Image,
          type: "print",
          attributes: attributes
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to add print ❌", "error");
      } else {
        showToast("Print added 🔥", "success");
        closeModal('add-print-modal');
        e.target.reset();
        const container = document.getElementById("attributes-container");
        if (container) container.innerHTML = ""; // Clear attributes
        loadArtworks();
      }
    } catch (error) {
      showToast("Network error 🌐", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Add Print";
      }
    }
  };

  reader.readAsDataURL(fileInput.files[0]);
}
//published work
async function addPublished(e) {
  e.preventDefault();

  const title = document.getElementById('pub-title').value;
  const publisher = document.getElementById('pub-publisher').value;
  const year = document.getElementById('pub-year').value;
  const fileInput = document.getElementById('pub-image');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (!fileInput.files[0]) {
    showToast("Upload image 😭", "warning");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function (ev) {
    const base64Image = ev.target.result;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "Processing...";
    }

    console.log("ADDING TYPE: book");

    try {
      const res = await fetch("http://13.233.50.44:5000/api/artworks/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          description: `${publisher} (${year})`,
          image: base64Image,
          type: "book"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to add book ❌", "error");
      } else {
        showToast("Book added 📚✨", "success");
        closeModal('add-pub-modal');
        e.target.reset();
        loadArtworks();
      }
    } catch (error) {
      showToast("Network error 🌐", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Add Book";
      }
    }
  };

  reader.readAsDataURL(fileInput.files[0]);
}

window.addPublished = addPublished;

function previewPubImage(event) {
  const file = event.target.files[0];
  const preview = document.getElementById("pub-preview");

  if (!file || !preview) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    preview.src = e.target.result;
    preview.style.display = "block";
  };

  reader.readAsDataURL(file);
}

window.previewPubImage = previewPubImage;

// ======================================================
// 💬 ABOUT, AGENCIES & TESTIMONIALS (NOW DB)
// ======================================================

function initTestimonialsPage() {
  loadAbout();
  loadAboutStyle();
  loadAgencies();
  loadTestimonials();
  loadTestimonialStyles();
}

// --- ABOUT ---

async function loadAbout() {
  try {
    const res = await fetch("http://13.233.50.44:5000/api/about");
    const data = await res.json();

    if (data && data.name) {
      document.getElementById("about-name-display").innerText = data.name;
      document.getElementById("about-bio-display").innerText = data.bio;
      if (data.image) {
        document.getElementById("about-img-preview").src = getImageSrc(data.image);
        document.getElementById("about-img-preview").style.display = "block";
      } else {
        document.getElementById("about-img-preview").style.display = "none";
      }


      const worksList = document.getElementById("about-works-display");
      if (worksList) {
        worksList.innerHTML = "";
        (data.publishedWorks || []).forEach(w => {
          if (!w) return;
          const li = document.createElement("li");

          if (typeof w === "object") {
            li.innerHTML = `
              <a href="${w.link || '#'}" target="_blank">${(w.title || "").trim()}</a><br>
              <span>${(w.details || "").trim()}</span>
            `;
          } else {
            li.innerHTML = `<span>${w}</span>`;
          }

          worksList.appendChild(li);
        });
      }

      // Hidden data for modal
      document.getElementById("about-name").value = data.name;
      document.getElementById("about-bio").value = data.bio;
      document.getElementById("about-image-data").value = data.image || "";
      
      // Structured Works Handling
      const worksContainer = document.getElementById("worksContainer");
      if (worksContainer) {
        worksContainer.innerHTML = "";
        (data.publishedWorks || []).forEach(w => {
          if (!w) return;

          // NEW FORMAT (OBJECT)
          if (typeof w === "object") {
            addWork({
              title: w.title || "",
              details: w.details || "",
              link: w.link || ""
            });

          } else if (typeof w === "string") {
            // OLD FORMAT (STRING)
            const parts = w.split("|");
            addWork({
              title: parts[0] ? parts[0].trim() : "",
              details: "",
              link: parts[1] ? parts[1].trim() : ""
            });
          }
        });
      }

      if (data.image) {
        document.getElementById("about-modal-preview").src = getImageSrc(data.image);
        document.getElementById("about-modal-preview").style.display = "block";
      }

    }
  } catch (err) {
    console.error("Error loading about data:", err);
  }
}

function openAboutModal() {
  openModal("about-modal");
}

function previewAboutImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    const base64 = ev.target.result;
    document.getElementById("about-image-data").value = base64;
    const preview = document.getElementById("about-modal-preview");
    preview.src = base64;
    preview.style.display = "block";
  }
  reader.readAsDataURL(file);
}

function addWork(work = {}) {
  const container = document.getElementById("worksContainer");
  if (!container) return;

  const div = document.createElement("div");
  div.classList.add("work-item");

  div.innerHTML = `
    <input type="text" class="work-title-input" placeholder="Title" value="${work.title ?? ''}">
    <input type="text" class="work-details-input" placeholder="Details" value="${work.details ?? ''}">
    <input type="text" class="work-link-input" placeholder="Link" value="${work.link ?? ''}">
    <button type="button" class="delete-work-btn" onclick="this.parentElement.remove()">Delete</button>
    <hr/>
  `;

  container.appendChild(div);
}


async function handleAboutSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');

  const name = document.getElementById("about-name").value;
  const bio = document.getElementById("about-bio").value;
  const image = document.getElementById("about-image-data").value;
  
  // Collect structured works
  const publishedWorks = [];
  document.querySelectorAll(".work-item").forEach(item => {
    const title = item.querySelector(".work-title-input").value.trim();
    const details = item.querySelector(".work-details-input").value.trim();
    const link = item.querySelector(".work-link-input").value.trim();
    
    // Only push if title exists
    if (title) {
      publishedWorks.push({ title, details, link });
    }
  });


  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = "Saving..."; }

  try {
    const res = await fetch("http://13.233.50.44:5000/api/about", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, image, publishedWorks })
    });

    if (res.ok) {
      showToast("About section updated! ✨", "success");
      closeModal("about-modal");
      loadAbout();
    } else {
      const data = await res.json();
      showToast(data.error || "Update failed ❌", "error");
    }
  } catch (err) {
    showToast("Network Error 🌐", "error");
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = "Save Changes"; }
  }
}

async function loadAboutStyle() {
  try {
    const res = await fetch("http://13.233.50.44:5000/api/about/style");
    const style = await res.json();

    if (style) {
      document.getElementById("aboutNameSize").value = style.nameSize || "28px";
      document.getElementById("aboutBioSize").value = style.bioSize || "16px";
      document.getElementById("aboutWorksSize").value = style.worksSize || "14px";
      document.getElementById("aboutTextColor").value = style.textColor || "#333333";
      document.getElementById("aboutPalette").value = style.palette || "custom";
    }
  } catch (err) {
    console.error("Error loading about styles:", err);
  }
}

async function saveAboutStyle() {
  const data = {
    nameSize: document.getElementById("aboutNameSize").value,
    bioSize: document.getElementById("aboutBioSize").value,
    worksSize: document.getElementById("aboutWorksSize").value,
    textColor: document.getElementById("aboutTextColor").value,
    palette: document.getElementById("aboutPalette").value
  };

  try {
    const res = await fetch("http://13.233.50.44:5000/api/about/style", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      showToast("About style saved ✨", "success");
    } else {
      showToast("Failed to save about style ❌", "error");
    }
  } catch (err) {
    showToast("Network error 🌐", "error");
  }
}

// --- AGENCIES ---

async function loadAgencies() {
  try {
    const res = await fetch("http://13.233.50.44:5000/api/agencies");
    const data = await res.json();

    const list = document.getElementById("agencies-list");
    if (list) {
      list.innerHTML = data.map(a => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
          <span>${a.name}</span>
          <div>
            <button class="btn btn-primary btn-sm" onclick="editAgency('${a._id}', '${a.name}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteAgency('${a._id}')">Delete</button>
          </div>
        </li>
      `).join("");
    }
  } catch (err) {
    console.error("Error loading agencies:", err);
  }
}

function editAgency(id, name) {
  document.getElementById("agency-id").value = id;
  document.getElementById("agency-name").value = name;
  document.getElementById("agency-modal-title").innerText = "Edit Agency";
  document.getElementById("agency-submit-btn").innerText = "Update Agency";
  openModal("add-agency-modal");
}

async function handleAgencySubmit(e) {
  e.preventDefault();
  const id = document.getElementById("agency-id").value;
  const name = document.getElementById("agency-name").value;
  const submitBtn = document.getElementById("agency-submit-btn");

  const method = id ? "PUT" : "POST";
  const url = id ? `http://13.233.50.44:5000/api/agencies/${id}` : "http://13.233.50.44:5000/api/agencies";

  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = "Processing..."; }

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    if (res.ok) {
      showToast(`Agency ${id ? 'updated' : 'added'}! ✨`, "success");
      closeModal("add-agency-modal");
      e.target.reset();
      document.getElementById("agency-id").value = "";
      loadAgencies();
    } else {
      const data = await res.json();
      showToast(data.error || "Operation failed ❌", "error");
    }
  } catch (err) {
    showToast("Network Error 🌐", "error");
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = "Save Agency"; }
  }
}

async function deleteAgency(id) {
  if (!confirm("Remove this agency?")) return;
  try {
    const res = await fetch(`http://13.233.50.44:5000/api/agencies/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Agency removed! 🗑️", "success");
      loadAgencies();
    }
  } catch (err) { showToast("Network Error 🌐", "error"); }
}

// --- TESTIMONIALS ---

async function loadTestimonials() {
  try {
    const res = await fetch("http://13.233.50.44:5000/api/testimonials");
    const data = await res.json();

    const container = document.getElementById("testimonials-grid");
    if (!container) return;

    container.innerHTML = data.map(t => {
      const safeName = t.name ? t.name.replace(/'/g, "\\'") : "";
      const safeMsg = t.message ? t.message.replace(/'/g, "\\'").replace(/\n/g, "\\n") : "";

      return `
      <div class="testimonial-card">
        <p>"${t.message}"</p>
        <h4>${t.name}</h4>
        <div style="margin-top: 10px; display: flex; gap: 10px;">
          <button class="btn btn-primary btn-sm" onclick="editTestimonial('${t._id}', '${safeName}', '${safeMsg}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTestimonial('${t._id}')">Delete</button>
        </div>
      </div>
    `}).join("");
  } catch (err) {
    console.error("Error loading testimonials:", err);
  }
}

function openAddTestimonialModal() {
  document.getElementById("testimonial-form").reset();
  document.getElementById("test-id").value = "";
  document.getElementById("testimonial-modal-title").innerText = "Add Testimonial";
  document.getElementById("test-submit-btn").innerText = "Add Testimonial";
  openModal("testimonial-modal");
}

function editTestimonial(id, name, message) {
  document.getElementById("test-id").value = id;
  document.getElementById("test-name").value = name;
  document.getElementById("test-message").value = message;
  document.getElementById("testimonial-modal-title").innerText = "Edit Testimonial";
  document.getElementById("test-submit-btn").innerText = "Update Testimonial";
  openModal("testimonial-modal");
}

async function handleTestimonialSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("test-id").value;
  const name = document.getElementById("test-name").value;
  const message = document.getElementById("test-message").value;
  const submitBtn = document.getElementById("test-submit-btn");

  const method = id ? "PUT" : "POST";
  const url = id ? `http://13.233.50.44:5000/api/testimonials/${id}` : "http://13.233.50.44:5000/api/testimonials";

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = "Processing...";
  }

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name,
        message: message
      })
    });

    if (res.ok) {
      showToast(`Testimonial ${id ? 'updated' : 'added'} 💬✨`, "success");
      closeModal("testimonial-modal");
      loadTestimonials();
    } else {
      const data = await res.json();
      showToast(data.error || "Operation failed ❌", "error");
    }
  } catch (error) {
    showToast("Network Error 🌐", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = id ? "Update Testimonial" : "Add Testimonial";
    }
  }
}

// --- TESTIMONIAL STYLE ---

async function loadTestimonialStyles() {
  try {
    const res = await fetch("http://13.233.50.44:5000/api/testimonials/style");
    const style = await res.json();

    if (style) {
      document.getElementById("testTextSize").value = style.textSize || "16px";
      document.getElementById("testNameSize").value = style.nameSize || "14px";
      document.getElementById("testTextColor").value = style.textColor || "#333333";
      document.getElementById("testPalette").value = style.palette || "custom";
    }
  } catch (err) {
    console.error("Error loading testimonial styles:", err);
  }
}

async function saveTestimonialStyles() {
  const data = {
    testimonialTextSize: document.getElementById("testTextSize").value,
    testimonialNameSize: document.getElementById("testNameSize").value,
    testimonialTextColor: document.getElementById("testTextColor").value,
    testimonialColorPalette: document.getElementById("testPalette").value
  };

  try {
    const res = await fetch("http://13.233.50.44:5000/api/testimonials/style", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      showToast("Testimonial styles saved 🎨", "success");
    } else {
      showToast("Failed to save styles ❌", "error");
    }
  } catch (err) {
    showToast("Network error 🌐", "error");
  }
}

// ======================================================
// 📦 ORDERS (DB)
// ======================================================

async function loadOrders() {
  try {
    const res = await fetch("http://13.233.50.44:5000/api/orders");
    const orders = await res.json();

    const table = document.getElementById("ordersTableBody");
    if (!table) return;

    table.innerHTML = "";

    orders.reverse().forEach(order => {
      let statusClass = "badge-warning";
      if (order.status === "Paid" || order.status === "Completed") {
        statusClass = "badge-success";
      }

      const dateStr = order.date ? new Date(order.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "N/A";
      const statusStr = order.status || "Paid";
      const paymentStr = order.paymentId || "N/A";
      const priceStr = order.price ? `₹${order.price}` : "";

      table.innerHTML += `
        <tr>
          <td><strong style="color:var(--primary);">#${order._id ? order._id.slice(-6).toUpperCase() : 'ORD'}</strong></td>
          <td>${order.userName || 'Guest'}<br><small>${order.email || ''}</small></td>
          <td>${order.artName} <span style="color:var(--success); font-weight:600;">${priceStr}</span></td>
          <td>${dateStr}</td>
          <td><code style="background:#f0f0f0; padding:2px 5px; border-radius:4px;">${paymentStr}</code></td>
          <td><span class="badge ${statusClass}">${statusStr}</span></td>
        </tr>
      `;
    });
  } catch (err) {
    console.error("Error loading orders:", err);
  }
}

// ======================================================
// ✏️ EDIT & DELETE ARTWORKS
// ======================================================

async function editArtwork(id, currentTitle, currentDesc) {
  const newTitle = prompt("Enter new title:", currentTitle);
  if (newTitle === null) return; // User cancelled

  const newDesc = prompt("Enter new description/price:", currentDesc);
  if (newDesc === null) return;

  try {
    const res = await fetch(`http://13.233.50.44:5000/api/artworks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, description: newDesc })
    });

    if (res.ok) {
      showToast("Artwork updated successfully! ✨", "success");
      loadArtworks();
    } else {
      const data = await res.json();
      showToast(data.error || "Failed to edit artwork ❌", "error");
    }
  } catch (err) {
    showToast("Network Error 🌐", "error");
  }
}

async function deleteArtwork(id) {
  if (!confirm("Are you sure you want to delete this artwork?")) return;

  try {
    const res = await fetch(`http://13.233.50.44:5000/api/artworks/${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      loadArtworks();
    } else {
      const data = await res.json();
      showToast(data.error || "Failed to delete artwork ❌", "error");
    }
  } catch (err) {
    showToast("Network Error 🌐", "error");
  }
}

async function deleteTestimonial(id) {
  if (!confirm("Are you sure you want to delete this testimonial?")) return;

  try {
    const res = await fetch(`http://13.233.50.44:5000/api/testimonials/${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      loadTestimonials();
    } else {
      const data = await res.json();
      showToast(data.error || "Failed to delete testimonial ❌", "error");
    }
  } catch (err) {
    showToast("Network Error 🌐", "error");
  }
}

// ======================================================
// 🌍 GLOBAL
// ======================================================

/* ========================
   DYNAMIC DASHBOARD
   ======================== */
async function loadDashboardStats() {
  try {
    const [artRes, ordersRes] = await Promise.all([
      fetch('http://13.233.50.44:5000/api/artworks'),
      fetch('http://13.233.50.44:5000/api/orders')
    ]);
    const artworks = await artRes.json();
    const orders = await ordersRes.json();

    const prints = artworks.filter(a => a.type === 'print');

    const elArt = document.getElementById('dash-total-art');
    const elPrint = document.getElementById('dash-total-prints');
    const elOrd = document.getElementById('dash-total-orders');

    if (elArt) elArt.textContent = artworks.length;
    if (elPrint) elPrint.textContent = prints.length;
    if (elOrd) elOrd.textContent = orders.length;

    // Recent artworks
    const dashArtGrid = document.getElementById('dash-recent-art');
    if (dashArtGrid) {
      const recentArt = artworks.slice(-3).reverse(); // get last 3
      dashArtGrid.innerHTML = recentArt.map(a => `
              <div class="art-card">
                <div class="art-card-img" style="background:#f4f6ff; padding:10px; display:flex; justify-content:center; align-items:center;">
                  <img src="${getImageSrc(a.image)}" style="max-height:150px; border-radius:8px; object-fit:contain;">
                </div>
                <div class="art-card-body"><h3>${a.title || 'Untitled'}</h3></div>
              </div>
            `).join('');
    }

    // Recent orders
    const dashOrdGrid = document.getElementById('dash-recent-orders');
    if (dashOrdGrid) {
      const recentOrd = orders.slice(-3).reverse();
      dashOrdGrid.innerHTML = recentOrd.map(order => {
        const statusClass = order.status === "Completed" ? "badge-success" : "badge-warning";
        const dateStr = order.date ? new Date(order.date).toLocaleDateString() : "N/A";
        const statusStr = order.status || "Processing";
        return `
                  <tr>
                    <td>#${order._id ? order._id.slice(-6).toUpperCase() : 'ORD'}</td>
                    <td>${order.userName}</td>
                    <td>${order.artName}</td>
                    <td>${dateStr}</td>
                    <td><span class="badge ${statusClass}">${statusStr}</span></td>
                  </tr>
                `;
      }).join('');
    }
  } catch (err) {
    console.error("Error loading dashboard", err);
  }
}
window.loadDashboardStats = loadDashboardStats;

/* ========================
   PROFILE IMAGE
   ======================== */
function updateProfileImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    const base64 = ev.target.result;
    localStorage.setItem('adminProfileImage', base64);
    loadProfileImage();
  }
  reader.readAsDataURL(file);
}
window.updateProfileImage = updateProfileImage;

function loadProfileImage() {
  const imgData = localStorage.getItem('adminProfileImage');
  if (imgData) {
    const avatars = document.querySelectorAll('.admin-avatar');
    avatars.forEach(av => {
      av.innerHTML = `<img src="${imgData}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProfileImage();
  const headers = document.querySelectorAll('.admin-profile');
  headers.forEach(h => {
    const avatar = h.querySelector('.admin-avatar');
    if (avatar) {
      avatar.style.cursor = 'pointer';
      avatar.title = 'Change Profile Picture';
      avatar.onclick = () => {
        let fileInput = document.getElementById('profile-upload-global');
        if (!fileInput) {
          fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.id = 'profile-upload-global';
          fileInput.accept = 'image/*';
          fileInput.style.display = 'none';
          fileInput.onchange = updateProfileImage;
          document.body.appendChild(fileInput);
        }
        fileInput.click();
      };
    }
  });
});

window.loadArtworks = loadArtworks;
window.loadOrders = loadOrders;
window.checkAuth = checkAuth;
window.logout = logout;
window.openModal = openModal;
window.closeModal = closeModal;
window.loadTestimonials = loadTestimonials;
window.editArtwork = editArtwork;
window.deleteArtwork = deleteArtwork;
window.deleteTestimonial = deleteTestimonial;
window.togglePasswordVisibility = togglePasswordVisibility;
window.openModalByIndex = openModalByIndex;
window.addAttributeField = addAttributeField;

function addAttributeField(key = "", value = "") {
  const container = document.getElementById("attributes-container");

  if (container.children.length >= 15) {
    showToast("Max 15 attributes allowed", "warning");
    return;
  }

  const div = document.createElement("div");
  div.className = "attr-row";

  div.innerHTML = `
    <input type="text" placeholder="Key" value="${key}">
    <input type="text" placeholder="Value" value="${value}">
    <button type="button" onclick="this.parentElement.remove()">❌</button>
  `;

  container.appendChild(div);
}
// New Exports
window.initTestimonialsPage = initTestimonialsPage;
window.openAboutModal = openAboutModal;
window.previewAboutImage = previewAboutImage;
window.handleAboutSubmit = handleAboutSubmit;
window.handleAgencySubmit = handleAgencySubmit;
window.editAgency = editAgency;
window.deleteAgency = deleteAgency;
window.openAddTestimonialModal = openAddTestimonialModal;
window.editTestimonial = editTestimonial;
window.handleTestimonialSubmit = handleTestimonialSubmit;

// ==============================
// 🏠 HOMEPAGE CMS
// ==============================
// ==============================
// 🏠 HOMEPAGE CMS (5-BOX GRID)
// ==============================
let selectedFiles = new Array(5).fill(null);
let currentFilenames = new Array(5).fill(null);

function initHeroGrid() {
  const grid = document.getElementById("heroUploadGrid");
  if (!grid) return;

  const UPLOAD_BASE = "http://13.233.50.44:5000/uploads/";
  grid.innerHTML = "";

  for (let i = 0; i < 5; i++) {
    const box = document.createElement("div");
    box.className = "upload-box";

    const previewContainer = document.createElement("div");
    previewContainer.className = "box-preview";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-btn";
    removeBtn.innerText = "×";
    removeBtn.onclick = () => removeHeroFile(i);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => handleHeroFileChange(i, e);

    let hasImage = false;

    // Fix preview priority: new upload takes precedence
    if (selectedFiles[i]) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(selectedFiles[i]);
      previewContainer.appendChild(img);
      hasImage = true;
    } else if (currentFilenames[i]) {
      const img = document.createElement("img");
      img.src = UPLOAD_BASE + currentFilenames[i];
      // Validate file existence
      img.onerror = () => {
        currentFilenames[i] = null; // Clear if missing on server
        img.remove();
        previewContainer.innerHTML = '<div class="placeholder">📷</div>';
        removeBtn.style.display = "none";
      };
      previewContainer.appendChild(img);
      hasImage = true;
    } else {
      previewContainer.innerHTML = '<div class="placeholder">📷</div>';
    }

    if (!hasImage) removeBtn.style.display = "none";

    box.appendChild(removeBtn);
    box.appendChild(previewContainer);
    box.appendChild(input);
    grid.appendChild(box);
  }
}

window.handleHeroFileChange = function (index, event) {
  const file = event.target.files[0];
  if (file) {
    selectedFiles[index] = file;
    initHeroGrid();
  }
};

window.removeHeroFile = function (index) {
  selectedFiles[index] = null;
  currentFilenames[index] = null;
  initHeroGrid();
};

async function loadHomepageCMS() {
  try {
    const res = await fetch("http://13.233.50.44:5000/api/homepage");
    if (!res.ok) throw new Error("Failed to fetch homepage data");
    const data = await res.json();

    if (data) {
      document.getElementById("hero-title").value = data.heroTitle || "";
      document.getElementById("hero-subtitle").value = data.heroSubtitle || "";

      // ✅ POPULATE COLORS
      const palette = data.heroColorPalette || "custom";
      const radios = document.getElementsByName("palette");
      radios.forEach(r => {
        r.checked = (r.value === palette);
      });

      document.getElementById("heroTitleColor").value = data.heroTitleColor || "#1a1a1a";
      document.getElementById("heroSubtitleColor").value = data.heroSubtitleColor || "#555555";

      // ✅ POPULATE TEXT STYLING
      document.getElementById("heroTitleSize").value = data.heroTitleSize || "48px";
      document.getElementById("heroSubtitleSize").value = data.heroSubtitleSize || "16px";

      // ✅ POPULATE FOOTER
      document.getElementById("footerTitle").value = data.footerTitle != null ? data.footerTitle : "";
      document.getElementById("footerDescription").value = data.footerDescription != null ? data.footerDescription : "";
      document.getElementById("footerTitleColor").value = data.footerTitleColor || "#333333";
      document.getElementById("footerDescColor").value = data.footerDescColor || "#555555";
      document.getElementById("footerTextColor").value = data.footerTextColor != null ? data.footerTextColor : "#333333";
      document.getElementById("footerFontSize").value = data.footerFontSize != null ? data.footerFontSize : "";

      const footerRadios = document.getElementsByName("footerPalette");
      const footerValue = (data.footerPalette || "custom").toLowerCase().trim();
      footerRadios.forEach(r => {
        r.checked = r.value === footerValue;
      });

      // ✅ POPULATE DIGITAL PRINTS
      document.getElementById("digitalPrintTitle").value = data.digitalPrintTitle || "";
      document.getElementById("digitalPrintDescription").value = data.digitalPrintDescription || "";
      document.getElementById("digitalPrintTitleSize").value = data.digitalPrintTitleSize || "";
      document.getElementById("digitalPrintDescSize").value = data.digitalPrintDescSize || "";
      document.getElementById("digitalPrintTitleColor").value = data.digitalPrintTitleColor || "#000000";
      document.getElementById("digitalPrintDescColor").value = data.digitalPrintDescColor || "#555555";
      document.getElementById("digitalPrintTextColor").value = data.digitalPrintTextColor || "#000000";

      const dpRadios = document.getElementsByName("digitalPalette");
      const dpValue = (data.digitalPrintPalette || "custom").toLowerCase().trim();
      dpRadios.forEach(r => {
        r.checked = r.value === dpValue;
      });

      // ✅ POPULATE PORTFOLIO (EXPLORE PAGE)
      document.getElementById("portfolioTitle").value = data.portfolioTitle || "";
      document.getElementById("portfolioSubtitle").value = data.portfolioSubtitle || "";
      document.getElementById("portfolioTitleColor").value = data.portfolioTitleColor || "#000000";
      document.getElementById("portfolioSubtitleColor").value = data.portfolioSubtitleColor || "#555555";
      document.getElementById("portfolioTitleSize").value = data.portfolioTitleSize || "48px";
      document.getElementById("portfolioSubtitleSize").value = data.portfolioSubtitleSize || "16px";
      
      const portfolioRadios = document.getElementsByName("portfolioPalette");
      portfolioRadios.forEach(r => {
        r.checked = (r.value === data.portfolioPalette);
      });

      // SHOW/HIDE CUSTOM PICKERS
      const customSection = document.getElementById("customColorSelectors");
      customSection.style.display = palette === "custom" ? "flex" : "none";

      // ADD CHANGE LISTENERS
      radios.forEach(r => {
        r.onchange = (e) => {
          customSection.style.display = e.target.value === "custom" ? "flex" : "none";
        };
      });

      // ✅ POPULATE EXISTING IMAGES
      if (data.heroImages && Array.isArray(data.heroImages)) {
        currentFilenames = [null, null, null, null, null];
        selectedFiles = [null, null, null, null, null];
        data.heroImages.forEach((img, i) => {
          if (i < 5) currentFilenames[i] = img;
        });
      }
    }
    initHeroGrid();
  } catch (err) {
    console.error("Error loading homepage CMS:", err);
  }
}

async function saveHomepageCMS(e) {
  e.preventDefault();

  try {
    // 1. UPLOAD NEW FILES (If any)
    const formData = new FormData();
    let hasNewFiles = false;

    selectedFiles.forEach(file => {
      if (file) {
        formData.append("heroImages", file);
        hasNewFiles = true;
      }
    });

    if (hasNewFiles) {
      const uploadRes = await fetch("http://13.233.50.44:5000/api/homepage/upload", {
        method: "POST",
        body: formData
      });

      if (!uploadRes.ok) throw new Error("Image upload failed");

      const uploadData = await uploadRes.json();
      const newFiles = uploadData.filenames || [];
      let newIndex = 0;

      // Map new filenames back to correct slots
      currentFilenames = currentFilenames.map((oldFile, index) => {
        if (selectedFiles[index]) {
          const newName = newFiles[newIndex++] || null;
          selectedFiles[index] = null; // Clear pending file
          return newName;
        }
        return oldFile;
      });
    }
    const finalHeroImages = currentFilenames.map(img => img || null);
    console.log("SENDING HERO IMAGES:", finalHeroImages);

    const heroPaletteInp = document.querySelector('input[name="palette"]:checked');
    const heroPalette = heroPaletteInp ? heroPaletteInp.value : undefined;

    const digitalPaletteInp = document.querySelector('input[name="digitalPalette"]:checked');
    const digitalPalette = digitalPaletteInp ? digitalPaletteInp.value : undefined;

    const footerPaletteInp = document.querySelector('input[name="footerPalette"]:checked');
    const footerPalette = footerPaletteInp ? footerPaletteInp.value : undefined;

    const portfolioPaletteInp = document.querySelector('input[name="portfolioPalette"]:checked');
    const portfolioPalette = portfolioPaletteInp ? portfolioPaletteInp.value : undefined;

    const updateData = {
      heroTitle: document.getElementById("hero-title").value,
      heroSubtitle: document.getElementById("hero-subtitle").value,
      heroImages: finalHeroImages,

      heroTitleColor: document.getElementById("heroTitleColor").value,
      heroSubtitleColor: document.getElementById("heroSubtitleColor").value,
      heroTitleSize: document.getElementById("heroTitleSize").value,
      heroSubtitleSize: document.getElementById("heroSubtitleSize").value,

      digitalPrintTitle: document.getElementById("digitalPrintTitle").value,
      digitalPrintDescription: document.getElementById("digitalPrintDescription").value,
      digitalPrintTitleSize: document.getElementById("digitalPrintTitleSize").value,
      digitalPrintDescSize: document.getElementById("digitalPrintDescSize").value,
      digitalPrintTitleColor: document.getElementById("digitalPrintTitleColor").value,
      digitalPrintDescColor: document.getElementById("digitalPrintDescColor").value,
      digitalPrintTextColor: document.getElementById("digitalPrintTextColor").value,

      footerTitle: document.getElementById("footerTitle").value,
      footerDescription: document.getElementById("footerDescription").value,
      footerTitleColor: document.getElementById("footerTitleColor").value,
      footerDescColor: document.getElementById("footerDescColor").value,
      footerTextColor: document.getElementById("footerTextColor").value,
      footerFontSize: document.getElementById("footerFontSize").value,

      portfolioTitle: document.getElementById("portfolioTitle")?.value || "",
      portfolioSubtitle: document.getElementById("portfolioSubtitle")?.value || "",
      portfolioTitleColor: document.getElementById("portfolioTitleColor")?.value || "#000000",
      portfolioSubtitleColor: document.getElementById("portfolioSubtitleColor")?.value || "#555555",
      portfolioTitleSize: document.getElementById("portfolioTitleSize")?.value || "48px",
      portfolioSubtitleSize: document.getElementById("portfolioSubtitleSize")?.value || "16px",
    };

    if (heroPalette !== undefined) updateData.heroColorPalette = heroPalette;
    if (digitalPalette !== undefined) updateData.digitalPrintPalette = digitalPalette;
    if (footerPalette !== undefined) updateData.footerPalette = footerPalette;
    if (portfolioPalette !== undefined) updateData.portfolioPalette = portfolioPalette;

    console.log("Saving CMS payload:", updateData);

    const updateRes = await fetch("http://13.233.50.44:5000/api/homepage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData)
    });

    if (!updateRes.ok) throw new Error("Database update failed");

    showToast("Homepage changes saved successfully! 🚀", "success");
    loadHomepageCMS(); // Reload to refresh state
  } catch (err) {
    console.error("[Homepage CMS] Save error:", err);
    showToast(err.message || "Network error during save ❌", "error");
  }
}

window.loadHomepageCMS = loadHomepageCMS;
window.saveHomepageCMS = saveHomepageCMS;

function changeCredentials(e) {
  e.preventDefault();

  const newUser = document.getElementById('new-username').value;
  const newPass = document.getElementById('new-password').value;

  if (!newUser || !newPass) {
    showToast("Fill all fields 😭", "warning");
    return;
  }

  localStorage.setItem('adminUser', newUser);
  localStorage.setItem('adminPass', newPass);

  showToast("Credentials updated 🔥", "success");

  e.target.reset();
}

window.changeCredentials = changeCredentials;

function toggleNewPassword() {
  const input = document.getElementById("new-password");
  const icon = document.querySelector(".toggle-password i");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

window.toggleNewPassword = toggleNewPassword;
