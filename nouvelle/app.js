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
const isoOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayISO = () => isoOf(new Date());
const joursEntre = (isoA, isoB) => Math.round((new Date(isoB + "T12:00:00") - new Date(isoA + "T12:00:00")) / 86400000);

// ————— Formats —————
const fmtKg = n => {
  if (n == null || isNaN(n)) return "";
  return String(Math.round(n * 100) / 100).replace(".", ",");
};
const lireNombre = txt => {
  if (txt == null) return NaN;
  const v = parseFloat(String(txt).replace(",", ".").trim());
  return isNaN(v) ? NaN : v;
};
const fmtDuree = ms => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600),
    m = Math.floor(s % 3600 / 60),
    sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};
const fmtChrono = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ————— Noms d'exercice —————
const sansAccent = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const cleNom = s => sansAccent(s).toLowerCase().replace(/\s+/g, " ").trim();
const nomPropre = s => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
};
// Réutilise l'orthographe déjà connue : « tirage vertical » -> « Tirage vertical ».
const nomCanonique = (saisi, connus) => {
  const k = cleNom(saisi);
  const deja = (connus || []).find(c => cleNom(c) === k);
  return deja || nomPropre(saisi);
};

// ————— Lecture sûre des données —————
// Règle absolue : une donnée illisible n'est JAMAIS écrasée. On la signale,
// l'interface la met de côté et laisse l'utilisateur trancher.
const lireDonnees = brut => {
  if (brut == null) return {
    etat: "vide",
    data: {
      seances: []
    }
  };
  let obj;
  try {
    obj = JSON.parse(brut);
  } catch (e) {
    return {
      etat: "abime"
    };
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj) || !Array.isArray(obj.seances)) return {
    etat: "abime"
  };
  // robustesse : une séance sans tableau d'exos ferait planter les calculs
  obj.seances = obj.seances.filter(s => s && typeof s === "object" && typeof s.date === "string").map(s => Array.isArray(s.exos) ? s : Object.assign({}, s, {
    exos: []
  }));
  return {
    etat: "ok",
    data: obj
  };
};
const lireEnCours = brut => {
  if (brut == null) return null;
  try {
    const c = JSON.parse(brut);
    if (!c || typeof c !== "object" || !c.startedAt || !Array.isArray(c.exos)) return null;
    return c;
  } catch (e) {
    return null;
  }
};

// ————— Historique —————
const seancesTriees = data => (data.seances || []).slice().sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
const estCardio = e => !!e && e.type === "cardio";

