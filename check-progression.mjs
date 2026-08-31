// Logique de progression : 1RM estimé, cycle de déload, détection de plateau.
// Usage : node check-progression.mjs
// Les fonctions sont extraites de src/app.jsx par équilibrage de délimiteurs :
// pas de dépendance de test, pas de hook de test dans le code livré.
import fs from "fs";

const src = fs.readFileSync("src/app.jsx", "utf8");

// Extrait une declaration `const NAME = ...;` de haut niveau, en equilibrant les delimiteurs.
function extraire(nom) {
  const re = new RegExp("^const " + nom + " = ", "m");
  const m = re.exec(src);
  if (!m) throw new Error("introuvable : " + nom);
  let i = m.index, prof = 0, dansTxt = null;
  for (let k = m.index; k < src.length; k++) {
    const c = src[k], p = src[k - 1];
    if (dansTxt) { if (c === dansTxt && p !== "\\") dansTxt = null; continue; }
    // Sauter les commentaires : les apostrophes du francais y sont legion
    // et seraient prises pour des debuts de chaine.
    if (c === "/" && src[k + 1] === "/") { while (k < src.length && src[k] !== "\n") k++; continue; }
    if (c === "/" && src[k + 1] === "*") { k = src.indexOf("*/", k + 2) + 1; continue; }
    if (c === '"' || c === "'" || c === "`") { dansTxt = c; continue; }
    if ("([{".includes(c)) prof++;
    else if (")]}".includes(c)) prof--;
    else if (c === ";" && prof === 0) return src.slice(i, k + 1);
  }
  throw new Error("fin introuvable : " + nom);
}

const NOMS = ["isoOf", "todayISO", "mondayOf", "epley", "REPS_MIN", "CYCLE_SEMAINES",
              "fourchetteDe", "e1RMDe", "repsUtiles", "resumeSeries", "cycleDe", "PLATEAU_SEANCES", "stagnationsDe"];
// Echec bruyant : un stub silencieux ferait passer le test a cote de son sujet.
// (`const REPS_MIN = 8, REPS_MAX = 12;` est capture en entier, jusqu au `;`.)
let code = "";
for (const n of NOMS) {
  try { code += extraire(n) + "\n"; }
  catch (e) {
    console.error("Impossible d extraire `" + n + "` de src/app.jsx.");
    console.error("Elle a ete renommee ou supprimee : mets ce test a jour.");
    process.exit(2);
  }
}

const mod = await import("data:text/javascript," + encodeURIComponent(
  code + "\nexport { e1RMDe, repsUtiles, resumeSeries, cycleDe, stagnationsDe, fourchetteDe, epley, mondayOf };"
));
const { e1RMDe, repsUtiles, resumeSeries, cycleDe, stagnationsDe } = mod;

let ok = 0, ko = 0;
const t = (nom, reel, attendu) => {
  const bon = JSON.stringify(reel) === JSON.stringify(attendu);
  if (bon) ok++; else { ko++; console.log("  ECHEC " + nom + "\n         attendu " + JSON.stringify(attendu) + "\n         obtenu  " + JSON.stringify(reel)); }
};
const tv = (nom, cond) => { if (cond) ok++; else { ko++; console.log("  ECHEC " + nom); } };

console.log("--- e1RM estime ---");
t("charge seule", Math.round(e1RMDe({ poids: 40, reps: 10 })), 53);
tv("plus de reps => e1RM plus haut", e1RMDe({ poids: 40, reps: 12 }) > e1RMDe({ poids: 40, reps: 8 }));
tv("40x12 bat 42.5x8", e1RMDe({ poids: 40, reps: 12 }) > e1RMDe({ poids: 42.5, reps: 8 }));
t("prend la meilleure serie", Math.round(e1RMDe({ poids: 40, sets: [{ poids: 35, reps: 12 }, { poids: 45, reps: 8 }] })), 57);
t("cardio ignore", e1RMDe({ type: "cardio", poids: 0 }), 0);

console.log("--- reps utiles (serie la plus lourde) ---");
t("sets", repsUtiles({ sets: [{ poids: 35, reps: 12 }, { poids: 45, reps: 6 }] }), 6);
t("sans sets", repsUtiles({ reps: 10 }), 10);

console.log("--- resume des series ---");
t("uniforme", resumeSeries({ sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }] }), "3x10");
t("degressif", resumeSeries({ sets: [{ reps: 12 }, { reps: 10 }, { reps: 8 }] }), "12-10-8");
t("depuis series/reps", resumeSeries({ series: 4, reps: 10 }), "4x10");

console.log("--- cycle : semaines entrainees, pas calendaires ---");
const j = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return isoLocal(d); };
const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const debutLoin = j(70);
// 2 semaines d'arret : avant, le calendrier aurait fait avancer le cycle tout seul
const peuDeSeances = { cycleDebut: debutLoin, seances: [{ date: j(70) }, { date: j(63) }] };
const c1 = cycleDe(peuDeSeances);
tv("2 semaines entrainees + semaine en cours => semaine 3, pas de deload", c1.sem === 3 && c1.deload === false);
const troisSem = { cycleDebut: debutLoin, seances: [{ date: j(70) }, { date: j(63) }, { date: j(56) }] };
tv("3 semaines entrainees + en cours => semaine 4 = deload", cycleDe(troisSem).deload === true);
const aucune = { cycleDebut: debutLoin, seances: [] };
tv("aucune seance => semaine 1", cycleDe(aucune).sem === 1);
tv("aucune seance => jamais de deload", cycleDe(aucune).deload === false);

console.log("--- detection de plateau sur le 1RM estime ---");
const ex = (poids, reps, date) => ({ nom: "Developpe", poids, reps, date });
const bloque = { seances: [1, 2, 3, 4].map((i) => ({ date: "2026-0" + i + "-01", exos: [ex(40, 10)] })) };
tv("4 seances identiques => plateau", stagnationsDe(bloque).length === 1);
const progresse = { seances: [[40, 8], [40, 10], [40, 12], [42.5, 10]].map((p, i) => ({ date: "2026-0" + (i + 1) + "-01", exos: [ex(p[0], p[1])] })) };
tv("reps qui montent => PAS un plateau", stagnationsDe(progresse).length === 0);
const troisSeulement = { seances: [1, 2, 3].map((i) => ({ date: "2026-0" + i + "-01", exos: [ex(40, 10)] })) };
tv("moins de 4 seances => pas de verdict", stagnationsDe(troisSeulement).length === 0);
const repsSeules = { seances: [[40, 8], [40, 9], [40, 10], [40, 11]].map((p, i) => ({ date: "2026-0" + (i + 1) + "-01", exos: [ex(p[0], p[1])] })) };
tv("charge figee mais reps qui montent => PAS un plateau", stagnationsDe(repsSeules).length === 0);

console.log("");
console.log(ko === 0 ? "TOUS LES TESTS PASSENT (" + ok + ")" : ko + " ECHECS sur " + (ok + ko));
process.exit(ko === 0 ? 0 : 1);
