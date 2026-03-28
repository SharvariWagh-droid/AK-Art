
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


// ===== STORAGE HELPERS =====
function getData(key, defaults) {
  var data = localStorage.getItem('admin_' + key);
  return data ? JSON.parse(data) : defaults;
}

function setData(key, value) {
  localStorage.setItem('admin_' + key, JSON.stringify(value));
}



var defaultArtworks = [
  { id: 1, title: 'Midnight Garden', desc: 'Watercolor', img: '/frontend/Personal work/Artwork10.png' },
  { id: 2, title: 'Midnight Garden', desc: 'Illustration', img: '/frontend/Personal work/Artwork2.png' },
  { id: 3, title: 'Waiting', desc: 'Mixed Media', img: '../frontend/Personal work/Artwork17.png' }
];

function renderArtworks() {

  var container = document.getElementById('artworks-grid');
  if (!container) return;

  var artworks = getData('artworks', defaultArtworks);

  container.innerHTML = artworks.map(function (a) {

    return `
    <div class="art-card">

      <div class="art-card-img">
      <img src="${a.img}" alt="${a.title}" onclick="viewArt(${a.id})">
      </div>

      <div class="art-card-body">
        <h3>${a.title}</h3>
        <p>${a.desc}</p>

        <div class="art-card-actions">
          <button class="btn btn-primary btn-sm" onclick="editArt(${a.id})">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteArt(${a.id})">🗑️ Delete</button>
        </div>

      </div>

    </div>
    `;

  }).join('');

}

function addArt(e) {

  e.preventDefault();

  var artworks = getData('artworks', defaultArtworks);

  var newArt = {
    id: Date.now(),
    title: document.getElementById('art-title').value,
    desc: document.getElementById('art-desc').value,
    img: ''
  };

  var fileInput = document.getElementById('art-image');

  if (fileInput.files[0]) {

    var reader = new FileReader();

    reader.onload = function (ev) {

      newArt.img = ev.target.result;

      artworks.push(newArt);

      setData('artworks', artworks);

      closeModal('add-art-modal');

      e.target.reset();

      renderArtworks();
    };

    reader.readAsDataURL(fileInput.files[0]);

  }

}

function deleteArt(id) {

  if (!confirm('Delete artwork?')) return;

  var artworks = getData('artworks', defaultArtworks);

  artworks = artworks.filter(a => a.id !== id);

  setData('artworks', artworks);

  renderArtworks();
}

function editArt(id) {

  var artworks = getData('artworks', defaultArtworks);

  var art = artworks.find(a => a.id === id);

  if (!art) return;

  var newTitle = prompt('Title', art.title);
  if (newTitle === null) return;

  var newDesc = prompt('Description', art.desc);
  if (newDesc === null) return;

  art.title = newTitle;
  art.desc = newDesc;

  setData('artworks', artworks);

  renderArtworks();
}



// ======================================================
// PUBLISHED WORKS
// ======================================================
// ======================================================
// PUBLISHED WORKS
// ======================================================

// default works (first load)
var defaultPublished = [
  {
    id: 1,
    title: "Storybook Dreams",
    publisher: "Penguin Kids",
    year: "2023",
    img: "../frontend/Personal work/Artwork3.png"
  },
  {
    id: 2,
    title: "Moonlight Tales",
    publisher: "HarperCollins",
    year: "2022",
    img: "../frontend/Personal work/Artwork4.png"
  }
];


// ======================
// RENDER WORKS
// ======================
function renderPublished() {

  var container = document.getElementById("published-grid");
  if (!container) return;

  var works = getData("published", defaultPublished);

  container.innerHTML = works.map(function (w) {

    return `
      <div class="art-card">

        <div class="art-card-img">
          <img src="${w.img}" alt="${w.title}">
        </div>

        <div class="art-card-body">
          <h3>${w.title}</h3>
          <p>${w.publisher} • ${w.year}</p>

          <div class="art-card-actions">
            <button class="btn btn-primary btn-sm" onclick="editPublished(${w.id})">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deletePublished(${w.id})">🗑️ Delete</button>
          </div>

        </div>

      </div>
    `;

  }).join("");

}


// ======================
// ADD WORK
// ======================
function addPublished(e) {

  e.preventDefault();

  var works = getData("published", defaultPublished);

  var title = document.getElementById("pub-title").value;
  var publisher = document.getElementById("pub-publisher").value;
  var year = document.getElementById("pub-year").value;
  var fileInput = document.getElementById("pub-image");

  if (!fileInput.files[0]) {
    alert("Please upload an image");
    return;
  }

  var reader = new FileReader();

  reader.onload = function (event) {

    var newWork = {
      id: Date.now(),
      title: title,
      publisher: publisher,
      year: year,
      img: event.target.result
    };

    works.push(newWork);

    setData("published", works);

    closeModal("add-pub-modal");

    e.target.reset();

    renderPublished();
  };

  reader.readAsDataURL(fileInput.files[0]);
}


// ======================
// DELETE WORK
// ======================
function deletePublished(id) {

  if (!confirm("Delete work?")) return;

  var works = getData("published", defaultPublished);

  works = works.filter(function (w) {
    return w.id !== id;
  });

  setData("published", works);

  renderPublished();
}


