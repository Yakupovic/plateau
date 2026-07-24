// Test de fumée : monte réellement l'app dans un DOM simulé avant de déployer.
// Usage : node check.mjs   --> sort en erreur si l'app ne s'affiche pas.
import fs from "fs";
import { JSDOM } from "jsdom";

const html = fs.readFileSync("index.html", "utf8");
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const dom = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://yakupovic.github.io/plateau/" });
const w = dom.window;
const errs = [];
w.onerror = (m) => errs.push(String(m));
w.HTMLCanvasElement.prototype.getContext = () => null;
w.confirm = () => false;

w.eval(inline[0]); // shim window.storage
w.eval(fs.readFileSync("react.js", "utf8"));
w.eval(fs.readFileSync("react-dom.js", "utf8"));
w.eval(fs.readFileSync("app.js", "utf8"));

setTimeout(() => {
  const txt = w.document.getElementById("root").textContent;
  const monte = txt.includes("Démarrer une séance");
  const storageOk = !txt.includes("Stockage inaccessible");
  const persist = !!w.localStorage.getItem("pl:plateau-data");
  console.log("app montée      :", monte ? "OK" : "ECHEC");
  console.log("stockage        :", storageOk ? "OK" : "ECHEC");
  console.log("données écrites :", persist ? "OK" : "ECHEC");
  console.log("erreurs JS      :", errs.length);
  if (errs.length) console.log(errs.slice(0, 3));
  process.exit(monte && storageOk && persist && !errs.length ? 0 : 1);
}, 2500);