// Tous les noms d'exercice connus, du plus fréquent au moins fréquent.
const nomsExos = (data, enCours) => {
  const compte = {};
  const noms = {};
  const tous = [];
  seancesTriees(data).forEach(s => s.exos.forEach(e => tous.push(e)));
  if (enCours) enCours.exos.forEach(e => tous.push(e));
  tous.forEach(e => {
    if (!e || !e.nom || estCardio(e)) return;
    const k = cleNom(e.nom);
    compte[k] = (compte[k] || 0) + 1;
    noms[k] = e.nom;
  });
  return Object.keys(compte).sort((a, b) => compte[b] - compte[a]).map(k => noms[k]);
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
const e1RMDe = e => {
  if (!e || estCardio(e)) return 0;
  if (Array.isArray(e.sets) && e.sets.length) {
    return e.sets.reduce((m, st) => Math.max(m, epley(Number(st.poids) || 0, Number(st.reps) || 0)), 0);
  }
  return epley(Number(e.poids) || 0, Number(e.reps) || 0);
};
// Reps tenues à la série la plus lourde : c'est elle qui décide de la suite.
const repsUtiles = e => {
  if (!e) return 0;
  if (Array.isArray(e.sets) && e.sets.length) {
    let best = e.sets[0];
    e.sets.forEach(st => {
      if ((Number(st.poids) || 0) > (Number(best.poids) || 0)) best = st;
    });
    return Number(best.reps) || 0;
  }
  return Number(e.reps) || 0;
};
const resumeSeries = e => {
  if (!e) return "";
  if (Array.isArray(e.sets) && e.sets.length) {
    const reps = e.sets.map(st => Number(st.reps) || 0);
    return reps.every(r => r === reps[0]) ? `${reps.length} × ${reps[0]}` : reps.join("-");
  }
  if (e.series && e.reps) return `${e.series} × ${e.reps}`;
  return "";
};
// Série qui fait le record : la plus lourde, et à charge égale celle avec le plus de reps.
const meilleureSerie = e => {
  if (!e) return null;
  const sets = Array.isArray(e.sets) && e.sets.length ? e.sets : [{
    poids: e.poids,
    reps: e.reps
  }];
  return sets.reduce((m, st) => {
    const p = Number(st.poids) || 0,
      r = Number(st.reps) || 0;
    if (!m || p > m.poids || p === m.poids && r > m.reps) return {
      poids: p,
      reps: r
    };
    return m;
  }, null);
};
const pasDeCharge = e => e && e.parBras && Number(e.poids) <= 12 ? 2 : 2.5;
const arrondir = v => Math.round(v * 100) / 100;

// Double progression : on monte les reps jusqu'à REPS_MAX, puis la charge.
// Ne dépend d'aucun bouton facultatif — c'était le défaut de l'ancienne app.
const consigne = dernier => {
  if (!dernier) {
    return {
      poids: null,
      reps: 10,
      series: SERIES_DEFAUT,
      repos: REPOS_DEFAUT,
      texte: "Première fois : choisis ta charge",
      monte: false
    };
  }
  const poids = Number(dernier.poids) || 0;
  const reps = repsUtiles(dernier);
  const series = Number(dernier.series) || (Array.isArray(dernier.sets) ? dernier.sets.length : 0) || SERIES_DEFAUT;
  const repos = Number(dernier.reposSec) || REPOS_DEFAUT;
  const base = {
    series: series,
    repos: repos,
    monte: false
  };
  if (dernier.ressenti === "marge" || reps >= REPS_MAX) {
    const cible = arrondir(poids + pasDeCharge(dernier));
    return Object.assign(base, {
      poids: cible,
      reps: REPS_MIN,
      monte: true,
      texte: `Monte à ${fmtKg(cible)} kg, repars à ${REPS_MIN} reps`
    });
  }
  if (reps > 0 && reps < REPS_MIN) {
    return Object.assign(base, {
      poids: poids,
      reps: REPS_MIN,
      texte: `Garde ${fmtKg(poids)} kg, remonte à ${REPS_MIN} reps`
    });
  }
  if (reps > 0) {
    return Object.assign(base, {
      poids: poids,
      reps: reps + 1,
      texte: `Garde ${fmtKg(poids)} kg, vise ${reps + 1} reps`
    });
  }
  return Object.assign(base, {
    poids: poids,
    reps: 10,
    texte: `Garde ${fmtKg(poids)} kg`
  });
};
const texteDerniereFois = dernier => {
  if (!dernier) return "";
  const s = resumeSeries(dernier);
  return `La dernière fois : ${s ? s + " à " : ""}${fmtKg(Number(dernier.poids) || 0)} kg`;
};

// Meilleurs résultats AVANT la séance en cours (pour détecter un record).
const meilleursAvant = (data, nom) => {
  const k = cleNom(nom);
  let charge = null,
    e1rm = 0;
  (data.seances || []).forEach(s => s.exos.forEach(e => {
    if (estCardio(e) || cleNom(e.nom) !== k) return;
    const p = Number(e.poids) || 0;
    if (charge == null || p > charge) charge = p;
    e1rm = Math.max(e1rm, e1RMDe(e));
  }));
  return {
    charge: charge,
    e1rm: e1rm
  };
};

// Exercice terminé, au format exact de l'ancienne app.
const exoTermine = (data, ec, debutPrecedent, maintenant) => {
  const sets = ec.sets.map(st => ({
    poids: Number(st.poids) || 0,
    reps: Number(st.reps) || 0
  }));
  const poidsMax = Math.max.apply(null, sets.map(st => st.poids));
  const avant = meilleursAvant(data, ec.nom);
  const e1rmMtn = sets.reduce((m, st) => Math.max(m, epley(st.poids, st.reps)), 0);
  // Un record : plus lourd qu'avant, ou plus de reps à charge égale (1RM estimé en hausse).
  const pr = avant.charge != null && poidsMax > avant.charge || avant.e1rm > 0 && e1rmMtn > avant.e1rm * 1.01;
  const memes = sets.every(st => st.poids === sets[0].poids && st.reps === sets[0].reps);
  return {
    id: ec.id || uid(),
    nom: ec.nom,
    poids: poidsMax,
    parBras: !!ec.parBras,
    series: sets.length,
    reps: sets[0].reps,
    reposSec: ec.reposSec || REPOS_DEFAUT,
    ressenti: null,
    coach: null,
    photoId: null,
    pr: pr,
    sets: sets,
    at: maintenant,
    dureeMin: Math.max(1, Math.round((maintenant - debutPrecedent) / 60000)),
    note: memes ? null : "série par série : " + sets.map(st => `${fmtKg(st.poids)} kg ×${st.reps}`).join(", ")
  };
};
const seanceTerminee = (enCours, maintenant, dateIso) => ({
  id: uid(),
  date: dateIso,
  nom: enCours.nom,
  duree: Math.max(1, Math.round((maintenant - enCours.startedAt) / 60000)),
  gourdes: enCours.gourdes || 0,
  exos: enCours.exos,
  bilan: null,
  note: enCours.note && String(enCours.note).trim() ? String(enCours.note).trim() : null
});

// ————— Séance du jour —————
// Parmi tes noms de séance habituels (90 derniers jours), celle faite le
// moins récemment — jamais la même que la dernière.
const seanceDuJour = (data, aujourdhui) => {
  const s = seancesTriees(data);
  if (!s.length) return {
    etat: "premiere"
  };
  const derniere = s[s.length - 1];
  if (derniere.date === aujourdhui) return {
    etat: "faite",
    seance: derniere
  };
  const derniereFois = {};
  const libelle = {};
  s.forEach(x => {
    if (joursEntre(x.date, aujourdhui) > 90 || !x.nom) return;
    const k = cleNom(x.nom);
    derniereFois[k] = x.date;
    libelle[k] = x.nom;
  });
  let candidats = Object.keys(derniereFois);
  if (candidats.length > 1) candidats = candidats.filter(k => k !== cleNom(derniere.nom));
  if (!candidats.length) return {
    etat: "libre",
    nom: derniere.nom,
    depuis: joursEntre(derniere.date, aujourdhui)
  };
  candidats.sort((a, b) => derniereFois[a] < derniereFois[b] ? -1 : 1);
  const k = candidats[0];
  return {
    etat: "proposee",
    nom: libelle[k],
    depuis: joursEntre(derniereFois[k], aujourdhui)
  };
};
const texteDepuis = jours => {
  if (jours == null) return "";
  if (jours <= 0) return "Faite aujourd'hui.";
  if (jours === 1) return "Dernière fois hier.";
  return `Dernière fois il y a ${jours} jours.`;
};

// Noms de séance, du plus récent au plus ancien.
const nomsSeances = data => {
  const vus = {};
  const out = [];
  seancesTriees(data).reverse().forEach(s => {
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
  const s = seancesTriees(data).filter(x => cleNom(x.nom) === k);
  if (!s.length) return [];
  const faits = {};
  enCours.exos.forEach(e => {
    faits[cleNom(e.nom)] = 1;
  });
  const vus = {};
  return s[s.length - 1].exos.filter(e => e && e.nom && !estCardio(e)).filter(e => {
    const kk = cleNom(e.nom);
    if (faits[kk] || vus[kk]) return false;
    vus[kk] = 1;
    return true;
  }).map(e => e.nom);
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
const bufToB64 = buf => {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
};
const b64ToBuf = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
// Même format que l'ancienne app : les fichiers restent lisibles des deux côtés.
async function chiffrerTexte(texte, motDePasse) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(motDePasse), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({
    name: "PBKDF2",
    salt: salt,
    iterations: 150000,
    hash: "SHA-256"
  }, keyMat, {
    name: "AES-GCM",
    length: 256
  }, false, ["encrypt"]);
  const cipher = await crypto.subtle.encrypt({
    name: "AES-GCM",
    iv: iv
  }, key, enc.encode(texte));
  return JSON.stringify({
    plateauChiffre: true,
    salt: bufToB64(salt),
    iv: bufToB64(iv),
    data: bufToB64(cipher)
  });
}
async function dechiffrerTexte(payloadTxt, motDePasse) {
  const payload = JSON.parse(payloadTxt);
  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(motDePasse), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({
    name: "PBKDF2",
    salt: b64ToBuf(payload.salt),
    iterations: 150000,
    hash: "SHA-256"
  }, keyMat, {
    name: "AES-GCM",
    length: 256
  }, false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({
    name: "AES-GCM",
    iv: b64ToBuf(payload.iv)
  }, key, b64ToBuf(payload.data));
  return new TextDecoder().decode(plain);
}
// Contenu d'un fichier de sauvegarde -> données, ou erreur explicite.
const lireSauvegarde = texte => {
  let obj;
  try {
    obj = JSON.parse(texte);
  } catch (e) {
    return {
      erreur: "Ce fichier n'est pas une sauvegarde PLATEAU."
    };
  }
  if (obj && obj.plateauChiffre) return {
    chiffre: true
  };
  const lu = lireDonnees(JSON.stringify(obj));
  if (lu.etat !== "ok") return {
    erreur: "Ce fichier n'est pas une sauvegarde PLATEAU."
  };
  const enCours = lu.data.enCours || null;
  delete lu.data.enCours;
  return {
    data: lu.data,
    enCours: enCours
  };
};

// ═══════════════════════════════════════════════════════════════════
// PLATEAU — interface « Silence ».
// Un seul parcours : démarrer, faire ses séries, se reposer, finir.
// Toute la logique est dans moteur.js ; ici on affiche et on enregistre.
// ═══════════════════════════════════════════════════════════════════

const {
  useState,
  useEffect,
  useRef
} = React;
const T = {
  fond: "#f3f1ec",
  encre: "#1b1a18",
  gris: "#666159",
  trait: "#dfdbd3",
  bord: "#cfcac1",
  accent: "#a8431b",
  blanc: "#ffffff",
  erreur: "#a82a20"
};
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

// ————— Stockage —————
const lire = cle => {
  try {
    return localStorage.getItem(cle);
  } catch (e) {
    return null;
  }
};
const ecrire = (cle, valeur) => {
  try {
    if (valeur == null) localStorage.removeItem(cle);else localStorage.setItem(cle, valeur);
    return true;
  } catch (e) {
    return false;
  }
};

// Au démarrage : une donnée illisible est recopiée de côté, jamais écrasée.
const chargerAuDemarrage = () => {
  const brut = lire(CLE_DATA);
  const lu = lireDonnees(brut);
  if (lu.etat === "abime") {
    let cle = null;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf("pl:plateau-data-abime-") === 0 && localStorage.getItem(k) === brut) cle = k;
      }
    } catch (e) {}
    if (!cle) {
      cle = "pl:plateau-data-abime-" + Date.now();
      ecrire(cle, brut);
    }
    return {
      abime: {
        cle: cle,
        taille: brut.length,
        debut: brut.slice(0, 300)
      },
      data: null,
      enCours: null
    };
  }
  if (lu.etat === "vide") ecrire(CLE_DATA, JSON.stringify(lu.data));
  return {
    abime: null,
    data: lu.data,
    enCours: lireEnCours(lire(CLE_EN_COURS))
  };
};

// ————— Son de fin de repos (iOS : le contexte audio doit naître d'un tap) —————
let audioCtx = null;
const deverrouillerSon = () => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {}
};
const bip = () => {
  if (!audioCtx) return;
  try {
    [0, 0.22].forEach(t => {
      const o = audioCtx.createOscillator(),
        g = audioCtx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t + 0.16);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(audioCtx.currentTime + t);
      o.stop(audioCtx.currentTime + t + 0.18);
    });
  } catch (e) {}
};
const dateLongue = iso => {
  const t = new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const dateCourte = iso => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short"
});

