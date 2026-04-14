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
  var passwordInput = document.getElementById('password');
  var icon = document.getElementById('togglePasswordIcon');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
  } else {
    passwordInput.type = 'password';
  }
}

function handleLogin(e) {
  e.preventDefault();

  var username = document.getElementById('username').value;
  var password = document.getElementById('password').value;

  if (username === 'abhilasha' && password === 'admin123') {
    sessionStorage.setItem('adminLoggedIn', 'true');
    window.location.href = 'dashboard.html';
  } else {
    alert('Invalid credentials');
  }
}

function checkAuth() {
  if (sessionStorage.getItem('adminLoggedIn') !== 'true') {
    window.location.href = 'admin-login.html';
  }
}

function logout() {
  sessionStorage.removeItem('adminLoggedIn');
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

function getType() {
  const page = window.location.pathname.toLowerCase();

  if (page.includes("published-works")) return "book";
  if (page.includes("digital-prints")) return "print";

  return "art";
}

// LOAD
async function loadArtworks() {

  const type = getType();

  const res = await fetch(`http://localhost:5000/api/artworks?type=${type}`);
  let artworks = await res.json();
  
  // Apply filtering on the frontend
  artworks = artworks.filter(item => item.type === type);

var container =
  document.getElementById('artworks-grid') ||
  document.getElementById('prints-grid') ||
  document.getElementById('published-grid');

if (!container) return;

  container.innerHTML = artworks.map(a => {
    const safeTitle = a.title ? a.title.replace(/'/g, "\\'") : "";
    const safeDesc = a.description ? a.description.replace(/'/g, "\\'") : "";
    return `
    <div class="art-card">
      <div class="art-card-img">
        <img src="${a.image || ''}">
      </div>
      <div class="art-card-body">
        <h3>${a.title}</h3>
        <p>${a.description || ""}</p>
        <div style="margin-top: 10px; display: flex; gap: 10px;">
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
    alert("Upload image 😭");
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
      const res = await fetch("http://localhost:5000/api/artworks/add", {
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
      if (!res.ok) alert(data.error || "Failed to add art");
      else {
        alert("Artwork added 🎨");
        closeModal('add-art-modal');
        e.target.reset();
        loadArtworks();
      }
    } catch (error) {
      alert("Network error. Please try again.");
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
    alert("Upload image 😭");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function (ev) {
    const base64Image = ev.target.result;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "Processing...";
    }

    console.log("ADDING TYPE: print");

    try {
      const res = await fetch("http://localhost:5000/api/artworks/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: title,
          description: "₹" + price,
          image: base64Image,
          type: "print"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to add print");
      } else {
        alert("Print added 🔥");
        closeModal('add-print-modal');
        e.target.reset();
        loadArtworks();
      }
    } catch (error) {
      alert("Network error. Please try again.");
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
    alert("Upload image 😭");
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
      const res = await fetch("http://localhost:5000/api/artworks/add", {
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
        alert(data.error || "Failed to add book");
      } else {
        alert("Book added 📚✨");
        closeModal('add-pub-modal');
        e.target.reset();
        loadArtworks();
      }
    } catch (error) {
      alert("Network error. Please try again.");
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

  reader.onload = function(e) {
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
  loadAgencies();
  loadTestimonials();
}

// --- ABOUT ---

async function loadAbout() {
  try {
    const res = await fetch("http://localhost:5000/api/about");
    const data = await res.json();

    if (data && data.name) {
      document.getElementById("about-name-display").innerText = data.name;
      document.getElementById("about-bio-display").innerText = data.bio;
      if (data.image) {
        document.getElementById("about-img-preview").src = data.image;
        document.getElementById("about-img-preview").style.display = "block";
      } else {
        document.getElementById("about-img-preview").style.display = "none";
      }

      
      const worksList = document.getElementById("about-works-display");
      worksList.innerHTML = (data.publishedWorks || []).map(w => {
        const parts = w.split("(");
        const title = parts[0];
        const rest = parts[1] ? "(" + parts[1] : "";
        return `
          <li>
            <a href="#" class="work-link">${title.trim()}</a><br>
            <span class="work-meta">${rest}</span>
          </li>
        `;
      }).join("");
      
      // Hidden data for modal
      document.getElementById("about-name").value = data.name;
      document.getElementById("about-bio").value = data.bio;
      document.getElementById("about-image-data").value = data.image || "";
      document.getElementById("about-works").value = (data.publishedWorks || []).join(", ");
      if(data.image) {
        document.getElementById("about-modal-preview").src = data.image;
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
  reader.onload = function(ev) {
    const base64 = ev.target.result;
    document.getElementById("about-image-data").value = base64;
    const preview = document.getElementById("about-modal-preview");
    preview.src = base64;
    preview.style.display = "block";
  }
  reader.readAsDataURL(file);
}

async function handleAboutSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  const name = document.getElementById("about-name").value;
  const bio = document.getElementById("about-bio").value;
  const image = document.getElementById("about-image-data").value;
  const publishedWorks = document.getElementById("about-works").value.split(",").map(w => w.trim()).filter(w => w !== "");

  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = "Saving..."; }

  try {
    const res = await fetch("http://localhost:5000/api/about", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, image, publishedWorks })
    });

    if (res.ok) {
      alert("About section updated! ✨");
      closeModal("about-modal");
      loadAbout();
    } else {
      const data = await res.json();
      alert(data.error || "Update failed");
    }
  } catch (err) {
    alert("Network Error");
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = "Save Changes"; }
  }
}

// --- AGENCIES ---

async function loadAgencies() {
  try {
    const res = await fetch("http://localhost:5000/api/agencies");
    const data = await res.json();
    const list = document.getElementById("agencies-list");
    if(!list) return;

    list.innerHTML = data.map(a => `
      <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
        <span>${a.name}</span>
        <div>
          <button class="btn btn-primary btn-sm" onclick="editAgency('${a._id}', '${a.name}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteAgency('${a._id}')">Delete</button>
        </div>
      </li>
    `).join("");
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
  const url = id ? `http://localhost:5000/api/agencies/${id}` : "http://localhost:5000/api/agencies";

  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = "Processing..."; }

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    if (res.ok) {
      alert(`Agency ${id ? 'updated' : 'added'}!`);
      closeModal("add-agency-modal");
      e.target.reset();
      document.getElementById("agency-id").value = "";
      loadAgencies();
    } else {
      const data = await res.json();
      alert(data.error || "Operation failed");
    }
  } catch (err) {
    alert("Network Error");
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = "Save Agency"; }
  }
}

async function deleteAgency(id) {
  if (!confirm("Remove this agency?")) return;
  try {
    const res = await fetch(`http://localhost:5000/api/agencies/${id}`, { method: "DELETE" });
    if (res.ok) loadAgencies();
  } catch (err) { alert("Network Error"); }
}

// --- TESTIMONIALS ---

async function loadTestimonials() {
  try {
    const res = await fetch("http://localhost:5000/api/testimonials");
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
  const url = id ? `http://localhost:5000/api/testimonials/${id}` : "http://localhost:5000/api/testimonials";

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
      alert(`Testimonial ${id ? 'updated' : 'added'} 💬✨`);
      closeModal("testimonial-modal");
      loadTestimonials();
    } else {
      const data = await res.json();
      alert(data.error || "Operation failed");
    }
  } catch (error) {
    alert("Network Error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "Save Testimonial";
    }
  }
}

// ======================================================
// 📦 ORDERS (DB)
// ======================================================

async function loadOrders() {
  try {
    const res = await fetch("http://localhost:5000/api/orders");
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
    const res = await fetch(`http://localhost:5000/api/artworks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, description: newDesc })
    });
    
    if (res.ok) {
      loadArtworks();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to edit artwork");
    }
  } catch (err) {
    alert("Network Error");
  }
}

async function deleteArtwork(id) {
  if (!confirm("Are you sure you want to delete this artwork?")) return;

  try {
    const res = await fetch(`http://localhost:5000/api/artworks/${id}`, {
      method: "DELETE"
    });
    
    if (res.ok) {
      loadArtworks();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete artwork");
    }
  } catch (err) {
    alert("Network Error");
  }
}

