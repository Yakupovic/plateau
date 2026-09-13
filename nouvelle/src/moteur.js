// ═══════════════════════════════════════════════════════════════════
// PLATEAU — moteur.
// Logique pure : aucune interface, aucun accès au DOM. Testée seule par
// tests/moteur.test.mjs. Ce fichier est concaténé avant ui.jsx au build,
// donc pas d'import/export ici.
//
// FORMAT DES DONNÉES : identique à l'ancienne app (clé pl:plateau-data et
// pl:plateau-current). La nouvelle app lit et écrit les mêmes séances, et
// ne touche jamais aux autres clés qu'elle ne connaît pas (poids, photos,
// mensurations…) : on peut revenir à l'ancienne version sans rien perdre.
// ═══════════════════════════════════════════════════════════════════

const CLE_DATA = "pl:plateau-data";
const CLE_EN_COURS = "pl:plateau-current";
const REPS_MIN = 8;
const REPS_MAX = 12;
const SERIES_DEFAUT = 4;
const REPOS_DEFAUT = 90;
const RAPPEL_SAUVEGARDE_JOURS = 7;

// ————— Dates (locales, jamais UTC : une séance à 23 h reste « aujourd'hui ») —————
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayISO = () => isoOf(new Date());
const joursEntre = (isoA, isoB) => Math.round((new Date(isoB + "T12:00:00") - new Date(isoA + "T12:00:00")) / 86400000);

// ————— Formats —————
const fmtKg = (n) => {
  if (n == null || isNaN(n)) return "";
  return String(Math.round(n * 100) / 100).replace(".", ",");
};
const lireNombre = (txt) => {
  if (txt == null) return NaN;
  const v = parseFloat(String(txt).replace(",", ".").trim());
  return isNaN(v) ? NaN : v;
};
const fmtDuree = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};
const fmtChrono = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ————— Noms d'exercice —————
const sansAccent = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const cleNom = (s) => sansAccent(s).toLowerCase().replace(/\s+/g, " ").trim();
const nomPropre = (s) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
};
// Réutilise l'orthographe déjà connue : « tirage vertical » -> « Tirage vertical ».
const nomCanonique = (saisi, connus) => {
  const k = cleNom(saisi);
  const deja = (connus || []).find((c) => cleNom(c) === k);
  return deja || nomPropre(saisi);
};

// ————— Lecture sûre des données —————
// Règle absolue : une donnée illisible n'est JAMAIS écrasée. On la signale,
// l'interface la met de côté et laisse l'utilisateur trancher.
const lireDonnees = (brut) => {
  if (brut == null) return { etat: "vide", data: { seances: [] } };
  let obj;
  try { obj = JSON.parse(brut); } catch (e) { return { etat: "abime" }; }
  if (!obj || typeof obj !== "object" || Array.isArray(obj) || !Array.isArray(obj.seances)) return { etat: "abime" };
  // robustesse : une séance sans tableau d'exos ferait planter les calculs
  obj.seances = obj.seances
    .filter((s) => s && typeof s === "object" && typeof s.date === "string")
    .map((s) => (Array.isArray(s.exos) ? s : Object.assign({}, s, { exos: [] })));
  return { etat: "ok", data: obj };
};
const lireEnCours = (brut) => {
  if (brut == null) return null;
  try {
    const c = JSON.parse(brut);
    if (!c || typeof c !== "object" || !c.startedAt || !Array.isArray(c.exos)) return null;
    return c;
  } catch (e) { return null; }
};

// ————— Historique —————
const seancesTriees = (data) => (data.seances || []).slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
const estCardio = (e) => !!e && e.type === "cardio";

// Tous les noms d'exercice connus, du plus fréquent au moins fréquent.
const nomsExos = (data, enCours) => {
  const compte = {};
  const noms = {};
  const tous = [];
  seancesTriees(data).forEach((s) => s.exos.forEach((e) => tous.push(e)));
  if (enCours) enCours.exos.forEach((e) => tous.push(e));
  tous.forEach((e) => {
    if (!e || !e.nom || estCardio(e)) return;
    const k = cleNom(e.nom);
    compte[k] = (compte[k] || 0) + 1;
    noms[k] = e.nom;
  });
  return Object.keys(compte).sort((a, b) => compte[b] - compte[a]).map((k) => noms[k]);
};

