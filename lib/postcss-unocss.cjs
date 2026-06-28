// Shim so Next.js's PostCSS loader (which require()s plugins by name) gets the
// unocss function directly on module.exports, with .postcss === true intact.
// Next.js's createLazyPostCssPlugin checks result.postcss === true; the CJS
// @unocss/postcss package nests the function under exports.default, which
// breaks that check.
const { default: unocss } = require("@unocss/postcss");
module.exports = unocss;
