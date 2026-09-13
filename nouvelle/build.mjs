// Build de la nouvelle app : src/moteur.js + src/ui.jsx -> app.js
// Usage : node build.mjs   (depuis le dossier nouvelle/)
// Le numéro de version est mis à jour à chaque build pour vider le cache du téléphone.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const ici = path.dirname(fileURLToPath(import.meta.url));
// @babel/standalone est installé à la racine du dépôt
const require = createRequire(path.join(ici, "..", "package.json"));
const babel = require("@babel/standalone");

const moteur = fs.readFileSync(path.join(ici, "src", "moteur.js"), "utf8");
const ui = fs.readFileSync(path.join(ici, "src", "ui.jsx"), "utf8");
const source = moteur + "\n\n" + ui;

// runtime "classic" obligatoire : sinon Babel génère un `import` que Safari refuse
const out = babel.transform(source, { presets: [["react", { runtime: "classic" }]], compact: false }).code;
if (/^\s*(import|export)\s/m.test(out)) throw new Error("import/export résiduel dans app.js : Safari refuserait de démarrer");
fs.writeFileSync(path.join(ici, "app.js"), out);

const v = Date.now();
const htmlPath = path.join(ici, "index.html");
const html = fs.readFileSync(htmlPath, "utf8").replace(/\?v=\d+/g, "?v=" + v);
fs.writeFileSync(htmlPath, html);

console.log("app.js  :", out.length, "caractères");
console.log("version :", v);