// ————— Petits éléments —————
function Ecran({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ecran",
    style: style
  }, children);
}
function Etiquette({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: Object.assign({
      fontFamily: MONO,
      fontSize: 13,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: T.gris
    }, style)
  }, children);
}
function Bouton({
  children,
  onClick,
  variante,
  disabled,
  style,
  label
}) {
  const plein = variante !== "contour" && variante !== "texte";
  const base = {
    minHeight: variante === "texte" ? 48 : 64,
    width: "100%",
    borderRadius: 14,
    fontSize: variante === "texte" ? 16 : 19,
    fontWeight: variante === "texte" ? 500 : 600,
    fontFamily: "inherit",
    cursor: disabled ? "default" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 16px",
    background: plein ? T.encre : "transparent",
    color: plein ? T.blanc : variante === "texte" ? T.gris : T.encre,
    border: variante === "contour" ? `1px solid ${T.bord}` : "none",
    opacity: disabled ? 0.4 : 1
  };
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": label,
    disabled: disabled,
    onClick: onClick,
    style: Object.assign(base, style)
  }, children);
}
function Entete({
  gauche,
  droite,
  onDroite
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: 44
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: MONO,
      fontSize: 14,
      color: T.gris
    }
  }, gauche), droite && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onDroite,
    style: {
      minHeight: 44,
      minWidth: 44,
      padding: "0 0 0 16px",
      fontSize: 16,
      fontWeight: 500,
      color: T.encre,
      background: "none",
      border: "none",
      fontFamily: "inherit"
    }
  }, droite));
}
function Retour({
  onClick,
  titre
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      minHeight: 44
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Retour",
    onClick: onClick,
    style: {
      minHeight: 44,
      minWidth: 44,
      marginLeft: -12,
      background: "none",
      border: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: T.encre,
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M15 5l-7 7 7 7"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 600
    }
  }, titre));
}
function Ligne({
  titre,
  detail,
  onClick,
  droite
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    style: {
      width: "100%",
      minHeight: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "12px 0",
      background: "none",
      border: "none",
      borderBottom: `1px solid ${T.trait}`,
      textAlign: "left",
      fontFamily: "inherit",
      color: T.encre
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 500
    }
  }, titre), detail && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: T.gris,
      marginTop: 2
    }
  }, detail)), droite || /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: T.gris,
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9 5l7 7-7 7"
  })));
}
function Compteur({
  valeur,
  onChange,
  unite,
  pas,
  decimal,
  label
}) {
  const bouger = sens => {
    const v = lireNombre(valeur);
    const base = isNaN(v) ? 0 : v;
    const suivant = Math.max(0, Math.round((base + sens * pas) * 100) / 100);
    onChange(decimal ? fmtKg(suivant) : String(Math.round(suivant)));
  };
  const rond = {
    border: `1px solid ${T.bord}`,
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": `Moins ${label}`,
    onClick: () => bouger(-1),
    className: "compteur-rond",
    style: rond
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: T.encre,
    strokeWidth: "1.8",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  }))), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "center",
      gap: 6,
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("input", {
    "aria-label": label,
    value: valeur,
    inputMode: decimal ? "decimal" : "numeric",
    placeholder: "\u2014",
    onChange: e => onChange(e.target.value.replace(decimal ? /[^\d.,]/g : /\D/g, "")),
    onFocus: e => e.target.select(),
    className: "compteur-valeur",
    style: {
      width: "100%",
      maxWidth: 170,
      minWidth: 0,
      textAlign: "right",
      fontFamily: MONO,
      fontWeight: 500,
      letterSpacing: "-0.03em",
      color: T.encre,
      background: "transparent",
      border: "none",
      outline: "none",
      padding: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      color: T.gris,
      width: 38,
      flexShrink: 0
    }
  }, unite)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": `Plus ${label}`,
    onClick: () => bouger(1),
    className: "compteur-rond",
    style: rond
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: T.encre,
    strokeWidth: "1.8",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14M12 5v14"
  }))));
}