// ======================
// EDIT WORK
// ======================
function editPublished(id) {

  var works = getData("published", defaultPublished);

  var w = works.find(function (x) {
    return x.id === id;
  });

  if (!w) return;

  var newTitle = prompt("Edit Title", w.title);
  if (newTitle === null) return;

  var newPublisher = prompt("Edit Publisher", w.publisher);
  if (newPublisher === null) return;

  var newYear = prompt("Edit Year", w.year);
  if (newYear === null) return;

  w.title = newTitle;
  w.publisher = newPublisher;
  w.year = newYear;

  setData("published", works);

  renderPublished();
}
// ======================================================
// DIGITAL PRINTS
// ======================================================

// default prints (first load only)
var defaultPrints = [
  { id: 1, title: "Dreamscape", price: 499, img: "../frontend/Personal work/Artwork6.png" },
  { id: 2, title: "Moon Garden", price: 699, img: "../frontend/Personal work/Artwork7.png" }
];


// ======================
// RENDER PRINTS
// ======================
function renderPrints() {

  var container = document.getElementById("prints-grid");
  if (!container) return;

  var prints = getData("prints", defaultPrints);

  container.innerHTML = prints.map(function (p) {
    return `
      <div class="art-card">

        <div class="art-card-img">
          <img src="${p.img}" alt="${p.title}">
        </div>

        <div class="art-card-body">
          <h3>${p.title}</h3>

          <p class="price-tag">
            ₹${Number(p.price).toLocaleString("en-IN")}
          </p>

          <div class="art-card-actions">
            <button class="btn btn-primary btn-sm" onclick="editPrint(${p.id})">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deletePrint(${p.id})">🗑️ Delete</button>
          </div>

        </div>

      </div>
    `;
  }).join("");
}


// ======================
// ADD PRINT
// ======================
function addPrint(e) {

  e.preventDefault();

  var prints = getData("prints", defaultPrints);

  var title = document.getElementById("print-title").value;
  var price = document.getElementById("print-price").value;
  var fileInput = document.getElementById("print-image");

  if (!fileInput.files[0]) {
    alert("Please upload an image");
    return;
  }

  var reader = new FileReader();

  reader.onload = function (ev) {

    var newPrint = {
      id: Date.now(),
      title: title,
      price: Number(price),
      img: ev.target.result
    };

    prints.push(newPrint);

    setData("prints", prints);

    closeModal("add-print-modal");

    e.target.reset();

    renderPrints();
  };

  reader.readAsDataURL(fileInput.files[0]);
}


// ======================
// DELETE PRINT
// ======================
function deletePrint(id) {

  if (!confirm("Delete this print?")) return;

  var prints = getData("prints", defaultPrints);

  prints = prints.filter(function (p) {
    return p.id !== id;
  });

  setData("prints", prints);

  renderPrints();
}


// ======================
// EDIT PRINT
// ======================
function editPrint(id) {

  var prints = getData("prints", defaultPrints);

  var p = prints.find(function (x) {
    return x.id === id;
  });

  if (!p) return;

  var newTitle = prompt("Edit Title", p.title);
  if (newTitle === null) return;

  var newPrice = prompt("Edit Price (in ₹)", p.price);
  if (newPrice === null) return;

  p.title = newTitle;
  p.price = Number(newPrice);

  setData("prints", prints);

  renderPrints();
}

/* ===============================
   TESTIMONIALS SYSTEM
================================ */

var defaultTestimonials = [
  {
    id: 1,
    name: "Ananya Mehta",
    message: "Working with Abhilasha was a beautiful experience. Her illustrations brought warmth and personality to every page of my book."
  },
  {
    id: 2,
    name: "Rahul Sharma",
    message: "Abhilasha’s art style is expressive and emotional. She transforms ideas into stunning visual storytelling."
  }
];


/* Render testimonials */
function renderTestimonials() {

  var container = document.getElementById("testimonials-grid");
  if (!container) return;

  var tests = JSON.parse(localStorage.getItem("testimonials")) || defaultTestimonials;

  container.innerHTML = tests.map(function (t) {

    return `
<div class="testimonial-card">

<p class="testimonial-message">"${t.message}"</p>

<h4 class="testimonial-name">— ${t.name}</h4>

<div class="art-card-actions">
<button onclick="deleteTestimonial(${t.id})">🗑️</button>
</div>

</div>
`;

  }).join("");

}


/* Add testimonial */

function addTestimonial(e) {

  e.preventDefault();

  var tests = JSON.parse(localStorage.getItem("testimonials")) || defaultTestimonials;

  var newTest = {

    id: Date.now(),
    name: document.getElementById("test-name").value,
    message: document.getElementById("test-message").value

  };

  tests.push(newTest);

  localStorage.setItem("testimonials", JSON.stringify(tests));

  renderTestimonials();

  document.getElementById("testimonial-form").reset();

  closeModal("add-test-modal");

}


/* Delete testimonial */

function deleteTestimonial(id) {

  if (!confirm("Delete testimonial?")) return;

  var tests = JSON.parse(localStorage.getItem("testimonials")) || defaultTestimonials;

  tests = tests.filter(function (t) {
    return t.id !== id;
  });

  localStorage.setItem("testimonials", JSON.stringify(tests));

  renderTestimonials();

}
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

loadOrders();