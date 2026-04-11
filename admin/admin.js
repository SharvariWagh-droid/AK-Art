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
        <img src="${a.image || 'pic/default.png'}">
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
// 💬 TESTIMONIALS (NOW DB)
// ======================================================

// LOAD TESTIMONIALS
async function loadTestimonials() {
  try {
    const res = await fetch("http://localhost:5000/api/testimonials");
    
    const text = await res.text();
    console.log("Raw Testimonial Admin Response:", text);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Invalid JSON from Testimonials API:", e);
      return;
    }

    const container = document.getElementById("testimonials-grid");
    if (!container) return;

    container.innerHTML = data.map(t => `
      <div class="testimonial-card">
        <p>"${t.message}"</p>
        <h4>${t.name}</h4>
        <div style="margin-top: 10px; display: flex; gap: 10px;">
          <button class="btn btn-danger btn-sm" onclick="deleteTestimonial('${t._id}')">Delete</button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    console.error("Error loading testimonials:", err);
  }
}

// ADD TESTIMONIAL
async function addTestimonial(e) {
  e.preventDefault();

  const name = document.getElementById("test-name").value;
  const message = document.getElementById("test-message").value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = "Processing...";
  }

  try {
    const res = await fetch("http://localhost:5000/api/testimonials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: name,
        message: message,
        image: "https://via.placeholder.com/300?text=Testimonial"
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to add testimonial");
    } else {
      alert("Testimonial added 💬✨");
      e.target.reset();
      loadTestimonials();
    }
  } catch (error) {
    console.error(error);
    alert("Error: " + error.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "Add Testimonial";
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
                  <img src="${a.image || 'pic/default.png'}" style="max-height:150px; border-radius:8px; object-fit:contain;">
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
window.addTestimonial = addTestimonial;
window.editArtwork = editArtwork;
window.deleteArtwork = deleteArtwork;
window.deleteTestimonial = deleteTestimonial;
window.togglePasswordVisibility = togglePasswordVisibility;