// ————— Écran de récupération —————
function Recuperation({
  abime
}) {
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lire(abime.cle) || "");
      window.alert("Contenu copié.");
    } catch (e) {
      window.alert("Copie impossible ici.");
    }
  };
  const repartir = () => {
    if (!window.confirm("Repartir d'un carnet vide ?\n\nLa copie de tes anciennes données reste gardée sur le téléphone.")) return;
    if (ecrire(CLE_DATA, JSON.stringify({
      seances: []
    }))) window.location.reload();else window.alert("Écriture impossible.");
  };
  return /*#__PURE__*/React.createElement(Ecran, null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Etiquette, null, "Probl\xE8me de lecture"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 34,
      fontWeight: 600,
      lineHeight: 1.1
    }
  }, "Tes donn\xE9es n'ont pas pu \xEAtre lues"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      lineHeight: 1.45,
      color: T.gris
    }
  }, "Rien n'a \xE9t\xE9 effac\xE9. Le contenu d'origine (", abime.taille, " caract\xE8res) est gard\xE9 de c\xF4t\xE9. Restaure ta derni\xE8re sauvegarde, ou copie le contenu et envoie-le \xE0 Claude pour le r\xE9parer."), /*#__PURE__*/React.createElement("pre", {
    style: {
      fontFamily: MONO,
      fontSize: 12,
      color: T.gris,
      whiteSpace: "pre-wrap",
      wordBreak: "break-all",
      margin: 0,
      padding: "12px 0",
      borderTop: `1px solid ${T.trait}`,
      borderBottom: `1px solid ${T.trait}`
    }
  }, abime.debut)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Bouton, {
    onClick: copier
  }, "Copier le contenu gard\xE9"), /*#__PURE__*/React.createElement(Bouton, {
    variante: "texte",
    onClick: repartir,
    style: {
      color: T.erreur
    }
  }, "Repartir de z\xE9ro")));
}

