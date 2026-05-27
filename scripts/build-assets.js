const fs = require("node:fs");
const path = require("node:path");
const CleanCSS = require("clean-css");
const { minify } = require("terser");

const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "index.html");
const cssPath = path.join(root, "src", "critical.css");
const appPath = path.join(root, "src", "app.js");
const appMinPath = path.join(root, "src", "app.min.js");

function replaceStyle(html, css) {
  return html.replace(/<style>[\s\S]*?<\/style>/, "<style>" + css + "</style>");
}

async function main() {
  const css = fs.readFileSync(cssPath, "utf8");
  const minifiedCss = new CleanCSS({ level: 2 }).minify(css);
  if (minifiedCss.errors.length) {
    throw new Error(minifiedCss.errors.join("\n"));
  }

  const app = fs.readFileSync(appPath, "utf8");
  const minifiedApp = await minify(app, {
    compress: {
      passes: 2
    },
    format: {
      comments: false
    },
    mangle: true
  });
  if (!minifiedApp.code) throw new Error("Terser did not produce app code");

  fs.writeFileSync(appMinPath, minifiedApp.code + "\n");

  const html = fs.readFileSync(indexPath, "utf8");
  fs.writeFileSync(indexPath, replaceStyle(html, minifiedCss.styles));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