// Dernière réalisation d'un exercice (séance en cours comprise).
const dernierExo = (data, nom, enCours) => {
  const k = cleNom(nom);
  if (enCours) {
    for (let i = enCours.exos.length - 1; i >= 0; i--) {
      const e = enCours.exos[i];
      if (!estCardio(e) && cleNom(e.nom) === k) return e;
    }
  }
  const s = seancesTriees(data);
  for (let i = s.length - 1; i >= 0; i--) {
    for (let j = s[i].exos.length - 1; j >= 0; j--) {
      const e = s[i].exos[j];
      if (!estCardio(e) && cleNom(e.nom) === k) return e;
    }
  }
  return null;
};

// ————— Progression —————
const epley = (poids, reps) => poids * (1 + reps / 30);
const e1RMDe = (e) => {
  if (!e || estCardio(e)) return 0;
  if (Array.isArray(e.sets) && e.sets.length) {
    return e.sets.reduce((m, st) => Math.max(m, epley(Number(st.poids) || 0, Number(st.reps) || 0)), 0);
  }
  return epley(Number(e.poids) || 0, Number(e.reps) || 0);
};
// Reps tenues à la série la plus lourde : c'est elle qui décide de la suite.
const repsUtiles = (e) => {
  if (!e) return 0;
  if (Array.isArray(e.sets) && e.sets.length) {
    let best = e.sets[0];
    e.sets.forEach((st) => { if ((Number(st.poids) || 0) > (Number(best.poids) || 0)) best = st; });
    return Number(best.reps) || 0;
  }
  return Number(e.reps) || 0;
};
const resumeSeries = (e) => {
  if (!e) return "";
  if (Array.isArray(e.sets) && e.sets.length) {
    const reps = e.sets.map((st) => Number(st.reps) || 0);
    return reps.every((r) => r === reps[0]) ? `${reps.length} × ${reps[0]}` : reps.join("-");
  }
  if (e.series && e.reps) return `${e.series} × ${e.reps}`;
  return "";
};
// Série qui fait le record : la plus lourde, et à charge égale celle avec le plus de reps.
const meilleureSerie = (e) => {
  if (!e) return null;
  const sets = Array.isArray(e.sets) && e.sets.length ? e.sets : [{ poids: e.poids, reps: e.reps }];
  return sets.reduce((m, st) => {
    const p = Number(st.poids) || 0, r = Number(st.reps) || 0;
    if (!m || p > m.poids || (p === m.poids && r > m.reps)) return { poids: p, reps: r };
    return m;
  }, null);
};
const pasDeCharge = (e) => (e && e.parBras && Number(e.poids) <= 12 ? 2 : 2.5);
const arrondir = (v) => Math.round(v * 100) / 100;