async function deleteTestimonial(id) {
  if (!confirm("Are you sure you want to delete this testimonial?")) return;

  try {
    const res = await fetch(`http://localhost:5000/api/testimonials/${id}`, {
      method: "DELETE"
    });
    
    if (res.ok) {
      loadTestimonials();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete testimonial");
    }
  } catch (err) {
    alert("Network Error");
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
            fetch('http://localhost:5000/api/artworks'),
            fetch('http://localhost:5000/api/orders')
        ]);
        const artworks = await artRes.json();
        const orders = await ordersRes.json();

        const prints = artworks.filter(a => a.type === 'print');
        
        const elArt = document.getElementById('dash-total-art');
        const elPrint = document.getElementById('dash-total-prints');
        const elOrd = document.getElementById('dash-total-orders');
        
        if(elArt) elArt.textContent = artworks.length;
        if(elPrint) elPrint.textContent = prints.length;
        if(elOrd) elOrd.textContent = orders.length;

        // Recent artworks
        const dashArtGrid = document.getElementById('dash-recent-art');
        if (dashArtGrid) {
            const recentArt = artworks.slice(-3).reverse(); // get last 3
            dashArtGrid.innerHTML = recentArt.map(a => `
              <div class="art-card">
                <div class="art-card-img" style="background:#f4f6ff; padding:10px; display:flex; justify-content:center; align-items:center;">
                  <img src="${a.image || ''}" style="max-height:150px; border-radius:8px; object-fit:contain;">
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
    } catch(err) {
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
  reader.onload = function(ev) {
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
       if(avatar) {
           avatar.style.cursor = 'pointer';
           avatar.title = 'Change Profile Picture';
           avatar.onclick = () => {
              let fileInput = document.getElementById('profile-upload-global');
              if(!fileInput) {
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
let selectedFiles = [null, null, null, null, null];

function initHeroGrid() {
  const grid = document.getElementById("heroUploadGrid");
  if (!grid) return;

  const UPLOAD_BASE = "http://localhost:5000/uploads/";

  grid.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const box = document.createElement("div");
    box.className = "upload-box";
    box.dataset.index = i;

    // Build box content
    let previewHTML = `<div class="placeholder">📷</div>`;
    
    if (selectedFiles[i]) {
      let src = "";
      if (typeof selectedFiles[i] === "string") {
        // Existing image from server
        src = UPLOAD_BASE + selectedFiles[i];
      } else {
        // New file selected locally
        src = URL.createObjectURL(selectedFiles[i]);
      }
      previewHTML = `<img src="${src}" />`;
    }

    box.innerHTML = `
      ${selectedFiles[i] ? `<button type="button" class="remove-btn" onclick="removeHeroFile(${i})">×</button>` : ""}
      <div class="box-preview">${previewHTML}</div>
      <input type="file" accept="image/*" onchange="handleHeroFileChange(${i}, event)">
    `;
    grid.appendChild(box);
  }
}

window.handleHeroFileChange = function(index, event) {
  const file = event.target.files[0];
  if (file) {
    selectedFiles[index] = file;
    initHeroGrid();
  }
};

window.removeHeroFile = function(index) {
  selectedFiles[index] = null;
  initHeroGrid();
};

async function loadHomepageCMS() {
  try {
    const res = await fetch("http://localhost:5000/api/homepage");
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
      document.getElementById("heroTitleFont").value = data.heroTitleFont || "Poppins";
      document.getElementById("heroSubtitleFont").value = data.heroSubtitleFont || "Poppins";
      
      // ✅ POPULATE FOOTER
      document.getElementById("footerTitle").value = data.footerTitle != null ? data.footerTitle : "";
      document.getElementById("footerDescription").value = data.footerDescription != null ? data.footerDescription : "";
      document.getElementById("footerTextColor").value = data.footerTextColor != null ? data.footerTextColor : "#333333";
      document.getElementById("footerFontSize").value = data.footerFontSize != null ? data.footerFontSize : "";
      document.getElementById("footerFontFamily").value = data.footerFontFamily != null ? data.footerFontFamily : "Poppins";

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
        selectedFiles = [null, null, null, null, null]; // Reset
        data.heroImages.forEach((img, i) => {
          if (i < 5) selectedFiles[i] = img; // Store filename string
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
    // 1. GATHER NEW FILES vs EXISTING FILENAMES
    const newFiles = [];
    const indexMapping = []; // track which new file belongs to which slot

    selectedFiles.forEach((item, i) => {
      if (item && typeof item !== "string") {
        newFiles.push(item);
        indexMapping.push(i);
      }
    });

    let currentFilenames = [...selectedFiles];

    // 2. UPLOAD NEW FILES (If any)
    if (newFiles.length > 0) {
      const formData = new FormData();
      newFiles.forEach(file => formData.append("heroImages", file));

      const uploadRes = await fetch("http://localhost:5000/api/homepage/upload", {
        method: "POST",
        body: formData
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error || "Image upload failed");
      }

      const uploadData = await uploadRes.json();
      const newSavedNames = uploadData.files || [];

      // Update the mapping with the real filenames from the server
      newSavedNames.forEach((name, i) => {
        const targetIndex = indexMapping[i];
        currentFilenames[targetIndex] = name;
      });
    }

    // 3. DO FINAL UPDATE (TEXT + ALL FILENAMES)
    // Filter out nulls to get the clean array
    const finalHeroImages = currentFilenames.filter(f => f !== null);

    const updateData = {
        heroTitle: document.getElementById("hero-title").value,
        heroSubtitle: document.getElementById("hero-subtitle").value,
        heroImages: finalHeroImages,
        heroColorPalette: document.querySelector('input[name="palette"]:checked')?.value || "custom",
        heroTitleColor: document.getElementById("heroTitleColor").value,
        heroSubtitleColor: document.getElementById("heroSubtitleColor").value,
        heroTitleSize: document.getElementById("heroTitleSize").value,
        heroSubtitleSize: document.getElementById("heroSubtitleSize").value,
        heroTitleFont: document.getElementById("heroTitleFont").value,
        heroSubtitleFont: document.getElementById("heroSubtitleFont").value,
        footerTitle: document.getElementById("footerTitle").value,
        footerDescription: document.getElementById("footerDescription").value,
        footerTextColor: document.getElementById("footerTextColor").value,
        footerFontSize: document.getElementById("footerFontSize").value,
        footerFontFamily: document.getElementById("footerFontFamily").value
    };

    const updateRes = await fetch("http://localhost:5000/api/homepage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData)
    });

    if (!updateRes.ok) throw new Error("Database update failed");

    alert("Homepage changes saved successfully! 🚀");
    loadHomepageCMS(); // Reload to refresh state
  } catch (err) {
    console.error("[Homepage CMS] Save error:", err);
    alert(err.message || "Network error during save");
  }
}

window.loadHomepageCMS = loadHomepageCMS;
window.saveHomepageCMS = saveHomepageCMS;
