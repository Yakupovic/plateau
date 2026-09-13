// Parcours complet de la nouvelle app dans un navigateur simulé.
// Usage : node tests/parcours.test.mjs   (après node build.mjs)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.join(ici, "..");
const depot = path.join(racine, "..");
const require = createRequire(path.join(depot, "package.json"));
const { JSDOM } = require("jsdom");

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0, ko = 0;
const verifie = (nom, cond, detail) => {
  if (cond) ok++;
  else { ko++; console.log("  ÉCHEC " + nom + (detail !== undefined ? "\n     " + JSON.stringify(detail).slice(0, 400) : "")); }
};
const section = (t) => console.log("— " + t);

// ————— Monter la nouvelle app —————
async function monter(stockage) {
  const html = fs.readFileSync(path.join(racine, "index.html"), "utf8");
  const dom = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://yakupovic.github.io/plateau/nouvelle/" });
  const w = dom.window;
  const erreurs = [];
  w.addEventListener("error", (e) => erreurs.push(String(e.message)));
  w.console.error = (...a) => erreurs.push(a.map(String).join(" "));
  w.confirm = () => true;
  w.alert = (m) => erreurs.push("alert: " + m);
  Object.entries(stockage || {}).forEach(([k, v]) => w.localStorage.setItem(k, v));
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  w.eval(inline[0]);
  w.eval(fs.readFileSync(path.join(racine, "react.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(racine, "react-dom.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(racine, "app.js"), "utf8"));
  await attendre(150);
  const app = {
    w, erreurs,
    texte: () => w.document.getElementById("root").textContent,
    boutons: () => [...w.document.querySelectorAll("button")],
    async clic(libelle) {
      const b = app.boutons().find((x) => x.textContent.trim() === libelle || x.getAttribute("aria-label") === libelle)
        || app.boutons().find((x) => x.textContent.includes(libelle));
      if (!b) throw new Error(`bouton introuvable : « ${libelle} ». Écran : ${app.texte().slice(0, 200)}`);
      b.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
      await attendre(40);
    },
    async saisir(selecteur, valeur) {
      const el = w.document.querySelector(selecteur);
      if (!el) throw new Error("champ introuvable : " + selecteur);
      Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value").set.call(el, valeur);
      el.dispatchEvent(new w.Event("input", { bubbles: true }));
      await attendre(40);
    },
    valeur: (selecteur) => { const el = w.document.querySelector(selecteur); return el ? el.value : null; },
    data: () => JSON.parse(w.localStorage.getItem("pl:plateau-data")),
    enCours: () => w.localStorage.getItem("pl:plateau-current"),
  };
  return app;
}

// Historique anonyme, au format de l'ancienne app, avec des clés que la nouvelle ne connaît pas.
const ANCIEN = {
  seances: [
    { id: "s1", date: "2026-08-20", nom: "Push", duree: 55, gourdes: 1, bilan: null, note: null,
      exos: [{ id: "e1", nom: "Développé couché", poids: 50, parBras: false, series: 4, reps: 10, reposSec: 120, ressenti: null, pr: false, sets: [{ poids: 50, reps: 10 }, { poids: 50, reps: 10 }, { poids: 50, reps: 10 }, { poids: 50, reps: 10 }] }] },
    { id: "s2", date: "2026-08-25", nom: "Pull", duree: 50, gourdes: 1, bilan: null, note: null,
      exos: [
        { id: "e2", nom: "Tirage vertical", poids: 40, parBras: false, series: 4, reps: 12, reposSec: 90, ressenti: null, pr: false, sets: [{ poids: 40, reps: 12 }, { poids: 40, reps: 12 }, { poids: 40, reps: 12 }, { poids: 40, reps: 12 }] },
        { id: "e3", nom: "Rameur", type: "cardio", dureeCardio: 10 },
        { id: "e4", nom: "Curl biceps", poids: 12, parBras: true, series: 3, reps: 10, reposSec: 60, ressenti: null, pr: false },
      ] },
    { id: "s3", date: "2026-09-10", nom: "Push", duree: 58, gourdes: 1, bilan: null, note: null, exos: [] },
  ],
  poids: [{ date: "2026-09-01", kg: 70 }],
  jours: { "2026-09-01": { sommeil: 7 } },
  photosCorps: [{ id: "p1", date: "2026-08-01", photoId: "abc" }],
  themeSombre: false, migration: 4, dernierExport: "2026-09-12",
};

// ═══════════════════════════════════════════════════════════════════
section("premier lancement");
{
  const a = await monter({});
  verifie("affiche « Première séance »", a.texte().includes("Première séance"), a.texte());
  verifie("pose un carnet vide", JSON.stringify(a.data()) === '{"seances":[]}', a.data());
  verifie("pas de rappel de sauvegarde sans séance", !a.texte().includes("sauvegard"));
  await a.clic("Commencer");
  await a.saisir("input[placeholder^='Pull']", "  haut du corps ");
  await a.clic("Démarrer « Haut du corps »");
  verifie("séance démarrée avec un nom propre", JSON.parse(a.enCours()).nom === "Haut du corps", a.enCours());
  verifie("demande le premier exercice", a.texte().includes("Premier exercice"), a.texte());
  await a.saisir("input[placeholder=\"Nom de l'exercice\"]", "presse à cuisses");
  await a.clic("Commencer « Presse à cuisses »");
  verifie("première fois : pas de charge imposée", a.texte().includes("Première fois : choisis ta charge"), a.texte());
  await a.clic("Valider la série");
  verifie("charge vide refusée avec un message", a.texte().includes("Indique la charge."), a.texte());
  verifie("aucune série ajoutée sans charge", JSON.parse(a.enCours()).exoEnCours.sets.length === 0);
  verifie("aucune erreur JS", a.erreurs.length === 0, a.erreurs);
}

// ═══════════════════════════════════════════════════════════════════
section("séance complète sur un historique de l'ancienne app");
let stockageApres = null;
{
  const a = await monter({ "pl:plateau-data": JSON.stringify(ANCIEN) });
  verifie("propose Pull (la moins récente, pas la dernière)", a.texte().includes("Pull"), a.texte());
  verifie("pas de rappel : sauvegarde récente", !a.texte().includes("Pas de sauvegarde"));
  await a.clic("Démarrer");
  const cur = JSON.parse(a.enCours());
  verifie("séance Pull en cours", cur.nom === "Pull" && cur.exos.length === 0, cur);
  const t = a.texte();
  verifie("plan repris de la dernière séance Pull, sans le cardio", t.includes("Tirage vertical") && t.includes("Curl biceps") && !t.includes("Rameur"), t);
  verifie("consigne dans le plan", t.includes("42,5 kg × 8"), t);

  await a.clic("Tirage vertical");
  verifie("consigne de progression affichée", a.texte().includes("Monte à 42,5 kg, repars à 8 reps"), a.texte());
  verifie("rappel de la dernière fois", a.texte().includes("La dernière fois : 4 × 12 à 40 kg"), a.texte());
  verifie("charge préremplie", a.valeur("input[aria-label='charge']") === "42,5", a.valeur("input[aria-label='charge']"));
  verifie("reps préremplies", a.valeur("input[aria-label='répétitions']") === "8");
  verifie("série 1 sur 4", a.texte().includes("Série 1 sur 4"), a.texte());

  await a.clic("Plus répétitions");
  verifie("bouton + reps", a.valeur("input[aria-label='répétitions']") === "9");
  await a.clic("Moins charge");
  verifie("bouton − charge (pas de 2,5)", a.valeur("input[aria-label='charge']") === "40");
  await a.clic("Plus charge");

  for (let i = 1; i <= 4; i++) {
    await a.clic(i === 4 ? "Valider la dernière série" : "Valider la série");
    verifie(`repos après la série ${i}`, a.texte().includes("Repos"), a.texte().slice(0, 160));
    await a.clic("Passer");
  }
  const apres4 = JSON.parse(a.enCours());
  verifie("exercice clos automatiquement après 4 séries", apres4.exoEnCours === null && apres4.exos.length === 1, apres4);
  const tirage = apres4.exos[0];
  verifie("4 séries à 42,5 × 9 enregistrées", tirage.sets.length === 4 && tirage.sets.every((s) => s.poids === 42.5 && s.reps === 9), tirage.sets);
  verifie("record détecté (plus lourd qu'avant)", tirage.pr === true);
  verifie("la suite propose le curl, plus le tirage", a.texte().includes("Curl biceps") && !a.texte().includes("Tirage vertical"), a.texte());

  await a.clic("Curl biceps");
  verifie("curl : 12 kg × 11 (petits haltères)", a.texte().includes("Garde 12 kg, vise 11 reps"), a.texte());
  await a.clic("Valider la série");
  await a.clic("Passer");
  await a.clic("Retirer la dernière");
  verifie("retirer la dernière série", JSON.parse(a.enCours()).exoEnCours.sets.length === 0);
  await a.clic("Valider la série");
  await a.clic("Passer");
  await a.clic("Valider la série");
  await a.clic("Passer");

  await a.clic("Finir");
  verifie("écran de fin", a.texte().includes("Séance terminée"), a.texte());
  verifie("fin : 6 séries", a.texte().includes("6séries"), a.texte());
  verifie("fin : ligne de record", a.texte().includes("Record sur tirage vertical : 42,5 kg × 9"), a.texte());

  const d = a.data();
  const s = d.seances[d.seances.length - 1];
  verifie("séance ajoutée à l'historique", d.seances.length === 4 && s.nom === "Pull");
  verifie("exercice en cours fermé en finissant", s.exos.length === 2 && s.exos[1].nom === "Curl biceps" && s.exos[1].sets.length === 2, s.exos);
  verifie("séance en cours effacée APRÈS écriture", a.enCours() === null);
  verifie("clés inconnues intactes", JSON.stringify([d.poids, d.jours, d.photosCorps, d.migration]) === JSON.stringify([ANCIEN.poids, ANCIEN.jours, ANCIEN.photosCorps, ANCIEN.migration]), d);
  verifie("anciennes séances intactes", JSON.stringify(d.seances.slice(0, 3)) === JSON.stringify(ANCIEN.seances));
  await a.clic("Fermer");
  verifie("retour à l'accueil : c'est fait", a.texte().includes("C'est fait"), a.texte());
  verifie("aucune erreur JS", a.erreurs.length === 0, a.erreurs);
  stockageApres = { "pl:plateau-data": a.w.localStorage.getItem("pl:plateau-data") };
}

// ═══════════════════════════════════════════════════════════════════
section("reprise après fermeture de l'app en pleine série");
{
  const enCours = { startedAt: Date.now() - 20 * 60000, nom: "Pull", gourdes: 0, exos: [], note: "", template: null,
    exoEnCours: { id: "x9", nom: "Tirage vertical", parBras: false, reposSec: 90, photoId: null, ressenti: null, prevu: 4, sets: [{ poids: 42.5, reps: 8 }, { poids: 42.5, reps: 7 }] } };
  const a = await monter({ "pl:plateau-data": JSON.stringify(ANCIEN), "pl:plateau-current": JSON.stringify(enCours) });
  verifie("reprend directement l'exercice", a.texte().includes("Tirage vertical") && a.texte().includes("Série 3 sur 4"), a.texte());
  verifie("formulaire sur la dernière série faite", a.valeur("input[aria-label='charge']") === "42,5" && a.valeur("input[aria-label='répétitions']") === "7");
  verifie("aucune erreur JS", a.erreurs.length === 0, a.erreurs);
}

// ═══════════════════════════════════════════════════════════════════
section("données illisibles");
{
  const abime = '{"seances":[{"id":"s1","date":"2026-08-20","nom":"Pu';
  const a = await monter({ "pl:plateau-data": abime });
  verifie("écran de récupération", a.texte().includes("Tes données n'ont pas pu être lues"), a.texte());
  verifie("donnée d'origine intacte", a.w.localStorage.getItem("pl:plateau-data") === abime);
  const cles = () => Object.keys(a.w.localStorage).filter((k) => k.indexOf("pl:plateau-data-abime-") === 0);
  verifie("copie de côté créée", cles().length === 1, Object.keys(a.w.localStorage));
  const b = await monter(Object.fromEntries(Object.keys(a.w.localStorage).map((k) => [k, a.w.localStorage.getItem(k)])));
  verifie("pas de nouvelle copie au relancement", Object.keys(b.w.localStorage).filter((k) => k.indexOf("pl:plateau-data-abime-") === 0).length === 1);
  verifie("aucune erreur JS", a.erreurs.length === 0 && b.erreurs.length === 0, a.erreurs.concat(b.erreurs));
}

// ═══════════════════════════════════════════════════════════════════
section("historique, abandon, rappel de sauvegarde");
{
  const vieux = Object.assign({}, ANCIEN, { dernierExport: "2026-08-01" });
  const a = await monter({ "pl:plateau-data": JSON.stringify(vieux) });
  verifie("rappel de sauvegarde après 7 jours", a.texte().includes("Pas de sauvegarde depuis"), a.texte());
  await a.clic("Menu");
  await a.clic("Historique");
  verifie("liste des séances", a.texte().includes("Push") && a.texte().includes("Pull"), a.texte());
  await a.clic("Pull");
  verifie("détail : séries et charge", a.texte().includes("4 × 12 · 40 kg"), a.texte());
  verifie("détail : cardio en minutes", a.texte().includes("10 min"), a.texte());
  await a.clic("Supprimer cette séance");
  verifie("séance supprimée", a.data().seances.length === 2 && !a.data().seances.some((s) => s.id === "s2"));
  verifie("autres clés intactes après suppression", JSON.stringify(a.data().poids) === JSON.stringify(ANCIEN.poids));
  await a.clic("Retour");
  await a.clic("Retour");
  await a.clic("Autre séance");
  await a.clic("Push");
  await a.clic("Finir");
  verifie("abandon d'une séance vide", a.enCours() === null && a.data().seances.length === 2);
  verifie("aucune erreur JS", a.erreurs.length === 0, a.erreurs);
}

// ═══════════════════════════════════════════════════════════════════
section("l'ancienne app relit ce que la nouvelle a écrit");
{
  const htmlAncien = fs.readFileSync(path.join(depot, "index.html"), "utf8");
  const dom = new JSDOM(htmlAncien, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://yakupovic.github.io/plateau/" });
  const w = dom.window;
  const erreurs = [];
  w.onerror = (m) => erreurs.push(String(m));
  w.HTMLCanvasElement.prototype.getContext = () => null;
  w.confirm = () => false;
  w.localStorage.setItem("pl:plateau-data", stockageApres["pl:plateau-data"]);
  const inline = [...htmlAncien.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  w.eval(inline[0]);
  w.eval(fs.readFileSync(path.join(depot, "react.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(depot, "react-dom.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(depot, "app.js"), "utf8"));
  await attendre(2500);
  const txt = w.document.getElementById("root").textContent;
  verifie("l'ancienne app démarre sans erreur", erreurs.length === 0 && txt.length > 100 && !txt.includes("n'ont pas pu être lues"), erreurs.concat([txt.slice(0, 200)]));
  const relu = JSON.parse(w.localStorage.getItem("pl:plateau-data"));
  verifie("elle garde les 4 séances", relu.seances.length === 4 && relu.seances[3].exos[0].sets.length === 4, relu.seances.length);
}

console.log("");
console.log(ko === 0 ? `PARCOURS : ${ok} vérifications OK` : `PARCOURS : ${ko} ÉCHEC(S) sur ${ok + ko}`);
process.exit(ko === 0 ? 0 : 1);