// Double progression : on monte les reps jusqu'à REPS_MAX, puis la charge.
// Ne dépend d'aucun bouton facultatif — c'était le défaut de l'ancienne app.
const consigne = (dernier) => {
  if (!dernier) {
    return { poids: null, reps: 10, series: SERIES_DEFAUT, repos: REPOS_DEFAUT, texte: "Première fois : choisis ta charge", monte: false };
  }
  const poids = Number(dernier.poids) || 0;
  const reps = repsUtiles(dernier);
  const series = Number(dernier.series) || (Array.isArray(dernier.sets) ? dernier.sets.length : 0) || SERIES_DEFAUT;
  const repos = Number(dernier.reposSec) || REPOS_DEFAUT;
  const base = { series: series, repos: repos, monte: false };
  if (dernier.ressenti === "marge" || reps >= REPS_MAX) {
    const cible = arrondir(poids + pasDeCharge(dernier));
    return Object.assign(base, { poids: cible, reps: REPS_MIN, monte: true, texte: `Monte à ${fmtKg(cible)} kg, repars à ${REPS_MIN} reps` });
  }
  if (reps > 0 && reps < REPS_MIN) {
    return Object.assign(base, { poids: poids, reps: REPS_MIN, texte: `Garde ${fmtKg(poids)} kg, remonte à ${REPS_MIN} reps` });
  }
  if (reps > 0) {
    return Object.assign(base, { poids: poids, reps: reps + 1, texte: `Garde ${fmtKg(poids)} kg, vise ${reps + 1} reps` });
  }
  return Object.assign(base, { poids: poids, reps: 10, texte: `Garde ${fmtKg(poids)} kg` });
};
const texteDerniereFois = (dernier) => {
  if (!dernier) return "";
  const s = resumeSeries(dernier);
  return `La dernière fois : ${s ? s + " à " : ""}${fmtKg(Number(dernier.poids) || 0)} kg`;
};

// Meilleurs résultats AVANT la séance en cours (pour détecter un record).
const meilleursAvant = (data, nom) => {
  const k = cleNom(nom);
  let charge = null, e1rm = 0;
  (data.seances || []).forEach((s) => s.exos.forEach((e) => {
    if (estCardio(e) || cleNom(e.nom) !== k) return;
    const p = Number(e.poids) || 0;
    if (charge == null || p > charge) charge = p;
    e1rm = Math.max(e1rm, e1RMDe(e));
  }));
  return { charge: charge, e1rm: e1rm };
};

// Exercice terminé, au format exact de l'ancienne app.
const exoTermine = (data, ec, debutPrecedent, maintenant) => {
  const sets = ec.sets.map((st) => ({ poids: Number(st.poids) || 0, reps: Number(st.reps) || 0 }));
  const poidsMax = Math.max.apply(null, sets.map((st) => st.poids));
  const avant = meilleursAvant(data, ec.nom);
  const e1rmMtn = sets.reduce((m, st) => Math.max(m, epley(st.poids, st.reps)), 0);
  // Un record : plus lourd qu'avant, ou plus de reps à charge égale (1RM estimé en hausse).
  const pr = (avant.charge != null && poidsMax > avant.charge) || (avant.e1rm > 0 && e1rmMtn > avant.e1rm * 1.01);
  const memes = sets.every((st) => st.poids === sets[0].poids && st.reps === sets[0].reps);
  return {
    id: ec.id || uid(), nom: ec.nom, poids: poidsMax, parBras: !!ec.parBras,
    series: sets.length, reps: sets[0].reps, reposSec: ec.reposSec || REPOS_DEFAUT,
    ressenti: null, coach: null, photoId: null, pr: pr, sets: sets,
    at: maintenant, dureeMin: Math.max(1, Math.round((maintenant - debutPrecedent) / 60000)),
    note: memes ? null : "série par série : " + sets.map((st) => `${fmtKg(st.poids)} kg ×${st.reps}`).join(", "),
  };
};

const seanceTerminee = (enCours, maintenant, dateIso) => ({
  id: uid(), date: dateIso, nom: enCours.nom,
  duree: Math.max(1, Math.round((maintenant - enCours.startedAt) / 60000)),
  gourdes: enCours.gourdes || 0, exos: enCours.exos, bilan: null,
  note: enCours.note && String(enCours.note).trim() ? String(enCours.note).trim() : null,
});

