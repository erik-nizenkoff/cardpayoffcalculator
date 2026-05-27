const fs = require("node:fs");
const path = require("node:path");
const CleanCSS = require("clean-css");
const { minify } = require("terser");

const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "index.html");
const cssPath = path.join(root, "src", "critical.css");
const appPath = path.join(root, "src", "app.js");
const appMinPath = path.join(root, "src", "app.min.js");
const publicDir = path.join(root, "public");

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
  const builtHtml = replaceStyle(html, minifiedCss.styles);
  fs.writeFileSync(indexPath, builtHtml);

  fs.rmSync(publicDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(publicDir, "src"), { recursive: true });
  fs.writeFileSync(path.join(publicDir, "index.html"), builtHtml);
  fs.copyFileSync(path.join(root, "privacy.html"), path.join(publicDir, "privacy.html"));
  fs.copyFileSync(path.join(root, "robots.txt"), path.join(publicDir, "robots.txt"));
  fs.copyFileSync(path.join(root, "sitemap.xml"), path.join(publicDir, "sitemap.xml"));
  fs.copyFileSync(path.join(root, "favicon.ico"), path.join(publicDir, "favicon.ico"));
  fs.copyFileSync(appMinPath, path.join(publicDir, "src", "app.min.js"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
