// Sécurité des données : une sauvegarde illisible ne doit JAMAIS être écrasée.
// Usage : node check-donnees.mjs   (sort en erreur si un cas régresse)
// Contexte : avant août 2026, un JSON tronqué était remplacé par le seed au
// démarrage — des mois de carnet disparaissaient sans un mot.
import fs from "fs";
import { JSDOM } from "jsdom";

const html = fs.readFileSync("index.html", "utf8");
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

function monter(seed) {
  const dom = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://yakupovic.github.io/plateau/" });
  const w = dom.window;
  const errs = [];
  w.onerror = (m) => errs.push(String(m));
  w.HTMLCanvasElement.prototype.getContext = () => null;
  w.confirm = () => false;
  w.alert = () => {};
  if (seed !== undefined) w.localStorage.setItem("pl:plateau-data", seed);
  w.eval(inline[0]);
  w.eval(fs.readFileSync("react.js", "utf8"));
  w.eval(fs.readFileSync("react-dom.js", "utf8"));
  w.eval(fs.readFileSync("app.js", "utf8"));
  return new Promise((r) => setTimeout(() => r({ w, errs }), 2500));
}

const aQuarantaine = (w) => {
  for (let i = 0; i < w.localStorage.length; i++) {
    if (String(w.localStorage.key(i)).indexOf("pl:plateau-data-abime-") === 0) return true;
  }
  return false;
};

const CAS = [
  { nom: "JSON tronque (ecriture coupee)", val: '{"seances":[{"id":"a1","date":"2026-08-01","nom":"Pecs","exos":[{"nom":"Developpe' },
  { nom: "JSON valide mais forme invalide (null)", val: "null" },
  { nom: "objet sans tableau seances", val: '{"prochaine":null}' },
  { nom: "contenu non-JSON", val: "  pas du json du tout" },
  { nom: "tableau au lieu d'un objet", val: "[1,2,3]" },
];

let ko = 0;

for (const cas of CAS) {
  const { w, errs } = await monter(cas.val);
  const txt = w.document.getElementById("root").textContent;
  const ecran = txt.includes("Tes données n'ont pas pu être lues");
  const intact = w.localStorage.getItem("pl:plateau-data") === cas.val;
  const quarantaine = aQuarantaine(w);
  const ok = ecran && intact && quarantaine && errs.length === 0;
  if (!ok) ko++;
  console.log((ok ? "  OK    " : "  ECHEC ") + cas.nom);
  console.log("          ecran recup:" + ecran + "  origine intacte:" + intact + "  quarantaine:" + quarantaine + "  erreursJS:" + errs.length);
}

const bon = JSON.stringify({ seances: [], prochaine: null });
const r1 = await monter(bon);
const t1 = r1.w.document.getElementById("root").textContent;
const normal = t1.includes("Démarrer une séance") && !t1.includes("n'ont pas pu être lues");
if (!normal) ko++;
console.log((normal ? "  OK    " : "  ECHEC ") + "donnees saines : demarrage normal (erreursJS:" + r1.errs.length + ")");

const r2 = await monter(undefined);
const t2 = r2.w.document.getElementById("root").textContent;
const okV = t2.includes("Démarrer une séance") && !!r2.w.localStorage.getItem("pl:plateau-data");
if (!okV) ko++;
console.log((okV ? "  OK    " : "  ECHEC ") + "premier lancement : seed pose (erreursJS:" + r2.errs.length + ")");

console.log("");
console.log(ko === 0 ? "TOUS LES CAS PASSENT" : ko + " CAS EN ECHEC");
process.exit(ko === 0 ? 0 : 1);