// ————— Séance du jour —————
// Parmi tes noms de séance habituels (90 derniers jours), celle faite le
// moins récemment — jamais la même que la dernière.
const seanceDuJour = (data, aujourdhui) => {
  const s = seancesTriees(data);
  if (!s.length) return { etat: "premiere" };
  const derniere = s[s.length - 1];
  if (derniere.date === aujourdhui) return { etat: "faite", seance: derniere };
  const derniereFois = {};
  const libelle = {};
  s.forEach((x) => {
    if (joursEntre(x.date, aujourdhui) > 90 || !x.nom) return;
    const k = cleNom(x.nom);
    derniereFois[k] = x.date;
    libelle[k] = x.nom;
  });
  let candidats = Object.keys(derniereFois);
  if (candidats.length > 1) candidats = candidats.filter((k) => k !== cleNom(derniere.nom));
  if (!candidats.length) return { etat: "libre", nom: derniere.nom, depuis: joursEntre(derniere.date, aujourdhui) };
  candidats.sort((a, b) => (derniereFois[a] < derniereFois[b] ? -1 : 1));
  const k = candidats[0];
  return { etat: "proposee", nom: libelle[k], depuis: joursEntre(derniereFois[k], aujourdhui) };
};

const texteDepuis = (jours) => {
  if (jours == null) return "";
  if (jours <= 0) return "Faite aujourd'hui.";
  if (jours === 1) return "Dernière fois hier.";
  return `Dernière fois il y a ${jours} jours.`;
};

// Noms de séance, du plus récent au plus ancien.
const nomsSeances = (data) => {
  const vus = {};
  const out = [];
  seancesTriees(data).reverse().forEach((s) => {
    const k = cleNom(s.nom);
    if (!s.nom || vus[k]) return;
    vus[k] = 1;
    out.push(s.nom);
  });
  return out;
};

// Exercices à faire : ceux de la dernière séance du même nom, dans l'ordre,
// moins ceux déjà faits aujourd'hui.
const planDe = (data, enCours) => {
  if (!enCours) return [];
  const k = cleNom(enCours.nom);
  const s = seancesTriees(data).filter((x) => cleNom(x.nom) === k);
  if (!s.length) return [];
  const faits = {};
  enCours.exos.forEach((e) => { faits[cleNom(e.nom)] = 1; });
  const vus = {};
  return s[s.length - 1].exos
    .filter((e) => e && e.nom && !estCardio(e))
    .filter((e) => {
      const kk = cleNom(e.nom);
      if (faits[kk] || vus[kk]) return false;
      vus[kk] = 1;
      return true;
    })
    .map((e) => e.nom);
};

// ————— Sauvegarde —————
const joursSansSauvegarde = (data, aujourdhui) => {
  if (!data.seances || !data.seances.length) return null;
  if (!data.dernierExport) return Infinity;
  return joursEntre(data.dernierExport, aujourdhui);
};
const rappelSauvegarde = (data, aujourdhui) => {
  const j = joursSansSauvegarde(data, aujourdhui);
  return j != null && j >= RAPPEL_SAUVEGARDE_JOURS;
};

const bufToB64 = (buf) => {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
};
const b64ToBuf = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
// Même format que l'ancienne app : les fichiers restent lisibles des deux côtés.
async function chiffrerTexte(texte, motDePasse) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(motDePasse), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: 150000, hash: "SHA-256" }, keyMat, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(texte));
  return JSON.stringify({ plateauChiffre: true, salt: bufToB64(salt), iv: bufToB64(iv), data: bufToB64(cipher) });
}
async function dechiffrerTexte(payloadTxt, motDePasse) {
  const payload = JSON.parse(payloadTxt);
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(motDePasse), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64ToBuf(payload.salt), iterations: 150000, hash: "SHA-256" }, keyMat, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBuf(payload.iv) }, key, b64ToBuf(payload.data));
  return new TextDecoder().decode(plain);
}
// Contenu d'un fichier de sauvegarde -> données, ou erreur explicite.
const lireSauvegarde = (texte) => {
  let obj;
  try { obj = JSON.parse(texte); } catch (e) { return { erreur: "Ce fichier n'est pas une sauvegarde PLATEAU." }; }
  if (obj && obj.plateauChiffre) return { chiffre: true };
  const lu = lireDonnees(JSON.stringify(obj));
  if (lu.etat !== "ok") return { erreur: "Ce fichier n'est pas une sauvegarde PLATEAU." };
  const enCours = lu.data.enCours || null;
  delete lu.data.enCours;
  return { data: lu.data, enCours: enCours };
};
