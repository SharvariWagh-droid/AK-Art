// The site's browser scripts are classic <script>s: their top-level functions are globals that
// other scripts and onclick="" attributes call (admin pages load /script.js, then admin.js).
// Jest loads files as modules, so this appends one line publishing those functions on the global
// object, then hands the code to babel-jest (which adds coverage counters). Line numbers of the
// original code are unchanged.
const babelJest = require("babel-jest").default.createTransformer();

const withGlobals = (src) => {
  const names = [...src.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  return `${src}\n;Object.assign(globalThis, { ${names.join(", ")} });\n`;
};

module.exports = {
  process(src, filename, options) {
    return babelJest.process(withGlobals(src), filename, options);
  },
  getCacheKey(src, filename, options) {
    return babelJest.getCacheKey(withGlobals(src), filename, options);
  },
};