// ═══════════════════════════════════════════════════════════════════
// La décision « données lisibles ou pas » est prise une fois, avant tout le reste.
function Racine() {
  const [depart] = useState(chargerAuDemarrage);
  return depart.abime ? /*#__PURE__*/React.createElement(Recuperation, {
    abime: depart.abime
  }) : /*#__PURE__*/React.createElement(App, {
    depart: depart
  });
}
function App({
  depart
}) {
  const [data, setData] = useState(depart.data);
  const [enCours, setEnCours] = useState(depart.enCours);
  const [ecran, setEcran] = useState("accueil");
  const [detailId, setDetailId] = useState(null);
  const [bilan, setBilan] = useState(null);
  const [repos, setRepos] = useState(null); // { fin, total }
  const [maintenant, setMaintenant] = useState(Date.now());
  const [poids, setPoids] = useState("");
  const [reps, setReps] = useState("10");
  const [formPour, setFormPour] = useState(null); // id de l'exo auquel le formulaire correspond
  const [saisie, setSaisie] = useState("");
  const [nomSeance, setNomSeance] = useState("");
  const [erreur, setErreur] = useState(null);
  const [alerteStockage, setAlerteStockage] = useState(false);
  const fichierRef = useRef(null);
  const bipFait = useRef(false);
  const verrou = useRef(null);
  const aujourdhui = todayISO();
  const ec = enCours && enCours.exoEnCours;
  const resteRepos = repos ? Math.max(0, Math.ceil((repos.fin - maintenant) / 1000)) : 0;
  const enRepos = !!repos && resteRepos > 0;

  // ————— Écritures (immédiates : pas de fenêtre où une séance n'existe nulle part) —————
  const sauverData = next => {
    const ok = ecrire(CLE_DATA, JSON.stringify(next));
    setAlerteStockage(!ok);
    if (ok) setData(next);
    return ok;
  };
  const sauverEnCours = cur => {
    const ok = ecrire(CLE_EN_COURS, cur ? JSON.stringify(cur) : null);
    setAlerteStockage(!ok);
    setEnCours(cur);
    return ok;
  };

  // ————— Horloge, fin de repos, écran allumé —————
  useEffect(() => {
    if (!enCours && !repos) return;
    const t = setInterval(() => setMaintenant(Date.now()), 500);
    return () => clearInterval(t);
  }, [!!enCours, !!repos]);
  useEffect(() => {
    if (repos && resteRepos === 0 && !bipFait.current) {
      bipFait.current = true;
      bip();
      setRepos(null);
    }
  }, [repos, resteRepos]);
  useEffect(() => {
    if (!enCours || !navigator.wakeLock) return;
    let actif = true;
    const demander = () => {
      if (!actif || document.visibilityState !== "visible") return;
      navigator.wakeLock.request("screen").then(v => {
        verrou.current = v;
      }).catch(() => {});
    };
    demander();
    document.addEventListener("visibilitychange", demander);
    return () => {
      actif = false;
      document.removeEventListener("visibilitychange", demander);
      if (verrou.current) {
        verrou.current.release().catch(() => {});
        verrou.current = null;
      }
    };
  }, [!!enCours]);

  // Formulaire aligné sur l'exercice en cours (y compris après une réouverture de l'app).
  useEffect(() => {
    if (!ec || formPour === ec.id) return;
    if (ec.sets.length) {
      const der = ec.sets[ec.sets.length - 1];
      setPoids(fmtKg(der.poids));
      setReps(String(der.reps));
    } else {
      const c = consigne(dernierExo(data, ec.nom, enCours));
      setPoids(c.poids == null ? "" : fmtKg(c.poids));
      setReps(String(c.reps));
    }
    setFormPour(ec.id);
    setErreur(null);
  }, [ec && ec.id]);

  // ————— Actions de séance —————
  const demarrer = nom => {
    const propre = nomPropre(nom);
    if (!propre) return;
    deverrouillerSon();
    const connu = nomsSeances(data).find(n => cleNom(n) === cleNom(propre));
    sauverEnCours({
      startedAt: Date.now(),
      nom: connu || propre,
      gourdes: 0,
      exos: [],
      exoEnCours: null,
      note: "",
      template: null
    });
    setNomSeance("");
    setBilan(null);
    setEcran("accueil");
  };
  const commencerExo = nomSaisi => {
    if (!nomSaisi || !nomSaisi.trim()) return;
    deverrouillerSon();
    const nom = nomCanonique(nomSaisi, nomsExos(data, enCours));
    const der = dernierExo(data, nom, enCours);
    const c = consigne(der);
    sauverEnCours(Object.assign({}, enCours, {
      exoEnCours: {
        id: uid(),
        nom: nom,
        parBras: der ? !!der.parBras : false,
        reposSec: c.repos,
        photoId: null,
        ressenti: null,
        prevu: c.series,
        sets: []
      }
    }));
    setSaisie("");
  };
  const terminerExo = (exoCourant, base) => {
    const cur = base || enCours;
    if (!exoCourant.sets.length) return Object.assign({}, cur, {
      exoEnCours: null
    });
    const debut = cur.exos.length ? cur.exos[cur.exos.length - 1].at || cur.startedAt : cur.startedAt;
    const exo = exoTermine(data, exoCourant, debut, Date.now());
    return Object.assign({}, cur, {
      exos: cur.exos.concat([exo]),
      exoEnCours: null
    });
  };
  const validerSerie = () => {
    const p = lireNombre(poids),
      r = parseInt(reps, 10);
    if (isNaN(p)) {
      setErreur("Indique la charge.");
      return;
    }
    if (!(r >= 1)) {
      setErreur("Indique le nombre de reps.");
      return;
    }
    setErreur(null);
    deverrouillerSon();
    const nx = Object.assign({}, ec, {
      sets: ec.sets.concat([{
        poids: p,
        reps: r
      }])
    });
    const cur = nx.sets.length >= (nx.prevu || SERIES_DEFAUT) ? terminerExo(nx, Object.assign({}, enCours, {
      exoEnCours: nx
    })) : Object.assign({}, enCours, {
      exoEnCours: nx
    });
    sauverEnCours(cur);
    bipFait.current = false;
    setRepos({
      fin: Date.now() + (nx.reposSec || REPOS_DEFAUT) * 1000,
      total: nx.reposSec || REPOS_DEFAUT
    });
  };
  const serieDePlus = () => sauverEnCours(Object.assign({}, enCours, {
    exoEnCours: Object.assign({}, ec, {
      prevu: Math.max(ec.prevu || 0, ec.sets.length) + 1
    })
  }));
  const retirerSerie = () => sauverEnCours(Object.assign({}, enCours, {
    exoEnCours: Object.assign({}, ec, {
      sets: ec.sets.slice(0, -1)
    })
  }));
  const exoFini = () => {
    if (!ec.sets.length && !window.confirm(`Laisser tomber ${ec.nom} ?`)) return;
    sauverEnCours(terminerExo(ec));
    setRepos(null);
  };
  const finirSeance = () => {
    let cur = enCours;
    if (ec && ec.sets.length) cur = terminerExo(ec);
    if (!cur.exos.length) {
      if (!window.confirm("Aucun exercice noté. Abandonner la séance ?")) return;
      sauverEnCours(null);
      setRepos(null);
      return;
    }
    if (!window.confirm("Terminer la séance ?")) return;
    const seance = seanceTerminee(cur, Date.now(), todayISO());
    // La séance doit être écrite AVANT d'effacer la séance en cours.
    if (!sauverData(Object.assign({}, data, {
      seances: data.seances.concat([seance])
    }))) {
      window.alert("La séance n'a pas pu être enregistrée (mémoire pleine ?). Elle reste ouverte : rien n'est perdu.");
      return;
    }
    sauverEnCours(null);
    setRepos(null);
    setBilan(seance);
  };

  // ————— Sauvegarde —————
  const exporter = async () => {
    const mdp = window.prompt("Choisis un mot de passe pour protéger ta sauvegarde.\n\nNote-le : sans lui, le fichier est illisible.");
    if (!mdp || !mdp.trim()) return;
    try {
      const contenu = await chiffrerTexte(JSON.stringify(enCours ? Object.assign({}, data, {
        enCours: enCours
      }) : data), mdp.trim());
      const nom = `plateau-sauvegarde-${todayISO()}.json`;
      const fichier = new File([contenu], nom, {
        type: "application/json"
      });
      if (navigator.canShare && navigator.canShare({
        files: [fichier]
      })) {
        try {
          await navigator.share({
            files: [fichier],
            title: "Sauvegarde PLATEAU"
          });
        } catch (e) {
          return;
        } // partage annulé : pas de sauvegarde, on ne le compte pas
      } else {
        const url = URL.createObjectURL(fichier);
        const a = document.createElement("a");
        a.href = url;
        a.download = nom;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
      sauverData(Object.assign({}, data, {
        dernierExport: todayISO()
      }));
    } catch (e) {
      window.alert("La sauvegarde a échoué sur ce téléphone.");
    }
  };
  const restaurer = async fichier => {
    if (!fichier) return;
    try {
      let texte = await fichier.text();
      let lu = lireSauvegarde(texte);
      if (lu.chiffre) {
        const mdp = window.prompt("Mot de passe de la sauvegarde :");
        if (!mdp) return;
        try {
          texte = await dechiffrerTexte(texte, mdp);
        } catch (e) {
          window.alert("Mot de passe incorrect, ou fichier abîmé.");
          return;
        }
        lu = lireSauvegarde(texte);
      }
      if (lu.erreur) {
        window.alert(lu.erreur);
        return;
      }
      if (!window.confirm(`Remplacer tes données actuelles par cette sauvegarde (${lu.data.seances.length} séances) ?`)) return;
      if (!sauverData(lu.data)) {
        window.alert("Écriture impossible.");
        return;
      }
      sauverEnCours(lu.enCours && lu.enCours.startedAt ? lu.enCours : null);
      setRepos(null);
      setBilan(null);
      setEcran("accueil");
    } catch (e) {
      window.alert("Ce fichier n'a pas pu être lu.");
    }
  };
  const bandeau = alerteStockage && /*#__PURE__*/React.createElement("div", {
    role: "alert",
    style: {
      fontSize: 14,
      color: T.erreur,
      padding: "10px 0",
      borderBottom: `1px solid ${T.trait}`
    }
  }, "Enregistrement impossible sur ce t\xE9l\xE9phone. Fais une sauvegarde depuis le menu.");

  // ═══ FIN DE SÉANCE ═══
  if (bilan) {
    const series = bilan.exos.reduce((n, e) => n + (e.series || 0), 0);
    const records = bilan.exos.filter(e => e.pr);
    return /*#__PURE__*/React.createElement(Ecran, null, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 32
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Etiquette, null, "S\xE9ance termin\xE9e"), /*#__PURE__*/React.createElement("div", {
      className: "titre-geant"
    }, bilan.nom)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 12,
        padding: "20px 0",
        borderTop: `1px solid ${T.trait}`,
        borderBottom: `1px solid ${T.trait}`
      }
    }, [[bilan.duree, bilan.duree > 1 ? "minutes" : "minute"], [series, series > 1 ? "séries" : "série"], [records.length, records.length > 1 ? "records" : "record"]].map(([v, l], i) => /*#__PURE__*/React.createElement("div", {
      key: l,
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: MONO,
        fontSize: 30,
        fontWeight: 500,
        color: i === 2 && v > 0 ? T.accent : T.encre
      }
    }, v), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: T.gris
      }
    }, l)))), records.map(e => /*#__PURE__*/React.createElement("div", {
      key: e.id,
      style: {
        fontSize: 18,
        lineHeight: 1.45
      }
    }, "Record sur ", e.nom.charAt(0).toLowerCase() + e.nom.slice(1), " : ", /*#__PURE__*/React.createElement("b", null, fmtKg(meilleureSerie(e).poids), " kg \xD7 ", meilleureSerie(e).reps), "."))), /*#__PURE__*/React.createElement(Bouton, {
      onClick: () => setBilan(null)
    }, "Fermer"));
  }

  // ═══ SÉANCE EN COURS ═══
  if (enCours) {
    const entete = /*#__PURE__*/React.createElement(Entete, {
      gauche: `${enCours.nom} · ${fmtDuree(maintenant - enCours.startedAt)}`,
      droite: "Finir",
      onDroite: finirSeance
    });

    // — Repos —
    if (enRepos) {
      const suite = ec ? {
        haut: `Ensuite : série ${ec.sets.length + 1} sur ${ec.prevu}`,
        bas: poids ? `${poids} kg × ${reps}` : ""
      } : {
        haut: "Ensuite",
        bas: planDe(data, enCours)[0] || "l'exercice suivant"
      };
      return /*#__PURE__*/React.createElement(Ecran, null, entete, /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 18
        }
      }, /*#__PURE__*/React.createElement(Etiquette, null, "Repos"), /*#__PURE__*/React.createElement("div", {
        "aria-live": "polite",
        style: {
          fontFamily: MONO,
          fontSize: 112,
          fontWeight: 500,
          letterSpacing: "-0.05em",
          lineHeight: 1
        }
      }, fmtChrono(resteRepos)), /*#__PURE__*/React.createElement("div", {
        style: {
          width: 240,
          height: 3,
          background: T.trait,
          borderRadius: 2
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: `${Math.min(100, (1 - resteRepos / repos.total) * 100)}%`,
          height: "100%",
          background: T.encre,
          borderRadius: 2
        }
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 22,
          fontSize: 17,
          color: T.gris,
          textAlign: "center",
          lineHeight: 1.5
        }
      }, suite.haut, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
        style: {
          color: T.encre,
          fontWeight: 600
        }
      }, suite.bas))), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10
        }
      }, /*#__PURE__*/React.createElement(Bouton, {
        variante: "contour",
        onClick: () => setRepos(Object.assign({}, repos, {
          fin: repos.fin + 15000,
          total: repos.total + 15
        }))
      }, "+15 s"), /*#__PURE__*/React.createElement(Bouton, {
        onClick: () => {
          bipFait.current = true;
          setRepos(null);
        }
      }, "Passer")));
    }

    // — Choix de l'exercice —
    if (!ec) {
      const plan = planDe(data, enCours);
      const connus = nomsExos(data, enCours);
      const k = cleNom(saisie);
      const propositions = k ? connus.filter(n => cleNom(n).indexOf(k) !== -1 && !plan.some(p => cleNom(p) === cleNom(n))).slice(0, 4) : [];
      return /*#__PURE__*/React.createElement(Ecran, null, entete, bandeau, /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 28,
          display: "flex",
          flexDirection: "column",
          gap: 8
        }
      }, /*#__PURE__*/React.createElement(Etiquette, null, enCours.exos.length ? `${enCours.exos.length} fait${enCours.exos.length > 1 ? "s" : ""} · la suite` : "Premier exercice")), /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 12,
          flex: 1,
          overflowY: "auto"
        }
      }, plan.map(nom => {
        const c = consigne(dernierExo(data, nom, enCours));
        return /*#__PURE__*/React.createElement(Ligne, {
          key: nom,
          titre: nom,
          detail: c.poids == null ? "Première fois" : `${fmtKg(c.poids)} kg × ${c.reps}`,
          onClick: () => commencerExo(nom)
        });
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 24,
          display: "flex",
          flexDirection: "column",
          gap: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 15,
          color: T.gris
        }
      }, plan.length ? "Autre exercice" : "Quel exercice ?"), /*#__PURE__*/React.createElement("input", {
        value: saisie,
        onChange: e => setSaisie(e.target.value),
        onKeyDown: e => {
          if (e.key === "Enter") commencerExo(saisie);
        },
        placeholder: "Nom de l'exercice",
        enterKeyHint: "go",
        style: {
          height: 56,
          fontSize: 18,
          padding: "0 16px",
          borderRadius: 14,
          border: `1px solid ${T.bord}`,
          background: T.blanc,
          color: T.encre,
          fontFamily: "inherit",
          outline: "none"
        }
      }), propositions.map(n => /*#__PURE__*/React.createElement(Ligne, {
        key: n,
        titre: n,
        onClick: () => commencerExo(n)
      })), saisie.trim() && !propositions.some(n => cleNom(n) === k) && /*#__PURE__*/React.createElement(Bouton, {
        variante: "contour",
        onClick: () => commencerExo(saisie)
      }, "Commencer \xAB ", nomCanonique(saisie, connus), " \xBB"))));
    }

    // — Exercice en cours —
    const der = dernierExo(data, ec.nom, enCours);
    const c = consigne(der);
    const numero = enCours.exos.length + 1;
    return /*#__PURE__*/React.createElement(Ecran, null, entete, bandeau, /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 28,
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Etiquette, null, "Exercice ", numero, " \xB7 S\xE9rie ", Math.min(ec.sets.length + 1, ec.prevu), " sur ", ec.prevu), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 40,
        fontWeight: 600,
        lineHeight: 1.05,
        letterSpacing: "-0.02em",
        overflowWrap: "anywhere"
      }
    }, ec.nom)), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 22,
        padding: "16px 0",
        borderTop: `1px solid ${T.trait}`,
        borderBottom: `1px solid ${T.trait}`,
        display: "flex",
        flexDirection: "column",
        gap: 6
      }
    }, der && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        color: T.gris
      }
    }, texteDerniereFois(der)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 600,
        color: T.accent
      }
    }, c.texte)), ec.sets.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: MONO,
        fontSize: 14,
        color: T.gris,
        overflowWrap: "anywhere"
      }
    }, ec.sets.map(st => `${fmtKg(st.poids)}×${st.reps}`).join("  ")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: retirerSerie,
      style: {
        minHeight: 44,
        padding: "0 0 0 12px",
        background: "none",
        border: "none",
        fontSize: 14,
        color: T.gris,
        fontFamily: "inherit",
        flexShrink: 0
      }
    }, "Retirer la derni\xE8re")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 18,
        minHeight: 170
      }
    }, /*#__PURE__*/React.createElement(Compteur, {
      valeur: poids,
      onChange: setPoids,
      unite: "kg",
      pas: pasDeCharge({
        parBras: ec.parBras,
        poids: lireNombre(poids)
      }),
      decimal: true,
      label: "charge"
    }), /*#__PURE__*/React.createElement(Compteur, {
      valeur: reps,
      onChange: setReps,
      unite: "reps",
      pas: 1,
      label: "r\xE9p\xE9titions"
    })), erreur && /*#__PURE__*/React.createElement("div", {
      role: "alert",
      style: {
        fontSize: 15,
        color: T.erreur,
        textAlign: "center",
        marginBottom: 10
      }
    }, erreur), /*#__PURE__*/React.createElement(Bouton, {
      onClick: validerSerie
    }, ec.sets.length + 1 >= ec.prevu ? "Valider la dernière série" : "Valider la série"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10,
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement(Bouton, {
      variante: "texte",
      onClick: serieDePlus
    }, "S\xE9rie de plus"), /*#__PURE__*/React.createElement(Bouton, {
      variante: "texte",
      onClick: exoFini
    }, ec.sets.length ? "Exercice fini" : "Changer")));
  }

  // ═══ MENU ═══
  if (ecran === "menu") {
    const apercu = typeof location !== "undefined" && location.pathname.indexOf("/nouvelle/") !== -1;
    return /*#__PURE__*/React.createElement(Ecran, null, /*#__PURE__*/React.createElement(Retour, {
      titre: "Menu",
      onClick: () => setEcran("accueil")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement(Ligne, {
      titre: "Historique",
      detail: `${data.seances.length} séance${data.seances.length > 1 ? "s" : ""}`,
      onClick: () => setEcran("historique")
    }), /*#__PURE__*/React.createElement(Ligne, {
      titre: "Sauvegarde",
      detail: data.dernierExport ? `Dernière le ${dateCourte(data.dernierExport)}` : "Jamais faite",
      onClick: () => setEcran("sauvegarde")
    }), apercu && /*#__PURE__*/React.createElement(Ligne, {
      titre: "Revenir \xE0 l'ancienne version",
      onClick: () => {
        window.location.href = "../";
      }
    })));
  }

  // ═══ HISTORIQUE ═══
  if (ecran === "historique") {
    const liste = seancesTriees(data).reverse();
    return /*#__PURE__*/React.createElement(Ecran, null, /*#__PURE__*/React.createElement(Retour, {
      titre: "Historique",
      onClick: () => setEcran("menu")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12,
        flex: 1,
        overflowY: "auto"
      }
    }, !liste.length && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 17,
        color: T.gris,
        marginTop: 24
      }
    }, "Aucune s\xE9ance pour l'instant."), liste.map(s => /*#__PURE__*/React.createElement(Ligne, {
      key: s.id || s.date + s.nom,
      titre: s.nom,
      detail: `${dateCourte(s.date)}${s.duree ? ` · ${s.duree} min` : ""} · ${s.exos.length} exercice${s.exos.length > 1 ? "s" : ""}`,
      onClick: () => {
        setDetailId(s.id);
        setEcran("detail");
      }
    }))));
  }
  if (ecran === "detail") {
    const s = data.seances.find(x => x.id === detailId);
    if (!s) {
      return /*#__PURE__*/React.createElement(Ecran, null, /*#__PURE__*/React.createElement(Retour, {
        titre: "Historique",
        onClick: () => setEcran("historique")
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 17,
          color: T.gris,
          marginTop: 24
        }
      }, "Cette s\xE9ance n'existe plus."));
    }
    const supprimer = () => {
      if (!window.confirm(`Supprimer la séance ${s.nom} du ${dateCourte(s.date)} ? C'est définitif.`)) return;
      if (sauverData(Object.assign({}, data, {
        seances: data.seances.filter(x => x !== s)
      }))) setEcran("historique");
    };
    return /*#__PURE__*/React.createElement(Ecran, null, /*#__PURE__*/React.createElement(Retour, {
      titre: "Historique",
      onClick: () => setEcran("historique")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 20,
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Etiquette, null, dateLongue(s.date), s.duree ? ` · ${s.duree} min` : ""), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 40,
        fontWeight: 600,
        lineHeight: 1.05
      }
    }, s.nom)), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 20,
        flex: 1,
        overflowY: "auto"
      }
    }, s.exos.map((e, i) => /*#__PURE__*/React.createElement("div", {
      key: e.id || i,
      style: {
        padding: "14px 0",
        borderBottom: `1px solid ${T.trait}`,
        display: "flex",
        justifyContent: "space-between",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 17,
        fontWeight: 500
      }
    }, e.nom), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: MONO,
        fontSize: 15,
        color: e.pr ? T.accent : T.gris,
        textAlign: "right",
        flexShrink: 0
      }
    }, estCardio(e) ? `${e.dureeCardio || "?"} min` : `${resumeSeries(e) ? resumeSeries(e) + " · " : ""}${fmtKg(Number(e.poids) || 0)} kg`, e.pr ? " · record" : "")))), /*#__PURE__*/React.createElement(Bouton, {
      variante: "texte",
      onClick: supprimer,
      style: {
        color: T.erreur
      }
    }, "Supprimer cette s\xE9ance"));
  }

  // ═══ SAUVEGARDE ═══
  if (ecran === "sauvegarde") {
    return /*#__PURE__*/React.createElement(Ecran, null, /*#__PURE__*/React.createElement(Retour, {
      titre: "Sauvegarde",
      onClick: () => setEcran("menu")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 28,
        fontWeight: 600,
        lineHeight: 1.15
      }
    }, "Tes s\xE9ances ne vivent que sur ce t\xE9l\xE9phone."), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 17,
        color: T.gris,
        lineHeight: 1.45
      }
    }, "Une sauvegarde est un fichier chiffr\xE9 \xE0 ranger dans Fichiers ou \xE0 t'envoyer. ", data.dernierExport ? `Dernière : ${dateLongue(data.dernierExport).toLowerCase()}.` : "Tu n'en as jamais fait.")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Bouton, {
      onClick: exporter
    }, "Faire une sauvegarde"), /*#__PURE__*/React.createElement(Bouton, {
      variante: "contour",
      onClick: () => fichierRef.current && fichierRef.current.click()
    }, "Restaurer une sauvegarde"), /*#__PURE__*/React.createElement("input", {
      ref: fichierRef,
      type: "file",
      accept: "application/json,.json",
      style: {
        display: "none"
      },
      onChange: e => {
        restaurer(e.target.files && e.target.files[0]);
        e.target.value = "";
      }
    })));
  }

  // ═══ CHOIX DE LA SÉANCE ═══
  if (ecran === "choix") {
    const noms = nomsSeances(data);
    return /*#__PURE__*/React.createElement(Ecran, null, /*#__PURE__*/React.createElement(Retour, {
      titre: "Quelle s\xE9ance ?",
      onClick: () => setEcran("accueil")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12,
        flex: 1,
        overflowY: "auto"
      }
    }, noms.map(n => /*#__PURE__*/React.createElement(Ligne, {
      key: n,
      titre: n,
      onClick: () => demarrer(n)
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 24,
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        color: T.gris
      }
    }, noms.length ? "Ou une nouvelle" : "Donne-lui un nom"), /*#__PURE__*/React.createElement("input", {
      value: nomSeance,
      onChange: e => setNomSeance(e.target.value),
      onKeyDown: e => {
        if (e.key === "Enter") demarrer(nomSeance);
      },
      placeholder: "Pull, Jambes, Haut du corps\u2026",
      enterKeyHint: "go",
      style: {
        height: 56,
        fontSize: 18,
        padding: "0 16px",
        borderRadius: 14,
        border: `1px solid ${T.bord}`,
        background: T.blanc,
        color: T.encre,
        fontFamily: "inherit",
        outline: "none"
      }
    }), nomSeance.trim() && /*#__PURE__*/React.createElement(Bouton, {
      onClick: () => demarrer(nomSeance)
    }, "D\xE9marrer \xAB ", nomPropre(nomSeance), " \xBB"))));
  }

  // ═══ ACCUEIL ═══
  const sj = seanceDuJour(data, aujourdhui);
  const jSauv = joursSansSauvegarde(data, aujourdhui);
  let titre, sousTitre, action;
  if (sj.etat === "premiere") {
    titre = "Première séance";
    sousTitre = "Donne-lui un nom et c'est parti.";
    action = /*#__PURE__*/React.createElement(Bouton, {
      onClick: () => setEcran("choix")
    }, "Commencer");
  } else if (sj.etat === "faite") {
    titre = "C'est fait";
    sousTitre = `${sj.seance.nom}${sj.seance.duree ? `, ${sj.seance.duree} min` : ""}. Récupère bien.`;
    action = /*#__PURE__*/React.createElement(Bouton, {
      variante: "contour",
      onClick: () => setEcran("choix")
    }, "Nouvelle s\xE9ance");
  } else {
    titre = sj.nom;
    sousTitre = texteDepuis(sj.depuis);
    action = /*#__PURE__*/React.createElement(Bouton, {
      onClick: () => demarrer(sj.nom)
    }, "D\xE9marrer");
  }
  return /*#__PURE__*/React.createElement(Ecran, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: 44
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: T.gris
    }
  }, dateLongue(aujourdhui)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Menu",
    onClick: () => setEcran("menu"),
    style: {
      width: 44,
      height: 44,
      marginRight: -10,
      background: "none",
      border: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: T.encre,
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 7h16M4 12h16M4 17h16"
  })))), bandeau, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Etiquette, null, "Aujourd'hui"), /*#__PURE__*/React.createElement("div", {
    className: "titre-geant"
  }, titre), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      lineHeight: 1.4,
      color: T.gris
    }
  }, sousTitre)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, rappelSauvegarde(data, aujourdhui) && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setEcran("sauvegarde"),
    style: {
      minHeight: 44,
      background: "none",
      border: "none",
      fontSize: 15,
      color: T.accent,
      fontFamily: "inherit"
    }
  }, jSauv === Infinity ? "Tes séances ne sont sauvegardées nulle part" : `Pas de sauvegarde depuis ${jSauv} jours`), action, sj.etat !== "premiere" && sj.etat !== "faite" && /*#__PURE__*/React.createElement(Bouton, {
    variante: "texte",
    onClick: () => setEcran("choix")
  }, "Autre s\xE9ance")));
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Racine));