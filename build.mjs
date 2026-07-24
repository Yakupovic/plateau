// Build PLATEAU : src/app.jsx --> app.js (JS pur) + app.css (Tailwind purgé)
// Usage : node build.mjs        (ajoute --bump pour invalider le cache navigateur)
import fs from "fs";
import { execSync } from "child_process";
import babel from "@babel/standalone";

const src = fs.readFileSync("src/app.jsx", "utf8");

// runtime "classic" obligatoire : sans ça Babel génère un `import` que Safari refuse
const out = babel.transform(src, { presets: [["react", { runtime: "classic" }]] }).code;
if (/^import /m.test(out)) throw new Error("import residuel dans le bundle");
fs.writeFileSync("app.js", out);
console.log("app.js  :", out.length, "chars");

execSync("npx tailwindcss -c tailwind.config.js -i src/tw.css -o app.css --minify", { stdio: "inherit" });
console.log("app.css :", fs.statSync("app.css").size, "octets");

if (process.argv.includes("--bump")) {
  const v = Date.now();
  let html = fs.readFileSync("index.html", "utf8");
  const old = html.match(/app\.js\?v=(\d+)/)[1];
  fs.writeFileSync("index.html", html.replaceAll(`?v=${old}`, `?v=${v}`));
  let sw = fs.readFileSync("sw.js", "utf8");
  fs.writeFileSync("sw.js", sw.replaceAll(`?v=${old}`, `?v=${v}`).replace(`plateau-v${old}`, `plateau-v${v}`));
  console.log("version :", old, "->", v);
}
