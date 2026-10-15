const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "../../public");
const frontendScript = path.join(publicDir, "frontend/script.js");
const adminScript = path.join(publicDir, "admin/admin.js");

/** The app scripts a page includes, in order (admin pages load /script.js before admin.js). */
function scriptsOf(html) {
  return [...html.matchAll(/<script[^>]*src="([^"]+)"/gi)]
    .map(([, src]) => (src.endsWith("admin.js") ? adminScript : src.endsWith("script.js") ? frontendScript : null))
    .filter(Boolean);
}

let added = [];
let intervals = [];
let restores = [];

/**
 * Opens one of the site's HTML pages the way a browser would: the page's markup, its address,
 * then its script, then DOMContentLoaded. Returns what the page did: navigations
 * (location.href = ...), alerts, and the fetch calls.
 *
 *   const page = await openPage("frontend/shop.html", { routes: { "GET /api/artworks": [...] } })
 */
async function openPage(file, { query = "", routes = {}, storage = {}, confirm = true, prompt = [] } = {}) {
  unloadPage(); // a previous page opened in the same test
  const html = fs.readFileSync(path.join(publicDir, file), "utf8");
  // Markup only: the page's <script> tags are not run (the app script is loaded below).
  document.documentElement.innerHTML = html.replace(/^[\s\S]*?<html[^>]*>/i, "").replace(/<\/html>[\s\S]*$/i, "").replace(/<script[\s\S]*?<\/script>/gi, "");

  const page = { navigations: [], alerts: [], fetch: null };
  setLocation(`/${file.split("/").map(encodeURIComponent).join("/")}${query}`, page);
  for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));

  window.alert = jest.fn((message) => page.alerts.push(message));
  window.confirm = jest.fn(() => confirm);
  const answers = [...prompt];
  window.prompt = jest.fn(() => answers.shift() ?? null);
  page.fetch = window.fetch = global.fetch = fakeFetch(routes);

  // Record every listener added to document/window while the page is open (including those added
  // later, in DOMContentLoaded), so unloadPage can remove them.
  for (const target of [document, window]) {
    const original = target.addEventListener;
    restores.push(() => (target.addEventListener = original));
    target.addEventListener = function (type, fn, opts) {
      added.push([target, type, fn, opts]);
      return original.call(this, type, fn, opts);
    };
  }
  const setInterval = window.setInterval;
  window.setInterval = (...args) => {
    const id = setInterval(...args);
    intervals.push(id);
    return id;
  };
  jest.isolateModules(() => {
    for (const script of scriptsOf(html)) require(script);
  });

  document.dispatchEvent(new Event("DOMContentLoaded"));
  // <body onload="..."> starts the admin pages.
  window.dispatchEvent(new Event("load"));
  await settle();
  return page;
}

/** A plain object for window.location that records where the page navigates. */
function setLocation(pathAndQuery, page) {
  const url = new URL(pathAndQuery, "http://localhost");
  delete window.location;
  window.location = {
    origin: url.origin,
    pathname: url.pathname,
    search: url.search,
    get href() {
      return url.href;
    },
    set href(value) {
      page.navigations.push(value);
    },
    assign: (value) => page.navigations.push(value),
    reload: jest.fn(),
  };
}

/**
 * fetch stand-in: "METHOD /path" (query string ignored, unless the key has one) mapped to a JSON
 * body, { status, body, contentType }, an Error to reject with, or a function returning one of
 * those. Unknown routes answer 404.
 */
function fakeFetch(routes) {
  return jest.fn(async (input, init = {}) => {
    const url = new URL(String(input), "http://localhost");
    const method = (init.method || "GET").toUpperCase();
    const keys = [`${method} ${url.pathname}${url.search}`, `${method} ${url.pathname}`, url.pathname];
    let route = keys.map((k) => routes[k]).find((r) => r !== undefined);
    if (typeof route === "function") route = await route(url, init);
    if (route instanceof Error) throw route;
    const isShaped = route && typeof route === "object" && !Array.isArray(route) && "status" in route;
    const status = isShaped ? route.status : route === undefined ? 404 : 200;
    const body = isShaped ? route.body : route === undefined ? { message: "not found" } : route;
    const contentType = (isShaped && route.contentType) || (typeof body === "string" ? "text/plain" : "application/json");
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : "Error",
      headers: { get: (name) => (name.toLowerCase() === "content-type" ? contentType : null) },
      json: async () => (typeof body === "string" ? JSON.parse(body) : body),
      text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    };
  });
}

/** The parsed JSON body of the n-th request with a body to a path. */
const sent = (page, pathname, n = 0) =>
  JSON.parse(page.fetch.mock.calls.filter(([u, init]) => String(u).split("?")[0] === pathname && init?.body)[n][1].body);

const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
};

function unloadPage() {
  // <body onload> sets window.onload, which outlives the page's markup.
  window.onload = null;
  for (const restore of restores) restore();
  restores = [];
  for (const [target, type, fn, opts] of added) target.removeEventListener(type, fn, opts);
  added = [];
  for (const id of intervals) clearInterval(id);
  intervals = [];
}

module.exports = { openPage, sent, settle, unloadPage };
