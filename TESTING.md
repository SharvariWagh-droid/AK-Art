# Testing

`backend/tests/` holds two Jest suites with their own `package.json`. Nothing in the app, its
`package.json`, its lockfile or its committed `node_modules` was changed.

| Suite | Tests | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|---:|
| Backend: `server.js`, routes, controllers, models | 50 | 97.5% | 91.7% | 97.9% | 99.8% |
| Browser: `public/frontend/script.js`, `public/admin/admin.js` | 82 | 97.1% | 83.9% | 98.8% | 98.3% |

20 of the 132 tests are known bugs.

```bash
cd backend/tests && npm ci              # test tooling (downloads MongoDB ~70 MB once)
npm test | npm run coverage | npm run bugs   # bugs: run the known-bug tests as normal tests
```

**Backend:** supertest against the real `server.js`, with an in-memory MongoDB (`mongodb-memory-server`) and Razorpay replaced; the real `.env` and database are never used. The files run one at a time, because they share `backend/uploads`. That folder is created for the run if missing, and every file the tests write is deleted afterwards.

**Browser:** each real HTML page is loaded into jsdom with its scripts, in the order the page lists them (admin pages load `/script.js`, then `admin.js`), with `fetch` answered in-test. A small test-only transform publishes each script's top-level functions as globals, as a classic `<script>` does. The uncovered branches are mostly defensive "if the element exists" checks.

**Missing dependency:** the committed `backend/node_modules` does not contain `jsonwebtoken`, which `package.json`, the lockfile and `adminController.js` require. So the server cannot start from the repository as committed; deployments must run `npm install`. The test package installs the locked version (9.0.3) and Jest falls back to it.

## Security findings — fix before anything else

| Severity | Where | Finding |
|---|---|---|
| Critical | `controllers/orderController.js` downloads | The file name from the URL is joined to the uploads path without checks: `GET /api/orders/download/..%2Fserver.js` returns the server's source (tested), and the same request can fetch `backend/.env`, with the database password, Razorpay secret and JWT secret. Rotate those secrets after fixing. |
| Critical | every admin route | The admin JWT is issued but **never checked**. Anyone can add, edit or delete artworks, testimonials, agencies, about and homepage content, upload files, and read every order (customers' names and emails). |
| Critical | `/api/admin/update` | No authentication: anyone can change the admin username and password. |
| Critical | `/api/admin/forgot-password`, `/api/auth/forgot-password` | The reset token is returned in the response, and the forgot-password pages redirect straight to the reset page with it. Anyone who knows an email (the default admin email is `admin@akart.com`) can reset that account's password. |
| High | `controllers/adminController.js` | When no admin exists, a username and password written in the code create one, and `JWT_SECRET` has a hard-coded fallback. |
| High | `/api/homepage/upload` | Any file type is accepted into `uploads/`, which is served as a website folder: an HTML or SVG file with script would be served from the site (stored XSS). |
| High | `public/frontend/script.js` | Artwork titles, descriptions, testimonials and about text are inserted into the page as HTML. Because anyone can write them through the unprotected API, anyone can put script on every visitor's page. |
| High | `/api/orders/create`, downloads | Orders are saved as "Paid" without checking the payment with Razorpay, and downloads need no proof of purchase (file names are public via `/api/artworks`). |
| High | shop profile panel | Every visitor's browser downloads all customers' orders (`/api/orders`) and filters them locally. |

## Known bugs

Each is a test of the correct behaviour that fails today (`test.failing`).

| Severity | Where | Bug |
|---|---|---|
| Critical | `/api/orders/download/:filename` | Path traversal (above). |
| Critical | `/api/admin/update`, artworks, orders | No admin authentication (above). |
| Critical | both forgot-password routes | Reset token returned to whoever asked (above). |
| High | `adminController.js` | The built-in admin credentials are accepted on an empty database. |
| High | `/api/homepage/upload` | Non-image files are accepted. |
| High | `/api/orders/create` | Orders are recorded as paid without verification. |
| High | downloads | No proof of purchase needed. |
| High | `script.js` | Titles are rendered as HTML (stored XSS). |
| High | `script.js` profile panel | Downloads every customer's orders. |
| High | `admin.js` homepage editor | Previews load from `/api/uploads/…` (the server serves `/uploads/…`); each failing preview empties its slot, so opening the editor and saving **deletes all existing hero images**. |
| Medium | admin pages | "Logged in" is only a `localStorage` flag anyone can set; `testimonials.html` does not even check it. |
| Medium | `script.js` register | After a successful registration the page checks whether the message contains "register"; "Registration successful" does not, so new users stay on the form. |
| Medium | `success.html` | Shows "Payment successful! Payment ID: …" for any id in its link, before verification. |
| Low | `/api/auth/login` | Failures answer 200 OK, and the message says whether the email has an account. |
| Low | `admin.js` | The artwork "View" button does nothing (it passes an artwork to `openModal`, which expects an element id). |
| Low | `script.js` shop | A print whose title has an apostrophe gets a broken "Buy Print" button. |

Also noted:
- **Prices:** print prices live in the description text (`"₹499"`) and the artwork `price` field is unused.
- **Dead code:** `displayArtDetails()` is never called, and no page has the `.close` element the modal code looks for.
- **Styling race:** the testimonial style settings also colour the about page's heading, so the about and testimonial settings race to style it.
- **Wrong toast text:** "Credentials updated Firebase!"
- **Committed dependencies:** `backend/node_modules` (1,536 files) is committed despite `.gitignore`. It is incomplete (see above).
