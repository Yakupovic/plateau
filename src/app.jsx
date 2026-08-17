// PLATEAU — source unique de l app (JSX). Compilé par build.mjs vers app.js

const { useState, useEffect, useRef, useMemo } = React;

// ————— Icônes (emoji + glyphes, même signature que lucide) —————
// ICON_SCALE compense l'agrandissement global de l'UI (root 19px vs 16px de base) :
// sans ça, les icônes restent à taille fixe pendant que texte/paddings grandissent -> décalages visuels.
const ICON_SCALE = 19 / 16;
const sc = (n) => Math.round(n * ICON_SCALE);
const IcE = (ch, dy) => ({ size = 16, style, className }) => {
  size = sc(size);
  return (
  <span
    className={className}
    style={{
      fontSize: Math.round(size * 0.95),
      lineHeight: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      opacity: style && (style.color === "#8f8f98" || style.color === "#2b2b33") ? 0.45 : 1,
      transform: dy ? `translateY(${dy}px)` : undefined,
      ...(style || {}),
      color: undefined,
    }}
  >{ch}</span>
  );
};
const IcT = (ch) => ({ size = 16, style, className, color }) => { size = sc(size); return (
  <span
    className={className}
    style={{
      fontSize: size,
      lineHeight: 1,
      fontWeight: 800,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      color: (style && style.color) || color || "currentColor",
      ...(style || {}),
    }}
  >{ch}</span>
  );
};
const Home = IcE("🏠");
const Dumbbell = IcE("🏋️");
const HistoryIcon = IcE("🕘");
const TrendingUp = IcE("📈");
const Plus = IcT("＋");
const Minus = IcT("－");
const X = IcT("✕");
const Send = IcE("📨");
const ChevronDown = IcT("▾");
const ChevronUp = IcT("▴");
const Droplets = IcE("💧");
const Play = IcT("▶");
const Check = ({ size = 16, style, className, color }) => { size = sc(size); return (
  <span className={className} style={{ fontSize: size, lineHeight: 1, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, color: (style && style.color) || color || "currentColor", ...(style || {}) }}>✓</span>
); };
const Trash2 = IcE("🗑️");
const Sparkles = IcE("✨");
const Moon = IcE("🌙");
const Utensils = IcE("🍽️");
const ShowerHead = IcE("🚿");
const Camera = IcE("📷");
const Pencil = IcE("✏️");
const Trophy = IcE("🏆");
const Copy = IcE("📋");
const Upload = IcE("⤴️");
const Scale = IcE("⚖️");
const Flame = IcE("🔥");
const Share2 = IcE("📤");
const Calendar = IcE("📅");
const Ruler = IcE("📏");

// ————— Mini graphique SVG (remplace recharts) —————
function MiniLine({ data, dataKey, color, height = 220, refY = null }) {
  if (!data || !data.length) return null;
  const W = 340, H = height, padL = 34, padR = 12, padT = 16, padB = 24;
  const vals = data.map((d) => d[dataKey]);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (refY != null) { min = Math.min(min, refY); max = Math.max(max, refY); }
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  min -= span * 0.12; max += span * 0.12;
  const x = (i) => (data.length === 1 ? padL + (W - padL - padR) / 2 : padL + (i / (data.length - 1)) * (W - padL - padR));
  const y = (v) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
  const fmtV = (v) => String(Math.round(v * 10) / 10).replace(".", ",");
  const grid = [0.25, 0.5, 0.75].map((f) => min + f * (max - min));
  const showXEvery = data.length <= 6 ? 1 : Math.ceil(data.length / 6);
  const textColor = color === C.yellow ? C.yellowDim : color; // lisibilité sur fond clair
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {grid.map((g, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={y(g)} y2={y(g)} stroke={C.line} strokeDasharray="3 3" strokeWidth="1" />
          <text x={padL - 4} y={y(g) + 3} fontSize="9" fill={C.dim} textAnchor="end">{fmtV(g)}</text>
        </g>
      ))}
      {refY != null && (
        <line x1={padL} x2={W - padR} y1={y(refY)} y2={y(refY)} stroke={C.yellowDim} strokeDasharray="6 4" strokeWidth="1.5" />
      )}
      {data.length > 1 && (
        <polyline
          points={data.map((d, i) => `${x(i)},${y(d[dataKey])}`).join(" ")}
          fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
        />
      )}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d[dataKey])} r="4" fill={color} stroke="#fff" strokeWidth="1.5" />
          {data.length <= 8 && (
            <text x={x(i)} y={y(d[dataKey]) - 8} fontSize="9" fontWeight="700" fill={textColor} textAnchor="middle">{fmtV(d[dataKey])}</text>
          )}
          {i % showXEvery === 0 && (
            <text x={x(i)} y={H - 8} fontSize="9" fill={C.dim} textAnchor="middle">{d.date}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ————— Palette "plateau de muscu" (sol caoutchouc + jaune machines guidées) —————
const C = {
  bg: "#f6f4ef",
  card: "#ffffff",
  card2: "#efece3",
  line: "#e2ded2",
  hair: "rgba(20,16,8,0.12)",
  yellow: "#f5c518",
  yellowHi: "#ffe27a",
  yellowDim: "#8a5b00",
  text: "#211f1a",
  dim: "#726c5e",
  green: "#178a4c",
  red: "#c93a2e",
};

const DISPLAY = { fontFamily: "'Anton', 'Arial Narrow', system-ui, sans-serif", letterSpacing: "0.02em" };
const NUMS = { fontVariantNumeric: "tabular-nums" };
const OBJECTIF_POIDS = 70; // kg, objectif de poids de corps
const POIDS_DEFAUT = 63; // poids de corps de référence tant qu'aucune pesée n'est saisie
const ZONES = ["Bras", "Torse", "Cuisse", "Taille"];

// ————— Données de démarrage (vierges — aucune donnée personnelle dans le code) —————
const SEED = [];
const SEED_DATA = { seances: SEED, prochaine: null };

// ————— Fréquentation salle (base de comptage, ajustable dans l app via +/-) —————
const PASSAGES_BASE = 26; // relevé le 02/08/2026 : niveau MACHINE atteint
const PASSAGES_BASE_DATE = "2026-08-02";

// ————— Helpers —————
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtKg = (n) => String(Math.round(n * 10) / 10).replace(".", ",");
const fmtRepos = (s) => (s == null ? "—" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
const fmtDuree = (m) => (m == null ? null : m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `${m} min`);
const fmtDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
const fmtShort = (iso) => iso.slice(8, 10) + "/" + iso.slice(5, 7);

const exoLine = (e) =>
  e.type === "cardio"
    ? `${e.nom} : ${e.dureeCardio} min` +
      `${e.distance ? `, ${fmtKg(e.distance)} km` : ""}` +
      `${e.niveau ? `, niveau ${e.niveau}` : ""}` +
      `${e.ressenti ? ` (${e.ressenti === "marge" ? "facile" : "ça piquait"})` : ""}` +
      `${e.note ? ` — ${e.note}` : ""}`
    : `${e.nom} : ${e.series}×${e.reps} @ ${fmtKg(e.poids)} kg${e.parBras ? "/bras" : ""}` +
  `${e.reposSec ? `, repos ${fmtRepos(e.reposSec)}` : ""}` +
  `${e.rpe ? `, RPE ${e.rpe}/10` : ""}` +
  `${e.dureeMin ? `, ~${e.dureeMin} min sur l'exo` : ""}` +
  `${e.ressenti ? ` (${e.ressenti === "marge" ? "de la marge" : "ça tirait"})` : ""}` +
  `${e.pr ? " [RECORD PERSO]" : ""}` +
  `${e.note ? ` — ${e.note}` : ""}`;
const histText = (seances, n = 5) =>
  seances.slice(-n).map((s) =>
    `${s.date} — Séance ${s.nom}${s.duree ? `, ${fmtDuree(s.duree)}` : ""}${s.gourdes != null ? `, ${s.gourdes} gourde(s)` : ""}\n` +
    (s.note ? `  Note de l’utilisateur : ${s.note}\n` : "") +
    s.exos.map((e) => "  - " + exoLine(e)).join("\n")
  ).join("\n\n");

// ————— Dates locales + récup —————
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayISO = () => isoOf(new Date());
const ALIM_LABELS = { leger: "léger", correct: "correct", solide: "solide" };
const joursDepuis = (iso) => Math.round((new Date(todayISO()) - new Date(iso)) / 86400000);
const recupText = (d) => {
  const jours = d.jours || {};
  const lignes = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(); dt.setDate(dt.getDate() - i);
    const iso = isoOf(dt);
    const j = jours[iso] || {};
    const seances = d.seances.filter((s) => s.date === iso);
    const parts = [];
    parts.push(seances.length ? `séance ${seances.map((s) => s.nom).join(" + ")}` : "repos (pas de séance)");
    if (j.sommeil != null) parts.push(`sommeil ${fmtKg(j.sommeil)} h`);
    if (j.eau) parts.push(`eau ${fmtKg(j.eau)} L`);
    if (j.douche) parts.push("douche faite");
    const dents = (j.dentsMatin ? 1 : 0) + (j.dentsSoir ? 1 : 0);
    if (dents) parts.push(`dents ${dents}/2`);
    const visage = (j.visageMatin ? 1 : 0) + (j.visageSoir ? 1 : 0);
    if (visage) parts.push(`soins visage ${visage}/2`);
    lignes.push(`${iso} : ${parts.join(", ")}`);
  }
  return lignes.join("\n");
};

// ————— Streak hebdomadaire (semaines consécutives à 2+ séances) —————
const mondayOf = (iso) => {
  const d = new Date(iso + "T12:00:00");
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return isoOf(d);
};
const streakSemaines = (d) => {
  const parSemaine = {};
  d.seances.forEach((s) => { const k = mondayOf(s.date); parSemaine[k] = (parSemaine[k] || 0) + 1; });
  const cur = mondayOf(todayISO());
  let streak = (parSemaine[cur] || 0) >= 2 ? 1 : 0;
  const w = new Date(cur + "T12:00:00");
  while (true) {
    w.setDate(w.getDate() - 7);
    if ((parSemaine[isoOf(w)] || 0) >= 2) streak++;
    else break;
  }
  return streak;
};

// ————— Groupes musculaires (détection auto par nom d'exo) —————
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const contientMot = (n, p) => new RegExp(`(^|[^a-z0-9])${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(n);

// Score de ressemblance entre deux noms d'exercice (0 \u00e0 1) \u2014 ignore les mots g\u00e9n\u00e9riques
// ("machine", "guid\u00e9e"...) qui font croire \u00e0 deux exos diff\u00e9rents alors que c'est le m\u00eame.
const MOTS_GENERIQUES = new Set(["machine", "guidee", "guide", "assistee", "assiste", "poulie", "appareil"]);
const motsSignificatifs = (nom) => norm(nom).split(/[^a-z0-9]+/).filter((m) => m.length > 2);
const scoreRessemblance = (nomA, nomB) => {
  const motsA = motsSignificatifs(nomA);
  const motsB = motsSignificatifs(nomB);
  if (!motsA.length || !motsB.length) return 0;
  const utiles = (mots) => { const u = mots.filter((m) => !MOTS_GENERIQUES.has(m)); return u.length ? u : mots; };
  const uA = utiles(motsA), uB = utiles(motsB);
  const communs = uA.filter((m) => uB.some((x) => x.startsWith(m) || m.startsWith(x))).length;
  return communs / Math.max(1, Math.min(uA.length, uB.length));
};
const MUSCLE_PATTERNS = [
  ["Jambes", ["jambe", "squat", "presse", "leg", "fente", "mollet", "calf", "ischio", "hack", "cuisse", "quad", "abduc", "adduc"]],
  ["Épaules", ["shoulder", "epaule", "elevation", "militaire", "reverse fly", "face pull", "lateral"]],
  ["Dos", ["tirage", "row", "pull", "traction", "dorsa", "lombaire"]],
  ["Triceps", ["triceps", "corde", "front", "skull", "pushdown", "kickback", "extension"]],
  ["Biceps", ["curl", "biceps", "marteau", "ez"]],
  ["Pecs", ["pec", "couche", "incline", "convergent", "ecart", "dips", "pompe", "butterfly", "chest", "developpe"]],
];
const MUSCLE_ORDRE = ["Pecs", "Dos", "Épaules", "Biceps", "Triceps", "Jambes", "Autre"];
const muscleOf = (nom) => {
  const n = norm(nom);
  for (const [g, pats] of MUSCLE_PATTERNS) if (pats.some((p) => contientMot(n, p))) return g;
  return "Autre";
};
const volumeMuscles7j = (d, extraExos = []) => {
  const depuis = new Date(); depuis.setDate(depuis.getDate() - 6);
  const isoMin = isoOf(depuis);
  const counts = {};
  const add = (exos) => exos.forEach((e) => { const m = muscleOf(e.nom); counts[m] = (counts[m] || 0) + (e.series || 0); });
  d.seances.filter((s) => s.date >= isoMin).forEach((s) => add(s.exos));
  add(extraExos);
  return counts;
};
const musclesText = (d) => {
  const v = volumeMuscles7j(d);
  return MUSCLE_ORDRE.filter((m) => m !== "Autre" || v[m]).map((m) => `${m} ${v[m] || 0}`).join(", ");
};

// ————— Poids de corps + mensurations —————
const poidsText = (d) => {
  const arr = d.poids || [];
  if (!arr.length) return `Poids de corps : pas encore renseigné (objectif ${OBJECTIF_POIDS} kg, prise de masse).`;
  const last = arr[arr.length - 1];
  const prev = arr.length > 1 ? arr[arr.length - 2] : null;
  return `Poids de corps : ${fmtKg(last.kg)} kg le ${last.date}` +
    (prev ? ` (précédent : ${fmtKg(prev.kg)} kg le ${prev.date})` : "") +
    ` — objectif ${OBJECTIF_POIDS} kg.`;
};
const mensuText = (d) => {
  const arr = d.mensu || [];
  if (!arr.length) return "";
  const derniers = ZONES.map((z) => {
    const zs = arr.filter((m) => m.zone === z);
    if (!zs.length) return null;
    const last = zs[zs.length - 1];
    return `${z} ${fmtKg(last.cm)} cm (${last.date})`;
  }).filter(Boolean);
  return derniers.length ? `Mensurations : ${derniers.join(", ")}.` : "";
};

// ————— Échauffement, 1RM estimé, objectifs —————
const arrondi25 = (v) => Math.round(v / 2.5) * 2.5;
const echauffementPaliers = (cible) => {
  if (cible < 15) return null; // trop léger pour un vrai protocole, une série à vide suffit
  return [
    { pct: 40, poids: Math.max(2.5, arrondi25(cible * 0.4)), reps: 12 },
    { pct: 60, poids: Math.max(2.5, arrondi25(cible * 0.6)), reps: 8 },
    { pct: 80, poids: Math.max(2.5, arrondi25(cible * 0.8)), reps: 4 },
  ];
};
const echauffementPour = (cible) => {
  const p = echauffementPaliers(cible);
  return p ? p.map((s) => `${fmtKg(s.poids)}×${s.reps}`).join(" → ") : "1 série légère × 15";
};
const epley = (p, r) => p * (1 + r / 30);
const best1RM = (d, nom) => {
  const list = d.seances.flatMap((s) => s.exos).filter((e) => e.nom.toLowerCase() === nom.toLowerCase());
  let m = null;
  list.forEach((e) => {
    const sets = e.sets && e.sets.length ? e.sets : [{ poids: e.poids, reps: e.reps }];
    sets.forEach((s) => { const v = epley(s.poids, s.reps || 1); if (m == null || v > m) m = v; });
  });
  return m;
};
const recordOf = (d, nom) => {
  const list = d.seances.flatMap((s) => s.exos).filter((e) => e.nom.toLowerCase() === nom.toLowerCase()).map((e) => e.poids);
  return list.length ? Math.max(...list) : null;
};
const objectifsText = (d) => {
  const arr = d.objectifs || [];
  if (!arr.length) return "";
  return "Objectifs de charge fixés par l’utilisateur : " + arr.map((o) => {
    const rec = recordOf(d, o.nom);
    return `${o.nom} ${fmtKg(o.cible)} kg${rec != null ? ` (record actuel ${fmtKg(rec)} kg)` : ""}`;
  }).join(", ") + ".";
};

// ————— Stagnation, cibles, échauffement de séance —————
const stagnationsDe = (d) => {
  const parExo = {};
  d.seances.forEach((s) =>
    s.exos.forEach((e) => {
      if (e.type === "cardio") return;
      const k = e.nom.toLowerCase();
      (parExo[k] = parExo[k] || { nom: e.nom, hist: [] }).hist.push(e);
    })
  );
  return Object.values(parExo)
    .filter((x) => {
      if (x.hist.length < 3) return false;
      const l3 = x.hist.slice(-3);
      return l3.every((e) => e.poids === l3[0].poids) && l3.slice(-2).some((e) => e.ressenti === "tirait");
    })
    .map((x) => ({ nom: x.nom, poids: x.hist[x.hist.length - 1].poids }));
};
const stagText = (d) => {
  const st = stagnationsDe(d);
  return st.length
    ? `Exercices en plateau (3 séances à la même charge avec "ça tirait") : ${st.map((s) => `${s.nom} à ${fmtKg(s.poids)} kg`).join(", ")}. Propose une stratégie de déblocage quand c'est pertinent (deload -10 %, tempo, ou variante).`
    : "";
};
const ciblesText = (d) => {
  const c = d.ciblesMuscles || {};
  const ks = Object.keys(c);
  return ks.length ? `Cibles de volume hebdo fixées par l’utilisateur : ${ks.map((k) => `${k} ${c[k]} séries`).join(", ")}.` : "";
};
const ECHAUFFEMENTS = {
  jambes: ["5 min de vélo ou tapis", "Mobilité hanches : cercles + fentes dynamiques", "Chevilles et genoux : rotations douces", "1 série très légère sur ton premier exo"],
  push: ["5 min de rameur ou tapis", "Rotations d'épaules, bras tendus puis pliés", "Mobilité poignets", "1 série très légère sur ton premier exo"],
  pull: ["5 min de rameur", "Omoplates : rétractions épaules basses", "Poignets et avant-bras", "1 série très légère sur ton premier exo"],
  bras: ["3-5 min de cardio léger", "Rotations poignets et coudes", "1 série très légère curl + extension"],
  defaut: ["5 min de cardio léger", "Mobilité des articulations sollicitées", "1 série très légère sur ton premier exo"],
};
const echauffementPourSeance = (nom) => {
  const n = norm(nom);
  if (n.includes("jambe") || n.includes("leg")) return ECHAUFFEMENTS.jambes;
  if (n.includes("push") || n.includes("pec") || n.includes("torse")) return ECHAUFFEMENTS.push;
  if (n.includes("pull") || n.includes("dos")) return ECHAUFFEMENTS.pull;
  if (n.includes("bras")) return ECHAUFFEMENTS.bras;
  return ECHAUFFEMENTS.defaut;
};

// ————— Périodisation : 3 semaines de montée, 1 semaine allégée —————
const CYCLE_SEMAINES = 4;
const cycleDe = (d) => {
  const debut = d.cycleDebut || (d.seances && d.seances[0] && d.seances[0].date) || todayISO();
  const jours = Math.max(0, Math.floor((new Date(todayISO()) - new Date(debut)) / 86400000));
  const semTotal = Math.floor(jours / 7) + 1;
  const sem = ((semTotal - 1) % CYCLE_SEMAINES) + 1;
  return { debut, sem, cycle: Math.floor((semTotal - 1) / CYCLE_SEMAINES) + 1, deload: sem === CYCLE_SEMAINES };
};
const cycleText = (d) => {
  const c = cycleDe(d);
  return c.deload
    ? `Cycle ${c.cycle}, semaine ${c.sem}/${CYCLE_SEMAINES} : SEMAINE ALLÉGÉE (charges -10 %, 3 séries au lieu de 4) pour récupérer avant de repartir.`
    : `Cycle ${c.cycle}, semaine ${c.sem}/${CYCLE_SEMAINES} : phase de montée en charge.`;
};

// ————— Équilibre entre groupes opposés —————
const SOUS_JAMBES = (nom) => {
  const n = norm(nom);
  if (/curl|ischio|souleve|romain|hamstring/.test(n)) return "Ischios";
  if (/mollet|calf/.test(n)) return "Mollets";
  if (/abduc|adduc/.test(n)) return "Hanches";
  return "Quadriceps";
};
const volumeFin = (d, jours = 14, extra = []) => {
  const dep = new Date(); dep.setDate(dep.getDate() - (jours - 1));
  const min = isoOf(dep);
  const v = {};
  const add = (exos) => exos.forEach((e) => {
    if (e.type === "cardio") return;
    const g = muscleOf(e.nom);
    const clef = g === "Jambes" ? SOUS_JAMBES(e.nom) : g;
    v[clef] = (v[clef] || 0) + (e.series || 0);
  });
  d.seances.filter((s) => s.date >= min).forEach((s) => add(s.exos));
  add(extra);
  return v;
};
const PAIRES = [
  { label: "Poussée / Tirage", a: ["Pecs", "Épaules", "Triceps"], b: ["Dos", "Biceps"], ideal: 1, tol: 0.35 },
  { label: "Biceps / Triceps", a: ["Biceps"], b: ["Triceps"], ideal: 1, tol: 0.4 },
  { label: "Quadriceps / Ischios", a: ["Quadriceps"], b: ["Ischios"], ideal: 1.3, tol: 0.5 },
];
const equilibres = (d, extra = []) => {
  const v = volumeFin(d, 14, extra);
  const somme = (ks) => ks.reduce((t, k) => t + (v[k] || 0), 0);
  return PAIRES.map((pr) => {
    const a = somme(pr.a), b = somme(pr.b);
    if (a + b === 0) return { ...pr, a, b, etat: "vide" };
    const ratio = b === 0 ? 99 : a / b;
    const ecart = ratio / pr.ideal;
    const etat = ecart > 1 + pr.tol ? "tropA" : ecart < 1 / (1 + pr.tol) ? "tropB" : "ok";
    return { ...pr, a, b, ratio, etat };
  });
};
const equilibreText = (d) => {
  const eq = equilibres(d).filter((e) => e.etat !== "vide");
  if (!eq.length) return "";
  return "Équilibre sur 14 jours : " + eq.map((e) => {
    const [n1, n2] = e.label.split(" / ");
    return `${e.label} ${e.a}/${e.b} séries` + (e.etat === "tropA" ? ` (trop de ${n1.toLowerCase()})` : e.etat === "tropB" ? ` (trop de ${n2.toLowerCase()})` : " (équilibré)");
  }).join(", ") + ".";
};

// ————— Volume total (uniquement pour la courbe de tendance en Progression) —————
const volumeExo = (e) => {
  if (e.type === "cardio") return 0;
  const m = e.parBras ? 2 : 1;
  if (e.sets && e.sets.length) return e.sets.reduce((a, s) => a + s.poids * s.reps, 0) * m;
  return (e.poids || 0) * (e.series || 0) * (e.reps || 0) * m;
};
const tonnageSeance = (s) => Math.round((s.exos || []).reduce((a, e) => a + volumeExo(e), 0));

// volumeFin découpe les jambes en sous-groupes (Quadriceps/Ischios/…) :
// ici on ré-agrège en gros groupes pour la reco, le radar et les comparaisons.
const JAMBES_SOUS = ["Quadriceps", "Ischios", "Mollets", "Hanches"];
const volumeGros = (d, jours = 30, extra = []) => {
  const v = volumeFin(d, jours, extra);
  const out = {};
  Object.keys(v).forEach((k) => {
    const clef = JAMBES_SOUS.indexOf(k) !== -1 ? "Jambes" : k;
    out[clef] = (out[clef] || 0) + v[k];
  });
  return out;
};

// ————— Le cerveau : quelle séance faire aujourd'hui ? —————
// Croise le repos, les muscles négligés (30 j) et la dernière séance faite.
const GROUPES_SEANCE = {
  "Jambes": ["Jambes"],
  "Push": ["Pecs", "Épaules", "Triceps"],
  "Pull": ["Dos", "Biceps"],
  "Bras": ["Biceps", "Triceps"],
  "Dos-Épaules": ["Dos", "Épaules"],
};
const seanceConseillee = (d) => {
  const dernier = d.seances.length ? [...d.seances].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-1)[0] : null;
  const repos = dernier ? joursDepuis(dernier.date) : null;

  // Repos : deux jours d'affilée sur le même thème = mauvaise idée
  if (repos === 0) return { type: "repos", titre: "Repos", raison: "Tu as déjà chargé aujourd'hui — le muscle pousse pendant la récup." };

  const v30 = volumeGros(d, 30);
  // score : plus le groupe est négligé, plus il remonte
  const scores = Object.entries(GROUPES_SEANCE).map(([nom, groupes]) => {
    const vol = groupes.reduce((a, g) => a + (v30[g] || 0), 0);
    const parGroupe = vol / groupes.length;
    const memeQueDernier = dernier && dernier.nom.toLowerCase() === nom.toLowerCase();
    return { nom, groupes, parGroupe, penalite: memeQueDernier ? 1000 : 0 };
  }).sort((a, b) => (a.parGroupe + a.penalite) - (b.parGroupe + b.penalite));

  const best = scores[0];
  const vide = best.groupes.filter((g) => !(v30[g] || 0));
  const raison = vide.length
    ? `${vide.join(" et ")} : rien depuis 30 jours.`
    : `${best.groupes[0]} est ton groupe le moins servi en ce moment.`;
  const urgence = repos != null && repos >= 5 ? `Ça fait ${repos} jours — on y retourne.` : null;
  return { type: "seance", titre: best.nom, raison, urgence, repos };
};

// Salutation selon l'heure
const salutation = () => {
  const h = new Date().getHours();
  if (h < 5) return "Encore debout ?";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon aprèm";
  if (h < 22) return "Bonsoir";
  return "Bonne nuit";
};
const OBJ_SEANCES_DEFAUT = 3; // objectif de séances par semaine par défaut
const seancesCetteSemaine = (d) => {
  const cur = mondayOf(todayISO());
  return d.seances.filter((s) => mondayOf(s.date) === cur).length;
};
const volumeSemaines = (d, n = 8) => {
  const parSem = {};
  d.seances.forEach((s) => {
    const k = mondayOf(s.date);
    parSem[k] = (parSem[k] || 0) + s.exos.reduce((a, e) => a + volumeExo(e), 0);
  });
  return Object.keys(parSem).sort().slice(-n).map((k) => ({ date: fmtShort(k), kg: Math.round(parSem[k]) }));
};

// ————— Contexte complet envoyé au coach —————
const buildContext = (d) =>
  `Historique des séances :\n${histText(d.seances)}\n\n` +
  `Récup des 7 derniers jours :\n${recupText(d)}\n\n` +
  `Séries des 7 derniers jours par groupe musculaire : ${musclesText(d)}\n` +
  `Streak : ${streakSemaines(d)} semaine(s) consécutive(s) avec au moins 2 séances.\n` +
  (d.prochaine ? `Prochaine séance planifiée : ${d.prochaine.nom} le ${d.prochaine.date}.\n` : "") +
  poidsText(d) +
  (mensuText(d) ? `\n${mensuText(d)}` : "") +
  (objectifsText(d) ? `\n${objectifsText(d)}` : "") +
  (stagText(d) ? `\n${stagText(d)}` : "") +
  `\n${cycleText(d)}` +
  (equilibreText(d) ? `\n${equilibreText(d)}` : "") +
  (ciblesText(d) ? `\n${ciblesText(d)}` : "");

const COACH_BASE = (passages) =>
  `Tu es le coach de musculation personnel de l’utilisateur, qui s'entraîne en salle sur machines guidées. ` +
  `Tu tutoies, ton direct, naturel et chaleureux, en français. Réponds UNIQUEMENT en phrases simples : pas de listes, pas de markdown, pas d'émojis. ` +
  `Règles de progression : ressenti "de la marge" = proposer +2 à 2,5 kg la prochaine fois ; "ça tirait" = garder la même charge. ` +
  `Il n'a encore jamais travaillé les jambes (première séance Jambes prévue le 22/07/2026) : encourage-le quand c'est pertinent, sans le harceler. ` +
  `La douche rapide juste après la séance compte beaucoup pour lui (santé de la peau) : glisse un rappel en fin de séance si elle n'est pas notée comme faite. ` +
  `Tiens compte de son sommeil, de son alimentation et de l'espacement de ses séances quand ces infos sont fournies : moins de 6 h de sommeil ou une alimentation légère un jour de séance méritent un conseil. ` +
  `Objectif de poids de corps : ${OBJECTIF_POIDS} kg (prise de masse, entraînement 100 % naturel). Quand un record perso est signalé, félicite sobrement. ` +
  `Date du jour : ${new Date().toLocaleDateString("fr-FR")}. ` +
  (passages != null
    ? `Assiduité : ${passages} passages en salle, prochain palier à 25 (puis 50) — motive-le dessus quand c'est pertinent, sans en faire trop.`
    : "");

const getApiKey = () => { try { return localStorage.getItem("pl:apikey") || ""; } catch { return ""; } };
async function askCoach(prompt) {
  const key = getApiKey();
  if (!key) { const err = new Error("noapi"); err.noapi = true; throw err; }
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) throw new Error("api " + r.status);
  const d = await r.json();
  const t = (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  if (!t) throw new Error("empty");
  return t;
}
const COACH_DISPO = false;
const MSG_NOAPI = "Coach integre non connecte : ajoute ta cle API dans la carte Coach integre sur l'accueil, ou pose ta question a Claude directement.";

// ————— Photos des machines (compressées pour le stockage) —————
const photoCache = {};
const compressImage = (file, maxSide = 800, quality = 0.6) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (err) { reject(err); }
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
const supprimerPhoto = (photoId) => {
  if (!photoId) return;
  if (window.storage) window.storage.delete("plateau-photo-" + photoId).catch(() => {});
  delete photoCache[photoId];
};

function PhotoThumb({ photoId, onView, size = 46 }) {
  const [src, setSrc] = useState(photoId ? photoCache[photoId] || null : null);
  useEffect(() => {
    if (!photoId) { setSrc(null); return; }
    if (photoCache[photoId]) { setSrc(photoCache[photoId]); return; }
    let ok = true;
    (async () => {
      try {
        if (!window.storage) return;
        const r = await window.storage.get("plateau-photo-" + photoId);
        photoCache[photoId] = r.value;
        if (ok) setSrc(r.value);
      } catch {}
    })();
    return () => { ok = false; };
  }, [photoId]);
  if (!photoId || !src) return null;
  return (
    <img
      src={src}
      alt="Machine"
      onClick={() => onView && onView(src)}
      className="rounded-lg object-cover shrink-0"
      style={{ width: size, height: size, border: `1px solid ${C.line}` }}
    />
  );
}

// ————— Schémas de mouvement —————
const SCH = { machine: "#4a4a54", body: "#232128", ghost: "#a5a1b0", arrow: "#8a5b00" };

const MOUVEMENTS = [
  ["presse", ["presse", "leg press", "hack"]],
  ["extension-jambes", ["leg extension", "extension jambe", "extension cuisse", "quadriceps"]],
  ["curl-jambes", ["leg curl", "ischio", "curl jambe", "curl allonge"]],
  ["mollets", ["mollet", "calf"]],
  ["squat", ["squat", "fente"]],
  ["abducteurs", ["abducteur", "adducteur", "abduction", "abduc", "adduc"]],
  ["ouverture", ["reverse fly", "oiseau", "reverse", "face pull"]],
  ["ecartes", ["pec deck", "ecart", "fly", "butterfly"]],
  ["pulldown", ["pull down", "pulldown", "traction", "lat machine"]],
  ["row", ["row", "tirage", "rowing"]],
  ["press", ["shoulder", "press", "developpe", "militaire", "convergente", "dips", "pompe"]],
  ["triceps", ["triceps", "corde", "barre au front", "skull", "pushdown", "kickback"]],
  ["curl", ["curl", "biceps", "marteau"]],
  ["elevation", ["elevation", "lateral"]],
];
const mouvementOf = (nom) => {
  const n = norm(nom || "");
  for (const [k, pats] of MOUVEMENTS) if (pats.some((p) => contientMot(n, p))) return k;
  return "generique";
};

const TECHNIQUE = {
  presse: ["Dos et bassin plaqués au dossier, jamais décollés", "Pieds largeur épaules, au milieu du plateau", "Ne verrouille pas les genoux en fin de poussée", "Descends jusqu'à 90° au genou, pas plus bas au début"],
  "extension-jambes": ["Dos calé, mains sur les poignées", "Rouleau juste au-dessus du coup de pied", "Monte sans à-coup, marque une pause en haut", "Redescends lentement, ne lâche pas la charge"],
  "curl-jambes": ["Rouleau au-dessus des talons, pas sur le mollet", "Bassin plaqué, ne cambre pas pour tirer", "Contracte en fin de course", "Retour contrôlé sur 2 secondes"],
  mollets: ["Talons dans le vide, amplitude complète", "Monte le plus haut possible sur la pointe", "Descends jusqu'à l'étirement", "Séries longues : 15 reps minimum"],
  squat: ["Pieds largeur épaules, pointes légèrement ouvertes", "Genoux dans l'axe des pieds", "Dos droit, regard devant, poitrine ouverte", "Descends au moins jusqu'à la cuisse parallèle"],
  abducteurs: ["Dos plaqué, mains sur les poignées", "Pousse avec l'extérieur des cuisses", "Ouvre sans à-coup, referme lentement", "Amplitude complète mais sans forcer"],
  ouverture: ["Buste légèrement penché, dos droit", "Bras quasi tendus, coudes à peine fléchis", "Serre les omoplates en fin de mouvement", "Charge légère : c'est un muscle fin"],
  ecartes: ["Dos plaqué, coudes légèrement fléchis", "Amène les bras devant, pas au-dessus", "Contracte les pecs 1 seconde en fin de course", "Ouvre lentement jusqu'à l'étirement"],
  pulldown: ["Cuisses bien calées sous les boudins", "Tire la barre vers le haut de la poitrine", "Coudes vers le bas et l'arrière, pas vers l'avant", "Ne balance pas le buste pour aider"],
  row: ["Dos droit, poitrine sortie, épaules basses", "Tire avec les coudes le long du corps", "Serre les omoplates en fin de tirage", "Ne tire pas avec les biceps seuls"],
  press: ["Dos plaqué, poignées au niveau des épaules", "Pousse sans verrouiller les coudes", "Descends lentement, ne rebondis pas", "Poignets droits dans l'axe des avant-bras"],
  triceps: ["Coudes collés au corps, immobiles", "Seul l'avant-bras bouge", "Étends complètement, contracte en bas", "Remonte lentement sans laisser filer"],
  curl: ["Coudes fixes le long du corps", "Ne balance pas le buste", "Monte jusqu'à la contraction complète", "Redescends sur 2 secondes, bras presque tendu"],
  elevation: ["Buste droit, charge légère", "Monte jusqu'à l'horizontale, pas plus haut", "Coudes légèrement fléchis, pouces vers le bas", "Descends lentement, pas de balancier"],
  generique: ["Amplitude complète, mouvement contrôlé", "Expire à l'effort, inspire au retour", "Ne compense jamais avec le dos", "Retour lent : c'est là que le muscle travaille"],
};

const Arr = ({ x1, y1, x2, y2 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={SCH.arrow} strokeWidth="3" strokeLinecap="round" />
      <polygon
        points={`${x2},${y2} ${x2 - h * Math.cos(a - 0.42)},${y2 - h * Math.sin(a - 0.42)} ${x2 - h * Math.cos(a + 0.42)},${y2 - h * Math.sin(a + 0.42)}`}
        fill={SCH.arrow}
      />
    </g>
  );
};

function SchemaMouvement({ nom }) {
  const k = mouvementOf(nom);
  const B = { stroke: SCH.body, strokeWidth: 4, strokeLinecap: "round" };
  const G = { stroke: SCH.ghost, strokeWidth: 3, strokeDasharray: "5 4", strokeLinecap: "round" };
  const M = { stroke: SCH.machine, strokeWidth: 7, strokeLinecap: "round" };
  let content;
  if (k === "presse")
    content = (<>
      <line x1="36" y1="50" x2="80" y2="94" {...M} />
      <line x1="80" y1="94" x2="108" y2="105" {...M} />
      <circle cx="45" cy="45" r="9" fill={SCH.body} />
      <line x1="52" y1="53" x2="88" y2="90" {...B} />
      <line x1="88" y1="90" x2="116" y2="66" {...B} />
      <line x1="116" y1="66" x2="132" y2="88" {...B} />
      <line x1="120" y1="100" x2="146" y2="76" stroke={SCH.machine} strokeWidth="6" strokeLinecap="round" />
      <line x1="88" y1="90" x2="158" y2="44" {...G} />
      <line x1="148" y1="58" x2="174" y2="34" {...G} strokeWidth="4" />
      <Arr x1={132} y1={106} x2={166} y2={74} />
    </>);
  else if (k === "extension-jambes")
    content = (<>
      <line x1="52" y1="40" x2="52" y2="88" {...M} />
      <line x1="52" y1="88" x2="98" y2="88" {...M} />
      <circle cx="63" cy="36" r="9" fill={SCH.body} />
      <line x1="63" y1="45" x2="63" y2="83" {...B} />
      <line x1="63" y1="83" x2="98" y2="83" {...B} />
      <line x1="98" y1="83" x2="98" y2="118" {...B} />
      <circle cx="98" cy="120" r="7" fill={SCH.machine} />
      <line x1="98" y1="83" x2="138" y2="83" {...G} />
      <circle cx="140" cy="83" r="7" fill="none" stroke={SCH.ghost} strokeWidth="2" strokeDasharray="4 3" />
      <Arr x1={114} y1={116} x2={136} y2={98} />
    </>);
  else if (k === "curl-jambes")
    content = (<>
      <line x1="52" y1="40" x2="52" y2="88" {...M} />
      <line x1="52" y1="88" x2="98" y2="88" {...M} />
      <circle cx="63" cy="36" r="9" fill={SCH.body} />
      <line x1="63" y1="45" x2="63" y2="83" {...B} />
      <line x1="63" y1="83" x2="98" y2="83" {...B} />
      <line x1="98" y1="83" x2="136" y2="83" {...B} />
      <circle cx="138" cy="83" r="7" fill={SCH.machine} />
      <line x1="98" y1="83" x2="102" y2="118" {...G} />
      <circle cx="102" cy="120" r="7" fill="none" stroke={SCH.ghost} strokeWidth="2" strokeDasharray="4 3" />
      <Arr x1={136} y1={100} x2={112} y2={118} />
    </>);
  else if (k === "mollets")
    content = (<>
      <line x1="68" y1="126" x2="132" y2="126" {...M} strokeWidth="6" />
      <circle cx="100" cy="34" r="10" fill={SCH.body} />
      <line x1="100" y1="44" x2="100" y2="86" {...B} />
      <line x1="100" y1="86" x2="93" y2="122" {...B} />
      <line x1="100" y1="86" x2="107" y2="122" {...B} />
      <circle cx="100" cy="18" r="10" fill="none" stroke={SCH.ghost} strokeWidth="2" strokeDasharray="4 3" />
      <line x1="100" y1="28" x2="100" y2="70" {...G} />
      <line x1="100" y1="70" x2="94" y2="106" {...G} />
      <line x1="100" y1="70" x2="106" y2="106" {...G} />
      <line x1="94" y1="106" x2="98" y2="122" {...G} />
      <line x1="106" y1="106" x2="110" y2="122" {...G} />
      <Arr x1={148} y1={112} x2={148} y2={72} />
    </>);
  else if (k === "squat")
    content = (<>
      <line x1="60" y1="130" x2="160" y2="130" {...M} strokeWidth="5" />
      <circle cx="80" cy="26" r="9" fill={SCH.body} />
      <line x1="80" y1="35" x2="80" y2="76" {...B} />
      <line x1="80" y1="76" x2="73" y2="103" {...B} />
      <line x1="73" y1="103" x2="73" y2="128" {...B} />
      <line x1="80" y1="76" x2="88" y2="103" {...B} />
      <line x1="88" y1="103" x2="88" y2="128" {...B} />
      <circle cx="136" cy="52" r="9" fill="none" stroke={SCH.ghost} strokeWidth="2" strokeDasharray="4 3" />
      <line x1="136" y1="61" x2="134" y2="96" {...G} />
      <line x1="134" y1="96" x2="116" y2="104" {...G} />
      <line x1="116" y1="104" x2="122" y2="128" {...G} />
      <line x1="134" y1="96" x2="148" y2="106" {...G} />
      <line x1="148" y1="106" x2="146" y2="128" {...G} />
      <Arr x1={108} y1={48} x2={108} y2={88} />
    </>);
  else if (k === "abducteurs")
    content = (<>
      <line x1="70" y1="112" x2="130" y2="112" {...M} strokeWidth="6" />
      <circle cx="100" cy="32" r="9" fill={SCH.body} />
      <line x1="100" y1="41" x2="100" y2="80" {...B} />
      <line x1="100" y1="80" x2="87" y2="110" {...B} />
      <line x1="100" y1="80" x2="113" y2="110" {...B} />
      <line x1="100" y1="80" x2="64" y2="104" {...G} />
      <line x1="100" y1="80" x2="136" y2="104" {...G} />
      <Arr x1={82} y1={124} x2={58} y2={116} />
      <Arr x1={118} y1={124} x2={142} y2={116} />
    </>);
  else if (k === "ouverture")
    content = (<>
      <circle cx="100" cy="32" r="10" fill={SCH.body} />
      <line x1="100" y1="42" x2="100" y2="96" {...B} />
      <line x1="100" y1="96" x2="90" y2="128" {...B} />
      <line x1="100" y1="96" x2="110" y2="128" {...B} />
      <line x1="100" y1="54" x2="78" y2="32" {...B} />
      <line x1="100" y1="54" x2="122" y2="32" {...B} />
      <line x1="100" y1="54" x2="52" y2="56" {...G} />
      <line x1="100" y1="54" x2="148" y2="56" {...G} />
      <Arr x1={72} y1={40} x2={54} y2={48} />
      <Arr x1={128} y1={40} x2={146} y2={48} />
    </>);
  else if (k === "ecartes")
    content = (<>
      <circle cx="100" cy="32" r="10" fill={SCH.body} />
      <line x1="100" y1="42" x2="100" y2="96" {...B} />
      <line x1="100" y1="96" x2="90" y2="128" {...B} />
      <line x1="100" y1="96" x2="110" y2="128" {...B} />
      <line x1="100" y1="54" x2="52" y2="56" {...B} />
      <line x1="100" y1="54" x2="148" y2="56" {...B} />
      <line x1="100" y1="54" x2="80" y2="30" {...G} />
      <line x1="100" y1="54" x2="120" y2="30" {...G} />
      <Arr x1={56} y1={44} x2={78} y2={34} />
      <Arr x1={144} y1={44} x2={122} y2={34} />
    </>);
  else if (k === "pulldown")
    content = (<>
      <line x1="58" y1="20" x2="142" y2="20" {...M} strokeWidth="6" />
      <line x1="100" y1="20" x2="100" y2="34" stroke={SCH.machine} strokeWidth="2" />
      <circle cx="78" cy="58" r="9" fill={SCH.body} />
      <line x1="78" y1="67" x2="78" y2="102" {...B} />
      <line x1="72" y1="102" x2="112" y2="102" {...M} />
      <line x1="78" y1="74" x2="96" y2="26" {...B} />
      <line x1="78" y1="74" x2="62" y2="26" {...B} />
      <line x1="78" y1="74" x2="98" y2="66" {...G} />
      <line x1="98" y1="66" x2="94" y2="80" {...G} />
      <line x1="56" y1="82" x2="102" y2="82" {...G} strokeWidth="4" />
      <Arr x1={134} y1={34} x2={134} y2={80} />
    </>);
  else if (k === "row")
    content = (<>
      <circle cx="70" cy="50" r="9" fill={SCH.body} />
      <line x1="70" y1="59" x2="70" y2="98" {...B} />
      <line x1="62" y1="98" x2="104" y2="98" {...M} />
      <line x1="70" y1="66" x2="130" y2="74" {...B} />
      <circle cx="134" cy="74" r="6" fill={SCH.machine} />
      <line x1="70" y1="66" x2="98" y2="84" {...G} />
      <line x1="98" y1="84" x2="78" y2="76" {...G} />
      <Arr x1={128} y1={104} x2={86} y2={104} />
    </>);
  else if (k === "press")
    content = (<>
      <line x1="52" y1="38" x2="52" y2="96" {...M} />
      <line x1="52" y1="96" x2="86" y2="96" {...M} />
      <circle cx="63" cy="34" r="9" fill={SCH.body} />
      <line x1="63" y1="43" x2="63" y2="92" {...B} />
      <line x1="63" y1="54" x2="78" y2="72" {...B} />
      <line x1="78" y1="72" x2="96" y2="58" {...B} />
      <line x1="63" y1="54" x2="128" y2="54" {...G} />
      <line x1="132" y1="38" x2="132" y2="70" stroke={SCH.machine} strokeWidth="6" strokeLinecap="round" />
      <Arr x1={100} y1={80} x2={130} y2={80} />
    </>);
  else if (k === "triceps")
    content = (<>
      <line x1="58" y1="16" x2="58" y2="44" stroke={SCH.machine} strokeWidth="3" />
      <line x1="46" y1="16" x2="70" y2="16" {...M} strokeWidth="5" />
      <circle cx="80" cy="30" r="9" fill={SCH.body} />
      <line x1="80" y1="39" x2="80" y2="88" {...B} />
      <line x1="80" y1="88" x2="71" y2="126" {...B} />
      <line x1="80" y1="88" x2="89" y2="126" {...B} />
      <line x1="80" y1="48" x2="84" y2="76" {...B} />
      <line x1="84" y1="76" x2="68" y2="54" {...B} />
      <line x1="84" y1="76" x2="92" y2="108" {...G} />
      <Arr x1={104} y1={60} x2={110} y2={102} />
    </>);
  else if (k === "curl")
    content = (<>
      <circle cx="78" cy="30" r="9" fill={SCH.body} />
      <line x1="78" y1="39" x2="78" y2="88" {...B} />
      <line x1="78" y1="88" x2="69" y2="126" {...B} />
      <line x1="78" y1="88" x2="87" y2="126" {...B} />
      <line x1="78" y1="48" x2="81" y2="80" {...B} />
      <line x1="81" y1="80" x2="99" y2="98" {...B} />
      <line x1="90" y1="106" x2="114" y2="92" {...M} strokeWidth="5" />
      <line x1="81" y1="80" x2="101" y2="56" {...G} />
      <line x1="92" y1="50" x2="116" y2="62" {...G} strokeWidth="4" />
      <Arr x1={126} y1={96} x2={132} y2={62} />
    </>);
  else if (k === "elevation")
    content = (<>
      <circle cx="100" cy="28" r="10" fill={SCH.body} />
      <line x1="100" y1="38" x2="100" y2="92" {...B} />
      <line x1="100" y1="92" x2="90" y2="128" {...B} />
      <line x1="100" y1="92" x2="110" y2="128" {...B} />
      <line x1="100" y1="48" x2="80" y2="88" {...B} />
      <line x1="100" y1="48" x2="120" y2="88" {...B} />
      <line x1="100" y1="48" x2="54" y2="48" {...G} />
      <line x1="100" y1="48" x2="146" y2="48" {...G} />
      <Arr x1={68} y1={84} x2={54} y2={62} />
      <Arr x1={132} y1={84} x2={146} y2={62} />
    </>);
  else
    content = (<>
      <line x1="72" y1="70" x2="128" y2="70" {...M} strokeWidth="6" />
      <rect x="56" y="54" width="14" height="32" rx="4" fill={SCH.machine} />
      <rect x="130" y="54" width="14" height="32" rx="4" fill={SCH.machine} />
      <Arr x1={100} y1={46} x2={100} y2={22} />
      <Arr x1={100} y1={94} x2={100} y2={118} />
    </>);
  return (
    <svg viewBox="0 0 200 140" style={{ width: "100%", height: "auto", display: "block" }}>{content}</svg>
  );
}

const CARDIO_PATTERNS = ["velo", "bike", "tapis", "course", "courir", "run", "rameur", "rowing erg", "elliptique", "marche", "stepper", "escalier", "corde a sauter", "cardio", "assault", "spinning"];
const estCardio = (nom) => {
  const n = norm(nom || "");
  return CARDIO_PATTERNS.some((p) => contientMot(n, p));
};

// ————— Calculatrice de plaques —————
const PLAQUES_DISPO = [25, 20, 15, 10, 5, 2.5, 1.25];
const calculPlaques = (cible, barre) => {
  let parCote = (cible - barre) / 2;
  if (parCote <= 0) return { parCote: [], reste: 0, atteint: barre };
  const combo = [];
  let restant = parCote;
  for (const p of PLAQUES_DISPO) {
    while (restant >= p - 0.001) { combo.push(p); restant -= p; }
  }
  const total = combo.reduce((a, b) => a + b, 0);
  return { parCote: combo, reste: Math.round(restant * 100) / 100, atteint: Math.round((barre + total * 2) * 100) / 100 };
};

// ————— Programmes types (statiques, à charges légères — point de départ, pas une prescription) —————
const PROGRAMMES = {
  push: { label: "Push (pecs/épaules/triceps)", exos: [
    { nom: "Chest press machine", poids: 20, series: 4, reps: 10, reposSec: 90 },
    { nom: "Pec Deck", poids: 8, series: 4, reps: 10, reposSec: 90 },
    { nom: "Shoulder Press machine", poids: 12, series: 4, reps: 10, reposSec: 90 },
    { nom: "Extension poulie corde", poids: 10, series: 4, reps: 10, reposSec: 90 },
    { nom: "Dips machine assistée", poids: 25, series: 4, reps: 10, reposSec: 90 },
  ]},
  pull: { label: "Pull (dos/biceps)", exos: [
    { nom: "Pull Down machine", poids: 20, parBras: true, series: 4, reps: 10, reposSec: 90 },
    { nom: "Low Row", poids: 25, series: 4, reps: 10, reposSec: 90 },
    { nom: "Tirage Horizontal poulie basse", poids: 20, series: 4, reps: 10, reposSec: 90 },
    { nom: "Reverse Fly", poids: 6, series: 4, reps: 12, reposSec: 90 },
    { nom: "Curl barre EZ", poids: 12, series: 4, reps: 10, reposSec: 90 },
  ]},
  jambes: { label: "Jambes (quadriceps/ischios)", exos: [
    { nom: "Presse à cuisses", poids: 30, series: 4, reps: 10, reposSec: 90 },
    { nom: "Leg extension", poids: 20, series: 3, reps: 12, reposSec: 90 },
    { nom: "Leg curl assis", poids: 15, series: 3, reps: 12, reposSec: 90 },
    { nom: "Abducteurs machine", poids: 25, series: 3, reps: 12, reposSec: 90 },
    { nom: "Mollets assis", poids: 15, series: 4, reps: 15, reposSec: 90 },
  ]},
  bras: { label: "Bras (biceps/triceps)", exos: [
    { nom: "Curl barre EZ", poids: 12, series: 4, reps: 10, reposSec: 90 },
    { nom: "Extension poulie corde", poids: 10, series: 4, reps: 10, reposSec: 90 },
    { nom: "Curl marteau", poids: 6, parBras: true, series: 4, reps: 10, reposSec: 90 },
    { nom: "Extension triceps machine", poids: 15, parBras: true, series: 4, reps: 10, reposSec: 90 },
  ]},
};
const programmePour = (nomSeance) => {
  const n = norm(nomSeance);
  if (n.includes("jambe") || n.includes("leg")) return PROGRAMMES.jambes;
  if (n.includes("push") || n.includes("pec")) return PROGRAMMES.push;
  if (n.includes("pull") || n.includes("dos")) return PROGRAMMES.pull;
  if (n.includes("bras")) return PROGRAMMES.bras;
  return null;
};

// ————— Renommages automatiques (noms tapés en salle -> noms propres du catalogue) —————
const RENOMMAGES = {
  "abducor": "Abducteurs machine",
  "abductor": "Abducteurs machine",
  "adductor": "Adducteurs machine",
  "prone leg curl": "Leg curl allongé",
  "leg curl": "Leg curl assis",
  "leg press": "Presse à cuisses",
  "seated calf": "Mollets assis",
  "triceps corde vers le bas": "Extension poulie corde",
  "seated dip": "Dips machine assistée",
  "chest incline": "Développé incliné machine",
  "delts machine": "Élévations latérales machine",
  "lat machine": "Pull Down machine",
};
const MIGRATION = 3; // incrémenter pour rejouer la migration
const migrerNoms = (d) => {
  if ((d.migration || 0) >= MIGRATION) return d;
  const propre = (nom) => RENOMMAGES[norm(nom)] || nom;
  return {
    ...d,
    migration: MIGRATION,
    seances: (d.seances || []).map((s) => ({ ...s, exos: (s.exos || []).map((e) => ({ ...e, nom: propre(e.nom) })) })),
    objectifs: (d.objectifs || []).map((o) => ({ ...o, nom: propre(o.nom) })),
  };
};

// ————— Catalogue d'exercices (salle de sport, machines guidées) —————
const CATALOGUE = [
  // Jambes
  "Presse à cuisses", "Hack squat", "Squat barre", "Squat guidé (Smith)", "Fentes haltères",
  "Leg extension", "Leg curl assis", "Leg curl allongé", "Abducteurs machine", "Adducteurs machine",
  "Mollets debout", "Mollets assis", "Presse à mollets", "Soulevé de terre roumain",
  // Pecs
  "Développé couché barre", "Développé couché haltères", "Développé incliné haltères", "Développé incliné barre",
  "Chest press machine", "Machine convergente", "Pec Deck", "Écartés poulie vis-à-vis", "Dips machine assistée", "Pompes",
  // Dos
  "Pull Down machine", "Vertical Traction", "Tirage Poitrine machine", "Tirage Horizontal poulie basse",
  "Low Row", "Rowing haltère", "Rowing barre", "Pull-over poulie", "Tractions assistées", "Shrugs haltères",
  // Épaules
  "Shoulder Press machine", "Développé militaire barre", "Développé épaules haltères",
  "Élévations latérales haltères", "Élévations latérales poulie", "Reverse Fly", "Oiseau haltères", "Face pull poulie",
  // Biceps
  "Curl barre EZ", "Curl haltères biceps", "Curl marteau", "Curl incliné haltères", "Curl pupitre", "Curl machine guidée", "Curl poulie basse",
  // Triceps
  "Extension poulie corde", "Extension poulie barre", "Barre au front", "Extension triceps machine", "Kickback haltère", "Dips barres parallèles",
  // Abdos
  "Crunch machine", "Crunch poulie haute", "Relevé de jambes", "Gainage planche", "Roue abdominale",
  // Cardio
  "Vélo", "Vélo elliptique", "Tapis de course", "Rameur", "Stepper", "Corde à sauter", "Marche inclinée",
];

// ————— Repères de force (multiples du poids de corps, charge totale) —————
const REPERES = {
  presse: { m: [1.3, 1.9, 2.6, 3.4], machine: true },
  "extension-jambes": { m: [0.48, 0.7, 0.98, 1.3], machine: true },
  "curl-jambes": { m: [0.4, 0.6, 0.82, 1.1], machine: true },
  mollets: { m: [0.8, 1.2, 1.7, 2.3], machine: true },
  squat: { m: [0.75, 1.1, 1.5, 2.0], machine: false },
  abducteurs: { m: [0.5, 0.75, 1.05, 1.4], machine: true },
  ouverture: { m: [0.15, 0.24, 0.35, 0.48], machine: true },
  ecartes: { m: [0.4, 0.6, 0.82, 1.1], machine: true },
  pulldown: { m: [0.6, 0.8, 1.05, 1.35], machine: true },
  row: { m: [0.6, 0.82, 1.05, 1.35], machine: true },
  press: { m: [0.4, 0.6, 0.82, 1.1], machine: true },
  triceps: { m: [0.32, 0.47, 0.66, 0.88], machine: true },
  curl: { m: [0.3, 0.43, 0.6, 0.8], machine: false },
  elevation: { m: [0.18, 0.28, 0.4, 0.54], machine: false },
};
const NIVEAUX = [
  { seuil: 3, label: "Avancé", color: "#7c5cd6" },
  { seuil: 2, label: "Intermédiaire", color: "#178a4c" },
  { seuil: 1, label: "Novice", color: "#8a5b00" },
  { seuil: 0, label: "Débutant", color: "#5b6472" },
];
const repereFor = (nom, poidsCorps) => {
  const k = mouvementOf(nom);
  const r = REPERES[k];
  if (!r) return null;
  return { paliers: r.m.map((x) => Math.round(x * poidsCorps * 2) / 2), machine: r.machine };
};
const niveauPour = (charge, paliers) => {
  for (const n of NIVEAUX) if (charge >= paliers[n.seuil]) return n;
  return { seuil: -1, label: "En construction", color: "#b45309" };
};

// ————— Petits composants —————

const Card = ({ children, style, className, onClick }) => (
  <div onClick={onClick} className={"pl-card rounded-2xl p-4 " + (className || "")} style={style}>
    {children}
  </div>
);

// Titre de section avec "ruban de chantier" jaune/noir
const SectionLabel = ({ children, right }) => (
  <div className="pl-label">
    <span>{children}</span>
    <span className="pl-tape" />
    {right}
  </div>
);

// Chiffre qui compte de 0 à sa valeur au montage
function CountUp({ value, decimals = 0, className, style, dur = 900 }) {
  const [n, setN] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const target = Number(value) || 0;
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(target); return; }
    let t0 = null;
    const step = (ts) => {
      if (t0 == null) t0 = ts;
      const p = Math.min(1, (ts - t0) / dur);
      setN(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [value, dur]);
  const shown = decimals > 0
    ? (Math.round(n * 10 ** decimals) / 10 ** decimals).toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(n).toLocaleString("fr-FR");
  return <span className={className} style={style}>{shown}</span>;
}

// Anneau de progression (objectif hebdo)
function Ring({ value, max, size = 76, stroke = 9, color = C.yellow, children }) {
  const R = (size - stroke) / 2;
  const circ = 2 * Math.PI * R;
  const frac = max > 0 ? Math.min(1, value / max) : 0;
  const [off, setOff] = useState(circ);
  useEffect(() => {
    const rm = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (rm) { setOff(circ * (1 - frac)); return; }
    const id = requestAnimationFrame(() => setOff(circ * (1 - frac)));
    return () => cancelAnimationFrame(id);
  }, [frac, circ]);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={C.card2} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

// ————— Silhouette musculaire : chaque muscle s'allume selon le volume —————
// Corps dessiné à la main (viewBox 0 0 160 236) — tête, tronc, bras et jambes en courbes lisses.
// Formes des groupes musculaires (vue de face + de dos), alignées sur le contour ci-dessous.
const CORPS_FACE = {
  Pecs: ["M56 78 C56 70 66 65 80 65 C94 65 104 70 104 78 C104 88 93 95 80 96 C67 95 56 88 56 78 Z"],
  Épaules: ["M34 66 C34 58 41 52 50 51 C48 59 47 68 48 76 C40 76 34 72 34 66 Z", "M126 66 C126 58 119 52 110 51 C112 59 113 68 112 76 C120 76 126 72 126 66 Z"],
  Biceps: ["M32 78 C29 90 28 103 31 115 C36 117 41 116 44 112 C42 100 42 88 44 77 C40 76 35 76 32 78 Z", "M128 78 C131 90 132 103 129 115 C124 117 119 116 116 112 C118 100 118 88 116 77 C120 76 125 76 128 78 Z"],
  Abdos: ["M63 99 C63 97 97 97 97 99 L97 130 C97 138 88 143 80 143 C72 143 63 138 63 130 Z"],
  Jambes: ["M60 150 C58 168 57 186 59 206 C59 213 65 218 71 218 C76 218 78 213 78 207 C77 188 77 169 76 151 C71 149 65 149 60 150 Z", "M100 150 C102 168 103 186 101 206 C101 213 95 218 89 218 C84 218 82 213 82 207 C83 188 83 169 84 151 C89 149 95 149 100 150 Z"],
};
const CORPS_DOS = {
  Dos: ["M58 68 C58 64 68 60 80 60 C92 60 102 64 102 68 C104 84 100 100 92 112 C88 118 72 118 68 112 C60 100 56 84 58 68 Z"],
  Épaules: ["M34 66 C34 58 41 52 50 51 C48 59 47 68 48 76 C40 76 34 72 34 66 Z", "M126 66 C126 58 119 52 110 51 C112 59 113 68 112 76 C120 76 126 72 126 66 Z"],
  Triceps: ["M32 78 C29 90 28 103 31 115 C36 117 41 116 44 112 C42 100 42 88 44 77 C40 76 35 76 32 78 Z", "M128 78 C131 90 132 103 129 115 C124 117 119 116 116 112 C118 100 118 88 116 77 C120 76 125 76 128 78 Z"],
  Jambes: ["M60 150 C58 168 57 186 59 206 C59 213 65 218 71 218 C76 218 78 213 78 207 C77 188 77 169 76 151 C71 149 65 149 60 150 Z", "M100 150 C102 168 103 186 101 206 C101 213 95 218 89 218 C84 218 82 213 82 207 C83 188 83 169 84 151 C89 149 95 149 100 150 Z"],
};
// Contour du corps : tête ronde, cou, épaules, bras le long du corps, taille marquée, jambes galbées.
const CORPS_CONTOUR = "M80 8 C88.8 8 96 15.2 96 24 C96 32.8 88.8 40 80 40 C71.2 40 64 32.8 64 24 C64 15.2 71.2 8 80 8 Z " +
  "M69 39 L91 39 L92 50 C104 51 116 56 122 65 C127 73 129 86 128 98 C127 106 122 112 115 113 C112 113 110 111 109 108 " +
  "C111 96 111 84 108 73 C106 67 102 63 97 61 C99 76 100 92 99 108 C99 122 98 136 96 149 " +
  "C99 152 100 157 100 162 C102 178 103 194 101 209 C101 217 94 223 87 223 C81 223 77 218 76 211 " +
  "C75 196 75 181 75 166 C75 181 75 196 74 211 C73 218 69 223 63 223 C56 223 49 217 49 209 " +
  "C47 194 48 178 50 162 C50 157 51 152 54 149 C52 136 51 122 51 108 C50 92 51 76 53 61 " +
  "C48 63 44 67 42 73 C39 84 39 96 41 108 C40 111 38 113 35 113 C28 112 23 106 22 98 " +
  "C21 86 23 73 28 65 C34 56 46 51 58 50 L69 39 Z";

// Couleur d'un muscle selon son volume relatif (gris = négligé → jaune = travaillé → rouge = surchargé)
const couleurMuscle = (v, max, cible) => {
  if (!v) return "#e6e1d2";
  if (cible && v > cible) return C.red;
  const r = max > 0 ? v / max : 0;
  if (r >= 0.75) return C.yellow;
  if (r >= 0.45) return "#f2d066";
  if (r >= 0.2) return "#e9dba3";
  return "#dfd7bd";
};

function SilhouetteMuscles({ volumes, cibles = {}, onPick }) {
  const [dos, setDos] = useState(false);
  const carte = dos ? CORPS_DOS : CORPS_FACE;
  const max = Math.max(1, ...Object.keys(carte).map((m) => volumes[m] || 0));
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-semibold" style={{ color: C.dim }}>{dos ? "Vue de dos" : "Vue de face"}</div>
        <button onClick={() => setDos(!dos)} className="pl-tap px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: C.card2, color: C.text, border: `1px solid ${C.hair}` }}>
          {dos ? "Voir la face" : "Voir le dos"} ↻
        </button>
      </div>
      <svg viewBox="0 0 160 236" style={{ width: "100%", height: "auto", display: "block", maxHeight: 280 }}>
        <path d={CORPS_CONTOUR} fill="#2a2a30" fillRule="evenodd" stroke={C.hair} strokeWidth="1.5" />
        {Object.entries(carte).map(([m, paths]) => {
          const v = volumes[m] || 0;
          const col = couleurMuscle(v, max, cibles[m]);
          return (
            <g key={m} onClick={() => onPick && onPick(m, v)} style={{ cursor: onPick ? "pointer" : "default" }}>
              {paths.map((d, i) => (
                <path key={i} d={d} fill={col} opacity={v ? 0.95 : 0.5}
                  style={{ transition: "fill .6s ease" }}>
                  <title>{m} — {v} série{v > 1 ? "s" : ""}</title>
                </path>
              ))}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-center gap-3 mt-1 text-xs" style={{ color: C.dim }}>
        <span className="flex items-center gap-1"><i style={{ width: 9, height: 9, borderRadius: 3, background: "#e6e1d2", border: `1px solid ${C.hair}`, display: "inline-block" }} /> négligé</span>
        <span className="flex items-center gap-1"><i style={{ width: 9, height: 9, borderRadius: 3, background: C.yellow, display: "inline-block" }} /> travaillé</span>
        <span className="flex items-center gap-1"><i style={{ width: 9, height: 9, borderRadius: 3, background: C.red, display: "inline-block" }} /> au-delà cible</span>
      </div>
    </div>
  );
}

// ————— Heatmap de l'année (une case par jour) —————
function Heatmap({ seances, weeks = 26 }) {
  const parJour = useMemo(() => {
    const m = {};
    seances.forEach((s) => { m[s.date] = (m[s.date] || 0) + tonnageSeance(s); });
    return m;
  }, [seances]);
  const cols = [];
  const cur = new Date(mondayOf(todayISO()) + "T12:00:00");
  cur.setDate(cur.getDate() - 7 * (weeks - 1));
  const maxT = Math.max(1, ...Object.values(parJour));
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let j = 0; j < 7; j++) {
      const d = new Date(cur); d.setDate(cur.getDate() + j);
      const iso = isoOf(d);
      const t = parJour[iso] || 0;
      col.push({ iso, t, futur: iso > todayISO() });
    }
    cols.push(col);
    cur.setDate(cur.getDate() + 7);
  }
  const teinte = (t, futur) => {
    if (futur) return "transparent";
    if (!t) return "#e6e1d2";
    const r = t / maxT;
    if (r >= 0.75) return C.yellowHi;
    if (r >= 0.45) return C.yellow;
    if (r >= 0.2) return "#f2d066";
    return "#e9dba3";
  };
  return (
    <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      <div className="flex gap-[3px]" style={{ minWidth: "min-content" }}>
        {cols.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((c) => (
              <div key={c.iso} title={`${fmtShort(c.iso)} — ${c.t ? c.t.toLocaleString("fr-FR") + " kg" : "repos"}`}
                style={{ width: 11, height: 11, borderRadius: 3, background: teinte(c.t, c.futur), border: c.futur ? "none" : `1px solid ${C.hair}` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ————— Radar d'équilibre musculaire —————
function RadarMuscles({ volumes, groupes }) {
  const N = groupes.length;
  const cx = 110, cy = 105, R = 78;
  const max = Math.max(1, ...groupes.map((g) => volumes[g] || 0));
  const pt = (i, r) => {
    const a = (Math.PI * 2 * i) / N - Math.PI / 2;
    return [cx + Math.cos(a) * R * r, cy + Math.sin(a) * R * r];
  };
  const poly = groupes.map((g, i) => pt(i, (volumes[g] || 0) / max).join(",")).join(" ");
  return (
    <svg viewBox="0 0 220 210" style={{ width: "100%", height: "auto", display: "block" }}>
      {[0.25, 0.5, 0.75, 1].map((r, k) => (
        <polygon key={k} points={groupes.map((_, i) => pt(i, r).join(",")).join(" ")} fill="none" stroke="#ddd7c4" strokeWidth="1" />
      ))}
      {groupes.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#ddd7c4" strokeWidth="1" />;
      })}
      <polygon points={poly} fill="rgba(245,197,24,.22)" stroke={C.yellow} strokeWidth="2.5" strokeLinejoin="round" />
      {groupes.map((g, i) => {
        const [x, y] = pt(i, (volumes[g] || 0) / max);
        return <circle key={g} cx={x} cy={y} r="3.5" fill={C.yellow} />;
      })}
      {groupes.map((g, i) => {
        const [x, y] = pt(i, 1.2);
        return (
          <text key={g} x={x} y={y} fontSize="10" fontWeight="700" fill={volumes[g] ? C.text : C.dim} textAnchor="middle" dominantBaseline="middle">
            {g}
          </text>
        );
      })}
    </svg>
  );
}

// Pluie de confettis (record battu)
function Confetti({ n = 40 }) {
  const pieces = useMemo(() => Array.from({ length: n }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 1.6 + Math.random() * 1.4,
    color: [C.yellow, C.yellowDim, C.text, C.green][Math.floor(Math.random() * 4)],
    rot: Math.random() * 360,
  })), [n]);
  return (
    <div className="pl-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i key={i} style={{ left: p.left + "%", background: p.color, animationDelay: p.delay + "s", animationDuration: p.dur + "s", transform: `rotate(${p.rot}deg)` }} />
      ))}
    </div>
  );
}

const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={"pl-tap px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap" + (active ? " pl-chip-on" : "")}
    style={{
      background: active ? C.yellow : C.card2,
      color: active ? "#111" : C.text,
      border: `1px solid ${active ? C.yellow : C.hair}`,
    }}
  >
    {children}
  </button>
);

const Stepper = ({ label, value, onChange, min = 1, max = 30 }) => (
  <div className="flex-1 min-w-0">
    <div className="text-xs mb-1.5 font-semibold" style={{ color: C.dim }}>{label}</div>
    <div className="flex items-center rounded-2xl overflow-hidden" style={{ background: C.card2, border: `1px solid ${C.hair}`, height: 56 }}>
      <button className="pl-tap h-full px-3.5 flex items-center" aria-label={`${label} moins`} onClick={() => onChange(Math.max(min, value - 1))} style={{ color: C.text }}><Minus size={18} /></button>
      <div className="flex-1 text-center" style={{ ...NUMS, ...DISPLAY, fontSize: 24, color: C.text }}>{value}</div>
      <button className="pl-tap h-full px-3.5 flex items-center" aria-label={`${label} plus`} onClick={() => onChange(Math.min(max, value + 1))} style={{ color: C.text }}><Plus size={18} /></button>
    </div>
  </div>
);

// Grand champ de poids avec boutons −/+ (lisible et tapable pendant l'effort)
const PoidsInput = ({ value, onChange, pas = 2.5, height = 68, fontSize = 34 }) => {
  const bump = (d) => {
    const v = parseFloat(String(value).replace(",", "."));
    const base = isNaN(v) ? 0 : v;
    onChange(fmtKg(Math.max(0, Math.round((base + d) * 10) / 10)));
  };
  return (
    <div className="flex items-stretch gap-2">
      <button
        onClick={() => bump(-pas)}
        aria-label={`Retirer ${fmtKg(pas)} kg`}
        className="pl-tap rounded-2xl flex items-center justify-center shrink-0"
        style={{ width: 58, background: C.card2, border: `1px solid ${C.hair}`, color: C.text }}
      >
        <Minus size={20} />
      </button>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder="0"
        className="flex-1 min-w-0 rounded-2xl px-3 text-center font-black"
        style={{ background: C.card2, border: `1px solid ${C.hair}`, color: C.text, ...NUMS, ...DISPLAY, fontSize, height }}
      />
      <button
        onClick={() => bump(pas)}
        aria-label={`Ajouter ${fmtKg(pas)} kg`}
        className="pl-tap rounded-2xl flex items-center justify-center shrink-0"
        style={{ width: 58, background: C.yellow, border: "none", color: "#111" }}
      >
        <Plus size={20} />
      </button>
    </div>
  );
};

const Dot = ({ ressenti }) =>
  ressenti ? (
    <span
      className="inline-block w-2 h-2 rounded-full mr-1 align-middle"
      style={{ background: ressenti === "marge" ? C.green : C.red }}
    />
  ) : null;

const PrBadge = () => (
  <span
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-black ml-1 align-middle"
    style={{ background: C.yellow, color: "#111" }}
  >
    <Trophy size={10} /> PR
  </span>
);

// ————— App —————
function App() {
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState(SEED_DATA);
  const [tab, setTab] = useState("accueil");
  const [current, setCurrent] = useState(null);
  const [now, setNow] = useState(Date.now());
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // Formulaire séance
  const [showStart, setShowStart] = useState(false);
  const [startNom, setStartNom] = useState("");
  const [fNom, setFNom] = useState("");
  const [fPoids, setFPoids] = useState("");
  const [fParBras, setFParBras] = useState(false);
  const [fSeries, setFSeries] = useState(4);
  const [fReps, setFReps] = useState(10);
  const [fRepos, setFRepos] = useState(90);
  const [fRessenti, setFRessenti] = useState(null);
  const [fTypeManuel, setFTypeManuel] = useState(null);
  const [fDuree, setFDuree] = useState(20);
  const [fDistance, setFDistance] = useState("");
  const [fNiveau, setFNiveau] = useState("");
  const [editExoId, setEditExoId] = useState(null);
  const [fPhotoId, setFPhotoId] = useState(null);
  const [fPhotoPreview, setFPhotoPreview] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoView, setPhotoView] = useState(null);
  const [planOuvert, setPlanOuvert] = useState(true);
  const [schemaOuvert, setSchemaOuvert] = useState(false);
  const [progVu, setProgVu] = useState(false);
  const [plaquesOuvert, setPlaquesOuvert] = useState(false);
  const [barreKg, setBarreKg] = useState(20);
  const [fRpe, setFRpe] = useState(null);
  const [ficheExo, setFicheExo] = useState(null);
  const [recupPlus, setRecupPlus] = useState(false);
  const [finOuvert, setFinOuvert] = useState(false);
  const fileInputRef = useRef(null);

  // Mode série par série
  const [ecPoids, setEcPoids] = useState("");
  const [ecReps, setEcReps] = useState(10);
  const [focusOuvert, setFocusOuvert] = useState(true);

  // Chrono de repos
  const [rest, setRest] = useState(null); // { endsAt, total }
  const beepedRef = useRef(false);
  const audioRef = useRef(null);

  // Coach
  const [coachBusyId, setCoachBusyId] = useState(null);
  const [bilanBusyId, setBilanBusyId] = useState(null);
  const [conseil, setConseil] = useState(null);
  const [conseilBusy, setConseilBusy] = useState(false);
  const [q, setQ] = useState("");
  const [qResp, setQResp] = useState(null);
  const [qBusy, setQBusy] = useState(false);
  const [recupAvis, setRecupAvis] = useState(null);
  const [recupBusy, setRecupBusy] = useState(false);
  const [stagAvis, setStagAvis] = useState(null);
  const [stagBusy, setStagBusy] = useState(false);
  const motRequested = useRef(false);

  // Historique / progression / récup
  const [expandedId, setExpandedId] = useState(null);
  const [selExo, setSelExo] = useState("");
  const [progMode, setProgMode] = useState("exo"); // exo | corps | muscles
  const [progMensuZone, setProgMensuZone] = useState("Bras");
  const [pdsInput, setPdsInput] = useState("");
  const [mensuZone, setMensuZone] = useState("Bras");
  const [mensuInput, setMensuInput] = useState("");
  const [ehKey, setEhKey] = useState(null);
  const [ehCardio, setEhCardio] = useState(false);
  const [ehDuree, setEhDuree] = useState(20);
  const [ehDistance, setEhDistance] = useState("");
  const [ehNoteKey, setEhNoteKey] = useState(null);
  const [ehNote, setEhNote] = useState("");
  const [ehPoids, setEhPoids] = useState("");
  const [ehSeries, setEhSeries] = useState(4);
  const [ehReps, setEhReps] = useState(10);
  const [shareId, setShareId] = useState(null);
  const [shareFallback, setShareFallback] = useState(null); // { id, text }

  // Planification
  const [planifOpen, setPlanifOpen] = useState(false);
  const [planifNom, setPlanifNom] = useState("");
  const [planifDate, setPlanifDate] = useState("");

  // Fin de séance fêtée + onboarding + confettis PR
  const [bilanSeance, setBilanSeance] = useState(null);
  const [onbGoal, setOnbGoal] = useState(3);
  const [prFlash, setPrFlash] = useState(null);

  // Plan IA, import de séance, objectifs, wake lock
  const [planIABusy, setPlanIABusy] = useState(false);
  const [importSeanceOpen, setImportSeanceOpen] = useState(false);
  const [importSeanceText, setImportSeanceText] = useState("");
  const [importSeanceDate, setImportSeanceDate] = useState("");
  const [importSeanceBusy, setImportSeanceBusy] = useState(false);
  const [objInput, setObjInput] = useState("");
  const [objEdit, setObjEdit] = useState(false);
  const wakeRef = useRef(null);
  const [wakeActive, setWakeActive] = useState(false);

  // Contexte à coller dans Claude
  const [ctxCopie, setCtxCopie] = useState(false);

  // Export / import
  const [exportText, setExportText] = useState(null);
  const [finJsonCopie, setFinJsonCopie] = useState(false);
  const [etatCopie, setEtatCopie] = useState(false);
  const [copieOk, setCopieOk] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [reglagesOuvert, setReglagesOuvert] = useState(false);
  const [importText, setImportText] = useState("");

  // ————— Chargement initial —————
  useEffect(() => {
    (async () => {
      let d = SEED_DATA;
      let ok = false;
      if (window.storage) {
        try {
          const r = await window.storage.get("plateau-data");
          d = JSON.parse(r.value);
          ok = true;
        } catch {
          try { await window.storage.set("plateau-data", JSON.stringify(d)); ok = true; } catch { ok = false; }
        }
        try {
          const rc = await window.storage.get("plateau-current");
          const cur = JSON.parse(rc.value);
          if (cur && cur.startedAt) {
            const heures = (Date.now() - cur.startedAt) / 3600000;
            if (heures > 5) {
              const garder = window.confirm(
                `Une séance ${cur.nom} est ouverte depuis ${Math.round(heures)} h — tu as sûrement oublié de la terminer.\n\nOK = la reprendre en repartant de maintenant.\nAnnuler = la garder telle quelle.`
              );
              if (garder) cur.startedAt = Date.now() - 60 * 60000;
            }
            setCurrent(cur);
            setTab("seance");
            if (cur.exoEnCours && cur.exoEnCours.sets.length) {
              const lastSet = cur.exoEnCours.sets[cur.exoEnCours.sets.length - 1];
              setEcPoids(fmtKg(lastSet.poids));
              setEcReps(lastSet.reps);
            }
          }
        } catch {}
      }
      setStorageOk(ok);
      const avant = JSON.stringify(d.seances || []);
      d = migrerNoms(d);
      if (JSON.stringify(d.seances || []) !== avant && window.storage) {
        try { await window.storage.set("plateau-data", JSON.stringify(d)); } catch {}
      }
      setData(d);
      setLoaded(true);
    })();
  }, []);

  // ————— Le mot du coach (1 fois par jour, mis en cache) —————
  useEffect(() => {
    if (!loaded || !COACH_DISPO) return;
    const m = dataRef.current.motDuJour;
    if (m && m.date === todayISO()) return;
    if (motRequested.current) return;
    motRequested.current = true;
    (async () => {
      try {
        const d = dataRef.current;
        const p = PASSAGES_BASE + d.seances.filter((s) => s.date > PASSAGES_BASE_DATE).length + (d.passagesOffset || 0);
        const rep = await askCoach(
          `${COACH_BASE(p)}\n\n${buildContext(d)}\n\n` +
          `Écris ton court message du jour pour l’utilisateur : 2 ou 3 phrases maximum, avec une consigne claire pour aujourd'hui (séance ou repos).`
        );
        saveData({ ...dataRef.current, motDuJour: { date: todayISO(), texte: rep } });
      } catch {}
    })();
  }, [loaded]);

  // ————— Tick (durée séance + chrono) —————
  useEffect(() => {
    if (!current && !rest) return;
    const iv = setInterval(() => {
      setNow(Date.now());
      if (rest && !beepedRef.current && Date.now() >= rest.endsAt) {
        beepedRef.current = true;
        beep();
      }
    }, 300);
    return () => clearInterval(iv);
  }, [current, rest]);

  // ————— Wake lock (écran maintenu allumé pendant la séance) —————
  const acquireWake = async () => {
    try {
      if (!("wakeLock" in navigator)) return;
      const l = await navigator.wakeLock.request("screen");
      wakeRef.current = l;
      setWakeActive(true);
      l.addEventListener("release", () => setWakeActive(false));
    } catch { setWakeActive(false); }
  };
  const releaseWake = () => {
    try { if (wakeRef.current) wakeRef.current.release(); } catch {}
    wakeRef.current = null;
    setWakeActive(false);
  };
  useEffect(() => {
    if (!current) return;
    acquireWake();
    const onVis = () => { if (document.visibilityState === "visible") acquireWake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); releaseWake(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!current]);

  // ————— Audio —————
  const ensureAudio = () => {
    try {
      if (!audioRef.current) audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
      if (audioRef.current.state === "suspended") audioRef.current.resume();
    } catch {}
  };
  const beep = () => {
    try {
      const ctx = audioRef.current;
      if (!ctx) return;
      [0, 0.4, 0.8].forEach((t, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        o.frequency.value = i === 2 ? 1100 : 880;
        o.connect(g); g.connect(ctx.destination);
        const at = ctx.currentTime + t;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
        o.start(at); o.stop(at + 0.4);
      });
    } catch {}
  };

  // ————— Persistance (debounce anti rate-limit + flush + détection storage) —————
  const currentRef = useRef(current);
  useEffect(() => { currentRef.current = current; }, [current]);
  const dataTimer = useRef(null);
  const curTimer = useRef(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [storageOk, setStorageOk] = useState(null);
  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };
  // ————— Sauvegarde continue dans le presse-papier —————
  const clipTimer = useRef(null);
  const [clipState, setClipState] = useState("idle"); // idle | pending | sync
  const scheduleAutoCopie = () => {
    if (!dataRef.current || dataRef.current.prefAutoCopie !== true) return;
    setClipState("pending");
    if (clipTimer.current) clearTimeout(clipTimer.current);
    clipTimer.current = setTimeout(() => {
      clipTimer.current = null;
      const payload = currentRef.current ? { ...dataRef.current, enCours: currentRef.current } : dataRef.current;
      navigator.clipboard
        .writeText(JSON.stringify(payload, null, 2))
        .then(() => setClipState("sync"))
        .catch(() => setClipState("idle"));
    }, 400);
  };

  const saveData = async (next) => {
    setData(next);
    dataRef.current = next;
    scheduleAutoCopie();
    if (!window.storage) return;
    if (dataTimer.current) clearTimeout(dataTimer.current);
    dataTimer.current = setTimeout(() => {
      dataTimer.current = null;
      window.storage.set("plateau-data", JSON.stringify(dataRef.current))
        .then(() => { setStorageOk(true); flashSaved(); })
        .catch(() => setStorageOk(false));
    }, 600);
  };
  const saveCurrent = async (cur) => {
    setCurrent(cur);
    currentRef.current = cur;
    scheduleAutoCopie();
    if (!window.storage) return;
    if (curTimer.current) clearTimeout(curTimer.current);
    if (cur == null) {
      curTimer.current = null;
      window.storage.delete("plateau-current").catch(() => {});
      return;
    }
    curTimer.current = setTimeout(() => {
      curTimer.current = null;
      window.storage.set("plateau-current", JSON.stringify(currentRef.current))
        .then(() => { setStorageOk(true); flashSaved(); })
        .catch(() => setStorageOk(false));
    }, 600);
  };
  useEffect(() => {
    const flush = () => {
      if (dataTimer.current) {
        clearTimeout(dataTimer.current);
        dataTimer.current = null;
        if (window.storage) window.storage.set("plateau-data", JSON.stringify(dataRef.current)).catch(() => {});
      }
      if (curTimer.current) {
        clearTimeout(curTimer.current);
        curTimer.current = null;
        if (window.storage && currentRef.current) window.storage.set("plateau-current", JSON.stringify(currentRef.current)).catch(() => {});
      }
    };
    const onVis = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  // ————— Exos connus, suggestions, objectifs —————
  const allExos = useMemo(() => {
    const list = [...data.seances.flatMap((s) => s.exos), ...(current ? current.exos : [])];
    const seen = new Map();
    list.forEach((e) => {
      const k = e.nom.toLowerCase();
      seen.set(k, { nom: e.nom, count: (seen.get(k)?.count || 0) + 1 });
    });
    return [...seen.values()].sort((a, b) => b.count - a.count).map((x) => x.nom);
  }, [data, current]);

  const lastOf = (nom) => {
    const list = [...data.seances.flatMap((s) => s.exos), ...(current ? current.exos : [])];
    for (let i = list.length - 1; i >= 0; i--) if (list[i].nom.toLowerCase() === nom.toLowerCase() && list[i].type !== "cardio") return list[i];
    return null;
  };

  const suggestionsNoms = useMemo(() => {
    const q = norm(fNom.trim());
    const cat = CATALOGUE.filter((n) => !allExos.some((m) => m.toLowerCase() === n.toLowerCase()));
    const tout = [...allExos, ...cat];
    if (!q) return allExos.slice(0, 8);
    const debut = tout.filter((n) => norm(n).startsWith(q));
    const dedans = tout.filter((n) => !norm(n).startsWith(q) && norm(n).includes(q));
    return [...debut, ...dedans].slice(0, 8);
  }, [allExos, fNom]);

  const doublonProbable = useMemo(() => {
    const q = fNom.trim();
    if (!q || q.length < 4 || editExoId) return null;
    const nq = norm(q);
    if (allExos.some((n) => norm(n) === nq)) return null; // nom déjà connu, rien à signaler
    let best = null;
    allExos.forEach((n) => {
      const score = scoreRessemblance(q, n);
      if (score >= 0.5 && (!best || score > best.score)) best = { nom: n, score };
    });
    return best;
  }, [fNom, allExos, editExoId]);

  // Doublons déjà présents dans l'historique (ex. "Extension triceps" et "Extension triceps machine")
  const doublonsExistants = useMemo(() => {
    const noms = allExos;
    const paires = [];
    const vus = new Set();
    for (let i = 0; i < noms.length; i++) {
      for (let j = i + 1; j < noms.length; j++) {
        const a = noms[i], b = noms[j];
        if (norm(a) === norm(b)) continue;
        const score = scoreRessemblance(a, b);
        if (score >= 0.6) {
          const cle = [a, b].sort().join("|");
          if (!vus.has(cle)) { vus.add(cle); paires.push({ a, b }); }
        }
      }
    }
    return paires.slice(0, 8);
  }, [allExos]);

  const histoOf = (nom) => {
    const out = [];
    data.seances.forEach((s) =>
      s.exos.forEach((e) => {
        if (e.nom.toLowerCase() === nom.toLowerCase()) out.push({ date: s.date, poids: e.poids, ressenti: e.ressenti });
      })
    );
    return out.slice(-3);
  };

  const incrementFor = (e) => (e.parBras && e.poids <= 12 ? 2 : 2.5);
  const suggestionFor = (nom) => {
    const last = lastOf(nom);
    if (!last) return null;
    if (cycleDe(data).deload) {
      return { last, cible: Math.round(last.poids * 0.9 * 2) / 2, monte: false, deload: true };
    }
    if (last.ressenti === "marge") {
      return { last, cible: Math.round((last.poids + incrementFor(last)) * 10) / 10, monte: true };
    }
    return { last, cible: last.poids, monte: false };
  };

  const bestBefore = (nom) => {
    const all = [
      ...data.seances.flatMap((s) => s.exos),
      ...(current ? current.exos : []),
    ].filter((e) => e.nom.toLowerCase() === nom.toLowerCase()).map((e) => e.poids);
    return all.length ? Math.max(...all) : null;
  };

  const pickExo = (nom) => {
    setFNom(nom);
    const sugg = suggestionFor(nom);
    if (sugg) {
      setFPoids(fmtKg(sugg.cible));
      setFParBras(!!sugg.last.parBras);
      setFSeries(sugg.last.series > 6 ? 4 : sugg.last.series || 4);
      setFReps(sugg.last.reps || 10);
      if (sugg.last.reposSec) setFRepos(sugg.last.reposSec);
    }
  };

  // ————— Actions séance —————
  const demarrer = (nom, template) => {
    if (!nom.trim()) return;
    ensureAudio();
    saveCurrent({ startedAt: Date.now(), nom: nom.trim(), gourdes: 0, exos: [], exoEnCours: null, note: "", template: template || null });
    if (data.prochaine && data.prochaine.nom.toLowerCase() === nom.trim().toLowerCase()) {
      saveData({ ...data, prochaine: null });
    }
    setShowStart(false); setStartNom("");
    setPlanOuvert(true);
    setTab("seance");
  };

  const startRest = (sec) => {
    beepedRef.current = false;
    setRest({ endsAt: Date.now() + sec * 1000, total: sec });
  };

  const resetForm = () => {
    setFNom(""); setFPoids(""); setFRessenti(null); setFRpe(null);
    setFPhotoId(null); setFPhotoPreview(null);
    setEditExoId(null);
    setFTypeManuel(null); setFDistance(""); setFNiveau("");
  };

  const onPhotoPicked = async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    try {
      const dataUrl = await compressImage(file, 800, 0.6);
      const id = uid();
      if (window.storage) { try { await window.storage.set("plateau-photo-" + id, dataUrl); } catch {} }
      photoCache[id] = dataUrl;
      if (fPhotoId) supprimerPhoto(fPhotoId);
      setFPhotoId(id);
      setFPhotoPreview(dataUrl);
    } catch {} finally { setPhotoBusy(false); }
  };

  const retirerPhotoForm = () => {
    supprimerPhoto(fPhotoId);
    setFPhotoId(null);
    setFPhotoPreview(null);
  };

  const lancerFeedback = async (exo, cur, pr, prevBest) => {
    if (!COACH_DISPO) return;
    setCoachBusyId(exo.id);
    try {
      const rep = await askCoach(
        `${COACH_BASE(passages)}\n\n${buildContext(data)}\n\n` +
        `Séance en cours (${cur.nom}), déjà fait aujourd'hui :\n${cur.exos.map((e) => "- " + exoLine(e)).join("\n")}\n` +
        (cur.note && cur.note.trim() ? `Note de l’utilisateur sur la séance : ${cur.note.trim()}\n` : "") +
        `\n` +
        `Il vient tout juste de valider : ${exoLine(exo)}.` +
        (pr ? `\nC'est un NOUVEAU RECORD PERSONNEL sur cet exercice (ancien max : ${fmtKg(prevBest)} kg) — félicite-le sobrement.` : "") +
        `\nDonne ton retour de coach en 1 ou 2 phrases maximum (retour sur la charge et consigne pour la prochaine fois sur cet exercice).`
      );
      setCurrent((prev) => {
        if (!prev) return prev;
        const nx = { ...prev, exos: prev.exos.map((e) => (e.id === exo.id ? { ...e, coach: rep } : e)) };
        if (window.storage) window.storage.set("plateau-current", JSON.stringify(nx)).catch(() => {});
        return nx;
      });
    } catch (err) {
      if (!(err && err.noapi)) setCurrent((prev) => {
        if (!prev) return prev;
        return { ...prev, exos: prev.exos.map((e) => (e.id === exo.id ? { ...e, coach: "Coach injoignable pour le moment — série bien enregistrée." } : e)) };
      });
    } finally {
      setCoachBusyId(null);
    }
  };

  const serieMode = !!data.prefSerieParSerie;

  const validerExo = async () => {
    if (!current || !fNom.trim()) return;
    ensureAudio();

    // Cardio : durée, distance, niveau — pas de charge ni de chrono de repos
    if (isCardio && !editExoId) {
      const at = Date.now();
      const prevAt = current.exos.length ? current.exos[current.exos.length - 1].at || current.startedAt : current.startedAt;
      const exo = {
        id: uid(), nom: fNom.trim(), type: "cardio",
        dureeCardio: fDuree,
        distance: String(fDistance).trim() ? parseFloat(String(fDistance).replace(",", ".")) : null,
        niveau: String(fNiveau).trim() || null,
        poids: 0, parBras: false, series: 0, reps: 0, reposSec: null,
        ressenti: fRessenti, note: null, coach: null, photoId: fPhotoId, pr: false,
        at, dureeMin: Math.max(1, Math.round((at - prevAt) / 60000)),
      };
      const cur = { ...current, exos: [...current.exos, exo] };
      await saveCurrent(cur);
      resetForm();
      lancerFeedback(exo, cur, false, null);
      return;
    }

    const poids = parseFloat(String(fPoids).replace(",", "."));
    if (isNaN(poids)) return;

    // Mode édition : mise à jour sans chrono ni nouveau retour coach
    if (editExoId) {
      if (isCardio) {
        const cur0 = {
          ...current,
          exos: current.exos.map((e) =>
            e.id === editExoId
              ? {
                  ...e, nom: fNom.trim(), type: "cardio", dureeCardio: fDuree,
                  distance: String(fDistance).trim() ? parseFloat(String(fDistance).replace(",", ".")) : null,
                  niveau: String(fNiveau).trim() || null, ressenti: fRessenti, coach: null,
                }
              : e
          ),
        };
        await saveCurrent(cur0);
        resetForm();
        return;
      }
      const cur = {
        ...current,
        exos: current.exos.map((e) =>
          e.id === editExoId
            ? { ...e, nom: fNom.trim(), poids, parBras: fParBras, series: fSeries, reps: fReps, reposSec: fRepos, ressenti: fRessenti, coach: null, sets: null, note: e.sets ? null : e.note }
            : e
        ),
      };
      await saveCurrent(cur);
      resetForm();
      return;
    }

    // Mode série par série : la validation démarre l'exo avec sa 1ère série
    if (serieMode) {
      const exoEnCours = {
        id: uid(), nom: fNom.trim(), parBras: fParBras, reposSec: fRepos,
        photoId: fPhotoId, ressenti: null, prevu: fSeries,
        sets: [{ poids, reps: fReps }],
      };
      await saveCurrent({ ...current, exoEnCours });
      setEcPoids(fmtKg(poids));
      setEcReps(fReps);
      setFocusOuvert(true);
      resetForm();
      if (fSeries <= 1) {
        await finirExoAvec(exoEnCours, { ...current, exoEnCours });
      } else {
        startRest(fRepos);
      }
      return;
    }

    const prevBest = bestBefore(fNom.trim());
    const pr = prevBest != null && poids > prevBest;
    const at = Date.now();
    const prevAt = current.exos.length ? current.exos[current.exos.length - 1].at || current.startedAt : current.startedAt;
    const exo = {
      id: uid(), nom: fNom.trim(), poids, parBras: fParBras,
      series: fSeries, reps: fReps, reposSec: fRepos, ressenti: fRessenti, rpe: fRpe, note: null, coach: null,
      photoId: fPhotoId, pr, at, dureeMin: Math.max(1, Math.round((at - prevAt) / 60000)),
    };
    const cur = { ...current, exos: [...current.exos, exo] };
    await saveCurrent(cur);
    resetForm();
    startRest(fRepos);
    lancerFeedback(exo, cur, pr, prevBest);
  };

  // ————— Exo en cours (mode série par série) —————
  const validerSerie = async () => {
    const ec = current && current.exoEnCours;
    if (!ec) return;
    const poids = parseFloat(String(ecPoids).replace(",", "."));
    if (isNaN(poids)) return;
    ensureAudio();
    const nx = { ...ec, sets: [...ec.sets, { poids, reps: ecReps }] };
    const prevu = ec.prevu || 0;
    if (prevu && nx.sets.length >= prevu) {
      // dernière série prévue : l'exo est enregistré, et on garde un dernier repos
      await finirExoAvec(nx, { ...current, exoEnCours: nx });
      startRest(ec.reposSec);
      return;
    }
    await saveCurrent({ ...current, exoEnCours: nx });
    startRest(ec.reposSec);
  };

  const ajouterSeriePrevue = async () => {
    const ec = current && current.exoEnCours;
    if (!ec) return;
    await saveCurrent({ ...current, exoEnCours: { ...ec, prevu: (ec.prevu || ec.sets.length) + 1 } });
  };

  const supprimerSerie = async (idx) => {
    const ec = current && current.exoEnCours;
    if (!ec) return;
    const sets = ec.sets.filter((_, i) => i !== idx);
    if (!sets.length) return abandonnerExo(true);
    await saveCurrent({ ...current, exoEnCours: { ...ec, sets } });
  };

  const setRessentiEc = async (r) => {
    const ec = current && current.exoEnCours;
    if (!ec) return;
    await saveCurrent({ ...current, exoEnCours: { ...ec, ressenti: ec.ressenti === r ? null : r } });
  };

  const abandonnerExo = async (silencieux) => {
    const ec = current && current.exoEnCours;
    if (!ec) return;
    if (!silencieux && !window.confirm("Abandonner cet exercice ? Les séries saisies seront perdues.")) return;
    supprimerPhoto(ec.photoId);
    await saveCurrent({ ...current, exoEnCours: null });
  };

  const finirExoAvec = async (ecArg, curArg) => {
    const cur0 = curArg || current;
    const ec = ecArg || (cur0 && cur0.exoEnCours);
    if (!ec || !ec.sets.length) return;
    const poidsMax = Math.max(...ec.sets.map((s) => s.poids));
    const memesPoids = ec.sets.every((s) => s.poids === ec.sets[0].poids);
    const memesReps = ec.sets.every((s) => s.reps === ec.sets[0].reps);
    const prevBest = bestBefore(ec.nom);
    const pr = prevBest != null && poidsMax > prevBest;
    const at = Date.now();
    const prevAt = cur0.exos.length ? cur0.exos[cur0.exos.length - 1].at || cur0.startedAt : cur0.startedAt;
    const exo = {
      id: ec.id, nom: ec.nom, poids: poidsMax, parBras: ec.parBras,
      series: ec.sets.length, reps: ec.sets[0].reps,
      reposSec: ec.reposSec, ressenti: ec.ressenti, coach: null, photoId: ec.photoId, pr,
      sets: ec.sets, at, dureeMin: Math.max(1, Math.round((at - prevAt) / 60000)),
      note: memesPoids && memesReps ? null : "série par série : " + ec.sets.map((s) => `${fmtKg(s.poids)} kg ×${s.reps}`).join(", "),
    };
    const cur = { ...cur0, exos: [...cur0.exos, exo], exoEnCours: null };
    setRest(null); beepedRef.current = false;
    await saveCurrent(cur);
    lancerFeedback(exo, cur, pr, prevBest);
  };

  const finirExo = () => finirExoAvec(null, null);

  const finirSerieEtExo = async () => {
    const ec = current && current.exoEnCours;
    if (!ec) return;
    const poids = parseFloat(String(ecPoids).replace(",", "."));
    if (isNaN(poids)) return finirExo();
    const nx = { ...ec, sets: [...ec.sets, { poids, reps: ecReps }] };
    await finirExoAvec(nx, { ...current, exoEnCours: nx });
  };

  const isCardio = fTypeManuel !== null ? fTypeManuel === "cardio" : estCardio(fNom);

  const editerExo = (e) => {
    setEditExoId(e.id);
    setFNom(e.nom);
    setFTypeManuel(e.type === "cardio" ? "cardio" : "muscu");
    if (e.type === "cardio") {
      setFDuree(e.dureeCardio || 20);
      setFDistance(e.distance != null ? fmtKg(e.distance) : "");
      setFNiveau(e.niveau || "");
      setFRessenti(e.ressenti || null);
      setFPhotoId(null); setFPhotoPreview(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setFPoids(fmtKg(e.poids));
    setFParBras(!!e.parBras);
    setFSeries(e.series || 4);
    setFReps(e.reps || 10);
    setFRepos(e.reposSec || 90);
    setFRessenti(e.ressenti || null);
    setFPhotoId(null); setFPhotoPreview(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const supprimerExoCourant = async (id) => {
    if (!window.confirm("Supprimer cet exercice de la séance ?")) return;
    const e = current.exos.find((x) => x.id === id);
    if (e) supprimerPhoto(e.photoId);
    if (editExoId === id) resetForm();
    await saveCurrent({ ...current, exos: current.exos.filter((x) => x.id !== id) });
  };

  const terminer = async () => {
    if (!current) return;
    if (current.exoEnCours) {
      if (!window.confirm("Un exercice est en cours (mode série par série). Terminer la séance sans le valider ?")) return;
      supprimerPhoto(current.exoEnCours.photoId);
    }
    if (current.exos.length === 0) {
      if (!window.confirm("Aucun exercice enregistré. Terminer quand même ?")) return;
    }
    const duree = Math.max(1, Math.round((Date.now() - current.startedAt) / 60000));
    const seance = {
      id: uid(), date: todayISO(), nom: current.nom,
      duree, gourdes: current.gourdes, exos: current.exos, bilan: null,
      note: current.note && current.note.trim() ? current.note.trim() : null,
    };
    let next = { ...data, seances: [...data.seances, seance] };
    if (next.prochaine && next.prochaine.date <= todayISO()) next = { ...next, prochaine: null };
    try {
      await navigator.clipboard.writeText(JSON.stringify(next, null, 2));
      setFinJsonCopie(true);
      setTimeout(() => setFinJsonCopie(false), 9000);
    } catch {}
    await saveData(next);
    await saveCurrent(null);
    resetForm();
    setRest(null);
    setTab("historique");
    setExpandedId(seance.id);
    if (seance.exos.length) setBilanSeance(seance); // écran de fin fêté

    if (COACH_DISPO && seance.exos.length > 0) {
      setBilanBusyId(seance.id);
      try {
        const rep = await askCoach(
          `${COACH_BASE(passages + 1)}\n\n${buildContext(next)}\n\n` +
          `Séance qui vient de se terminer :\n${seance.date} — ${seance.nom}, ${fmtDuree(duree)}, ${seance.gourdes} gourde(s)\n` +
          `${seance.exos.map((e) => "- " + exoLine(e)).join("\n")}` +
          (seance.note ? `\nNote de l’utilisateur sur la séance : ${seance.note}` : "") +
          `\n\nFais ton bilan de coach en 3 à 5 phrases : ce qui était bien, un point à surveiller, et la séance que tu conseilles pour la prochaine fois. Termine par un rappel express de la douche.`
        );
        const next2 = { ...next, seances: next.seances.map((s) => (s.id === seance.id ? { ...s, bilan: rep } : s)) };
        await saveData(next2);
      } catch {} finally {
        setBilanBusyId(null);
      }
    }
  };

  const annuler = async () => {
    if (!window.confirm("Annuler la séance en cours ? Les séries saisies seront perdues.")) return;
    if (current) {
      current.exos.forEach((e) => supprimerPhoto(e.photoId));
      if (current.exoEnCours) supprimerPhoto(current.exoEnCours.photoId);
    }
    retirerPhotoForm();
    resetForm();
    setRest(null);
    await saveCurrent(null);
    setTab("accueil");
  };

  const supprimerSeance = async (id) => {
    if (!window.confirm("Supprimer définitivement cette séance ?")) return;
    const s = data.seances.find((x) => x.id === id);
    if (s) s.exos.forEach((e) => supprimerPhoto(e.photoId));
    await saveData({ ...data, seances: data.seances.filter((s2) => s2.id !== id) });
  };

  // ————— Édition dans l'historique —————
  const startEditHist = (sid, e) => {
    setEhKey(sid + "|" + e.id);
    setEhCardio(e.type === "cardio");
    if (e.type === "cardio") {
      setEhDuree(e.dureeCardio || 20);
      setEhDistance(e.distance != null ? fmtKg(e.distance) : "");
      return;
    }
    setEhPoids(fmtKg(e.poids));
    setEhSeries(e.series || 4);
    setEhReps(e.reps || 10);
  };
  const saveEditHist = async () => {
    const [sid, eid] = ehKey.split("|");
    const maj = ehCardio
      ? (e) => ({ ...e, dureeCardio: ehDuree, distance: String(ehDistance).trim() ? parseFloat(String(ehDistance).replace(",", ".")) : null })
      : (e) => ({ ...e, poids: parseFloat(String(ehPoids).replace(",", ".")), series: ehSeries, reps: ehReps, sets: null, note: e.sets ? null : e.note });
    if (!ehCardio && isNaN(parseFloat(String(ehPoids).replace(",", ".")))) return;
    const next = {
      ...data,
      seances: data.seances.map((s) =>
        s.id !== sid ? s : { ...s, exos: s.exos.map((e) => (e.id === eid ? maj(e) : e)) }
      ),
    };
    await saveData(next);
    setEhKey(null);
  };
  const supprimerExoHist = async (sid, eid) => {
    if (!window.confirm("Supprimer cet exercice de la séance ?")) return;
    const s = data.seances.find((x) => x.id === sid);
    const e = s && s.exos.find((x) => x.id === eid);
    if (e) supprimerPhoto(e.photoId);
    await saveData({
      ...data,
      seances: data.seances.map((s2) => (s2.id !== sid ? s2 : { ...s2, exos: s2.exos.filter((x) => x.id !== eid) })),
    });
    if (ehKey === sid + "|" + eid) setEhKey(null);
  };

  const renommerExo = async (ancien, nouveau) => {
    const a = ancien.toLowerCase(), nv = nouveau.trim();
    if (!nv) return;
    const maj = (e) => (e.nom.toLowerCase() === a ? { ...e, nom: nv } : e);
    const next = {
      ...data,
      seances: data.seances.map((s) => ({ ...s, exos: s.exos.map(maj) })),
      objectifs: (data.objectifs || []).map((o) => (o.nom.toLowerCase() === a ? { ...o, nom: nv } : o)),
    };
    await saveData(next);
    if (current) await saveCurrent({ ...current, exos: current.exos.map(maj) });
  };

  const refaireSeance = (s) => {
    if (current) { window.alert("Une séance est déjà en cours — termine-la d'abord."); return; }
    setExpandedId(null);
    demarrer(s.nom);
  };

  const saveNoteHist = async (sid) => {
    const v = ehNote.trim();
    await saveData({ ...data, seances: data.seances.map((s) => (s.id === sid ? { ...s, note: v || null } : s)) });
    setEhNoteKey(null);
  };

  const ajouterExoHist = async (sid) => {
    const nom = window.prompt("Nom de l'exercice oublié");
    if (!nom || !nom.trim()) return;
    if (estCardio(nom)) {
      const d = window.prompt("Durée en minutes", "20");
      const mn = parseInt(d, 10);
      if (!mn || mn <= 0) return;
      const exo = { id: uid(), nom: nom.trim(), type: "cardio", dureeCardio: mn, distance: null, niveau: null,
        poids: 0, parBras: false, series: 0, reps: 0, reposSec: null, ressenti: null, note: null, coach: null, photoId: null, pr: false };
      await saveData({ ...data, seances: data.seances.map((s) => (s.id === sid ? { ...s, exos: [...s.exos, exo] } : s)) });
      return;
    }
    const pd = window.prompt("Poids en kg", "20");
    const poids = parseFloat(String(pd).replace(",", "."));
    if (isNaN(poids)) return;
    const sr = parseInt(window.prompt("Nombre de séries", "4"), 10) || 4;
    const rp = parseInt(window.prompt("Répétitions par série", "10"), 10) || 10;
    const exo = { id: uid(), nom: nom.trim(), poids, parBras: false, series: sr, reps: rp,
      reposSec: 90, ressenti: null, note: null, coach: null, photoId: null, pr: false };
    await saveData({ ...data, seances: data.seances.map((s) => (s.id === sid ? { ...s, exos: [...s.exos, exo] } : s)) });
  };

  // ————— Récap partageable —————
  const recapSeanceText = (s) => {
    let txt = `PLATEAU — Séance ${s.nom} · ${fmtDate(s.date)}`;
    if (s.duree) txt += ` (${fmtDuree(s.duree)}${s.gourdes != null ? `, ${s.gourdes} gourde${s.gourdes > 1 ? "s" : ""}` : ""})`;
    txt += "\n\n";
    txt += s.exos.map((e) => "• " + exoLine(e)).join("\n");
    if (s.bilan) txt += `\n\nBilan du coach : ${s.bilan}`;
    return txt;
  };
  const partagerSeance = async (s) => {
    const txt = recapSeanceText(s);
    try {
      await navigator.clipboard.writeText(txt);
      setShareId(s.id);
      setShareFallback(null);
      setTimeout(() => setShareId(null), 2500);
    } catch {
      setShareFallback({ id: s.id, text: txt });
    }
  };

  // ————— Import d'une séance passée (collage de texte → parsing IA) —————
  const importerSeanceTexte = async () => {
    if (!importSeanceText.trim() || importSeanceBusy) return;
    setImportSeanceBusy(true);
    try {
      const rep = await askCoach(
        `Convertis ce récap de séance de musculation en JSON. Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte autour et sans balises markdown, au format exact : ` +
        `{"date":"YYYY-MM-DD ou null","nom":"Push","duree":90,"gourdes":2,"exos":[{"nom":"Pec Deck","poids":10,"parBras":false,"series":4,"reps":10,"reposSec":90,"ressenti":null,"note":null}]}. ` +
        `Règles : "date" null si absente du texte ; "duree" en minutes, null si absente ; "gourdes" null si absent ; "parBras" true si la charge est indiquée par bras ou par haltère ; ` +
        `"ressenti" vaut "marge" (facile, de la marge), "tirait" (difficile) ou null ; "note" pour tout détail utile (dégressif, angles…), sinon null.\n\nRécap :\n${importSeanceText.trim()}`
      );
      const obj = JSON.parse(rep.replace(/```json|```/g, "").trim());
      if (!obj || !Array.isArray(obj.exos) || !obj.exos.length) throw new Error("format");
      const date = obj.date && /^\d{4}-\d{2}-\d{2}$/.test(obj.date) ? obj.date : importSeanceDate;
      if (!date) {
        window.alert("Pas de date trouvée dans le texte — choisis-la dans le champ date puis relance.");
        setImportSeanceBusy(false);
        return;
      }
      const seance = {
        id: uid(), date, nom: obj.nom || "Séance",
        duree: obj.duree ? Number(obj.duree) : null,
        gourdes: obj.gourdes != null ? Number(obj.gourdes) : null,
        bilan: null, note: null,
        exos: obj.exos.map((e) => ({
          id: uid(), nom: String(e.nom || "Exo"), poids: Number(e.poids) || 0, parBras: !!e.parBras,
          series: Number(e.series) || 1, reps: Number(e.reps) || 1,
          reposSec: e.reposSec ? Number(e.reposSec) : null,
          ressenti: e.ressenti === "marge" || e.ressenti === "tirait" ? e.ressenti : null,
          note: e.note || null, coach: null,
        })),
      };
      const seances = [...data.seances, seance].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
      await saveData({ ...data, seances });
      setImportSeanceOpen(false);
      setImportSeanceText("");
      setImportSeanceDate("");
      setExpandedId(seance.id);
    } catch (e) {
      window.alert(e && e.noapi ? MSG_NOAPI : "Impossible de structurer ce récap — vérifie le texte ou reformule-le un peu.");
    } finally { setImportSeanceBusy(false); }
  };

  // ————— Calculs —————
  const jambesFaites = data.seances.some((s) => s.nom.toLowerCase().includes("jambe"));
  const passages = PASSAGES_BASE + data.seances.filter((s) => s.date > PASSAGES_BASE_DATE).length + (data.passagesOffset || 0);
  const palier = passages < 25 ? { cible: 25, nom: "MACHINE" } : { cible: 50, nom: "GOAT" };
  const streak = streakSemaines(data);

  const jourDuJour = (data.jours || {})[todayISO()] || {};
  const setJour = (patch) => {
    const d = todayISO();
    const jours = { ...(data.jours || {}) };
    jours[d] = { ...(jours[d] || {}), ...patch };
    saveData({ ...data, jours });
  };
  const seanceAujourdhui = !!current || data.seances.some((s) => s.date === todayISO());
  const lastSeanceDate = data.seances.length ? [...data.seances.map((s) => s.date)].sort().slice(-1)[0] : null;
  const reposDepuis = lastSeanceDate ? joursDepuis(lastSeanceDate) : null;
  const sommeils = [...Array(7)].map((_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - i);
    return ((data.jours || {})[isoOf(dt)] || {}).sommeil;
  }).filter((v) => v != null);
  const sommeilMoyen = sommeils.length ? Math.round((sommeils.reduce((a, b) => a + b, 0) / sommeils.length) * 10) / 10 : null;

  const dernierPoids = (data.poids || []).length ? data.poids[data.poids.length - 1] : null;
  const poidsCorps = dernierPoids ? dernierPoids.kg : POIDS_DEFAUT;

  const deltaExo = (nom, poids) => {
    let precedent = null;
    data.seances.forEach((s) => {
      s.exos.forEach((e) => {
        if (e.nom.toLowerCase() === nom.toLowerCase() && e.type !== "cardio") {
          if (!precedent || s.date >= precedent.date) precedent = { date: s.date, poids: e.poids };
        }
      });
    });
    if (!precedent) return null;
    const d = Math.round((poids - precedent.poids) * 10) / 10;
    return { delta: d, date: precedent.date, avant: precedent.poids };
  };

  const seriesJour = current ? current.exos.reduce((a, e) => a + (e.type === "cardio" ? 0 : (e.series || 0)), 0) : 0;
  const sugg = fNom.trim() && !editExoId ? suggestionFor(fNom.trim()) : null;
  const stag = fNom.trim() && !editExoId ? stagnationsDe(data).find((x) => x.nom.toLowerCase() === fNom.trim().toLowerCase()) : null;
  const mursRecords = useMemo(() => {
    const best = {};
    data.seances.forEach((s) =>
      s.exos.forEach((e) => {
        if (e.type === "cardio") return;
        const k = e.nom.toLowerCase();
        if (!best[k] || e.poids > best[k].poids) best[k] = { nom: e.nom, poids: e.poids, date: s.date, parBras: e.parBras };
      })
    );
    return Object.values(best).sort((a, b) => b.poids - a.poids);
  }, [data]);
  const rappelPhotoId = !fPhotoPreview && sugg && sugg.last.photoId ? sugg.last.photoId : null;

  const planSeance = useMemo(() => {
    if (!current) return null;
    const past = [...data.seances].reverse().find((s) => s.nom.toLowerCase() === current.nom.toLowerCase());
    if (!past) return null;
    const ordre = (data.ordres || {})[current.nom.toLowerCase()];
    if (!ordre) return past.exos;
    const rang = (nom) => { const i = ordre.indexOf(nom.toLowerCase()); return i === -1 ? 999 : i; };
    return [...past.exos].sort((a, b) => rang(a.nom) - rang(b.nom));
  }, [current, data]);

  const deplacerPlan = async (idx, dir) => {
    if (!planSeance || !current) return;
    const cible = idx + dir;
    if (cible < 0 || cible >= planSeance.length) return;
    const noms = planSeance.map((x) => x.nom.toLowerCase());
    [noms[idx], noms[cible]] = [noms[cible], noms[idx]];
    await saveData({ ...data, ordres: { ...(data.ordres || {}), [current.nom.toLowerCase()]: noms } });
  };

  const demanderPlanIA = async () => {
    if (!current || planIABusy) return;
    setPlanIABusy(true);
    try {
      const rep = await askCoach(
        `${COACH_BASE(passages)}\n\n${buildContext(data)}\n\n` +
        `l’utilisateur démarre sa toute première séance "${current.nom}" en salle. ` +
        `Propose un plan de 5 à 7 exercices adaptés à cette séance, avec des charges de départ prudentes pour une première fois, en cohérence avec son niveau visible dans l'historique. ` +
        `Réponds UNIQUEMENT avec un tableau JSON valide, sans aucun texte autour et sans balises markdown, au format exact : ` +
        `[{"nom":"Presse à cuisses","poids":40,"parBras":false,"series":4,"reps":10,"reposSec":120,"conseil":"dos plaqué au dossier, pieds largeur épaules"}] — "conseil" en 12 mots max sur le placement ou réglage machine.`
      );
      const plan = JSON.parse(rep.replace(/```json|```/g, "").trim());
      if (!Array.isArray(plan) || !plan.length) throw new Error("format");
      await saveCurrent({
        ...current,
        planIA: plan.map((p) => ({
          id: uid(), nom: String(p.nom || "Exo"), poids: Number(p.poids) || 0, parBras: !!p.parBras,
          series: Number(p.series) || 4, reps: Number(p.reps) || 10, reposSec: p.reposSec ? Number(p.reposSec) : 90,
          conseil: p.conseil ? String(p.conseil) : null,
        })),
      });
    } catch (e) {
      window.alert(e && e.noapi ? MSG_NOAPI : "Le coach n'a pas réussi à générer le plan — réessaie.");
    } finally { setPlanIABusy(false); }
  };

  const pickExoPlan = (p) => {
    setFNom(p.nom);
    setFPoids(fmtKg(p.poids));
    setFParBras(!!p.parBras);
    setFSeries(p.series);
    setFReps(p.reps);
    if (p.reposSec) setFRepos(p.reposSec);
  };

  // ————— Coach (accueil, récup) —————
  const demanderConseil = async (type) => {
    setConseilBusy(true); setConseil(null);
    try {
      const question = type === "semaine"
        ? `Fais le bilan complet de sa semaine (7 derniers jours) : séances, volume par groupe musculaire, récupération (sommeil, alimentation, douches), poids de corps, streak et progression Level Up. 6 à 8 phrases, honnête sur les points faibles, et termine par le plan concret de la semaine à venir.`
        : `Quelle séance conseilles-tu aujourd'hui, et pourquoi ? Réponds en 2 ou 3 phrases.`;
      const rep = await askCoach(`${COACH_BASE(passages)}\n\n${buildContext(data)}\n\n${question}`);
      setConseil(rep);
    } catch (e) {
      setConseil(e && e.noapi ? MSG_NOAPI : "Coach injoignable pour le moment, réessaie dans un instant.");
    } finally { setConseilBusy(false); }
  };

  const poserQuestion = async () => {
    if (!q.trim() || qBusy) return;
    setQBusy(true); setQResp(null);
    try {
      const rep = await askCoach(
        `${COACH_BASE(passages)}\n\n${buildContext(data)}\n\n` +
        `Question de l’utilisateur : ${q.trim()}\nRéponds en 4 phrases maximum.`
      );
      setQResp(rep);
    } catch (e) {
      setQResp(e && e.noapi ? MSG_NOAPI : "Coach injoignable pour le moment, réessaie dans un instant.");
    } finally { setQBusy(false); }
  };

  const demanderAvisRecup = async () => {
    setRecupBusy(true); setRecupAvis(null);
    try {
      const rep = await askCoach(
        `${COACH_BASE(passages)}\n\n${buildContext(data)}\n\n` +
        `Donne ton avis de coach sur sa récupération (sommeil, alimentation, espacement des séances, douche, poids de corps) en 3 ou 4 phrases, avec un conseil concret.`
      );
      setRecupAvis(rep);
    } catch (e) {
      setRecupAvis(e && e.noapi ? MSG_NOAPI : "Coach injoignable pour le moment, réessaie dans un instant.");
    } finally { setRecupBusy(false); }
  };

  const demanderStrategiePlateau = async (nomExo, poidsStag) => {
    if (stagBusy) return;
    setStagBusy(true); setStagAvis(null);
    try {
      const rep = await askCoach(
        `${COACH_BASE(passages)}\n\n${buildContext(data)}\n\n` +
        `l’utilisateur est en plateau sur "${nomExo}" : 3 séances à ${fmtKg(poidsStag)} kg et ça tire toujours. ` +
        `Donne ta stratégie de déblocage concrète en 2 ou 3 phrases (deload -10 % et remontée, tempo lent, ou variante d'exercice — choisis).`
      );
      setStagAvis(rep);
    } catch (e) {
      setStagAvis(e && e.noapi ? MSG_NOAPI : "Coach injoignable pour le moment, réessaie dans un instant.");
    } finally { setStagBusy(false); }
  };

  const definirCibleMuscle = (m) => {
    const cur = (data.ciblesMuscles || {})[m] || "";
    const v = window.prompt(`Cible de séries par semaine pour ${m} (vide ou 0 pour retirer)`, cur);
    if (v === null) return;
    const n = parseInt(v, 10);
    const cibles = { ...(data.ciblesMuscles || {}) };
    if (!n || n <= 0) delete cibles[m];
    else cibles[m] = n;
    saveData({ ...data, ciblesMuscles: cibles });
  };

  const genererCarte = async (s) => {
    try { await document.fonts.load('92px Anton'); } catch {}
    const W = 1080, H = 1350;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#f6f4ef"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#211f1a"; ctx.font = "92px Anton, 'Arial Narrow', sans-serif";
    ctx.fillText("PLATEAU", 70, 150);
    const w1 = ctx.measureText("PLATEAU").width;
    ctx.fillStyle = "#f5c518"; ctx.fillText(".", 70 + w1, 150);
    ctx.font = "64px Anton, 'Arial Narrow', sans-serif";
    ctx.fillText(s.nom.toUpperCase(), 70, 265);
    ctx.fillStyle = "#726c5e"; ctx.font = "32px -apple-system, sans-serif";
    ctx.fillText(
      `${fmtDate(s.date)}${s.duree ? " · " + fmtDuree(s.duree) : ""}${s.gourdes != null ? " · " + s.gourdes + " gourde" + (s.gourdes > 1 ? "s" : "") : ""}`,
      70, 320
    );
    ctx.strokeStyle = "#e2ded2"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(70, 360); ctx.lineTo(W - 70, 360); ctx.stroke();
    let y = 430;
    const exos = s.exos.slice(0, 11);
    exos.forEach((e) => {
      ctx.fillStyle = "#211f1a"; ctx.font = "600 34px -apple-system, sans-serif"; ctx.textAlign = "left";
      const nom = e.nom.length > 24 ? e.nom.slice(0, 23) + "…" : e.nom;
      ctx.fillText(nom, 70, y);
      ctx.fillStyle = e.pr ? "#8a5b00" : "#726c5e"; ctx.font = "700 34px -apple-system, sans-serif"; ctx.textAlign = "right";
      ctx.fillText(`${e.series}×${e.reps} @ ${fmtKg(e.poids)} kg${e.parBras ? "/br" : ""}${e.pr ? " ★PR" : ""}`, W - 70, y);
      y += 64;
    });
    ctx.textAlign = "left";
    if (s.exos.length > 11) {
      ctx.fillStyle = "#726c5e"; ctx.font = "30px -apple-system, sans-serif";
      ctx.fillText(`+ ${s.exos.length - 11} autres…`, 70, y);
    }
    ctx.fillStyle = "#8a5b00"; ctx.font = "700 36px -apple-system, sans-serif";
    ctx.fillText(`🔥 ${streak} sem. streak · la salle ${passages}/${palier.cible}`, 70, H - 90);
    setPhotoView(cv.toDataURL("image/png"));
  };

  // ————— Poids de corps + mensurations —————
  const ajouterPoids = async () => {
    const kg = parseFloat(String(pdsInput).replace(",", "."));
    if (isNaN(kg) || kg < 30 || kg > 200) return;
    const arr = [...(data.poids || []).filter((p) => p.date !== todayISO()), { date: todayISO(), kg }]
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    await saveData({ ...data, poids: arr });
    setPdsInput("");
  };

  const ajouterMensu = async () => {
    const cm = parseFloat(String(mensuInput).replace(",", "."));
    if (isNaN(cm) || cm < 10 || cm > 250) return;
    const arr = [
      ...(data.mensu || []).filter((m) => !(m.date === todayISO() && m.zone === mensuZone)),
      { date: todayISO(), zone: mensuZone, cm },
    ].sort((a, b) => (a.date < b.date ? -1 : 1));
    await saveData({ ...data, mensu: arr });
    setMensuInput("");
  };

  const supprimerPoids = async (date) => {
    if (!window.confirm(`Supprimer la pesée du ${fmtShort(date)} ?`)) return;
    await saveData({ ...data, poids: (data.poids || []).filter((p) => p.date !== date) });
  };
  const supprimerMensu = async (date, zone) => {
    if (!window.confirm(`Supprimer la mesure ${zone.toLowerCase()} du ${fmtShort(date)} ?`)) return;
    await saveData({ ...data, mensu: (data.mensu || []).filter((m) => !(m.date === date && m.zone === zone)) });
  };

  const dernieresMensu = ZONES.map((z) => {
    const zs = (data.mensu || []).filter((m) => m.zone === z);
    if (!zs.length) return { zone: z, last: null, delta: null };
    const last = zs[zs.length - 1];
    const prev = zs.length > 1 ? zs[zs.length - 2] : null;
    return { zone: z, last, delta: prev ? Math.round((last.cm - prev.cm) * 10) / 10 : null };
  });

  // ————— Planification —————
  const enregistrerPlanif = async () => {
    if (!planifNom.trim() || !planifDate) return;
    await saveData({ ...data, prochaine: { nom: planifNom.trim(), date: planifDate } });
    setPlanifOpen(false); setPlanifNom(""); setPlanifDate("");
  };
  const planifRelatif = (iso) => {
    const d = joursDepuis(iso);
    if (d === 0) return { txt: "aujourd'hui", retard: false };
    if (d === -1) return { txt: "demain", retard: false };
    if (d < 0) return { txt: `dans ${-d} j`, retard: false };
    return { txt: `il y a ${d} j`, retard: true };
  };

  // ————— Objectif de séances par semaine —————
  const objSeances = data.objSeancesSemaine || OBJ_SEANCES_DEFAUT;
  const seancesSemaine = seancesCetteSemaine(data);
  const definirObjSeances = () => {
    const v = window.prompt("Objectif de séances par semaine", String(objSeances));
    if (v === null) return;
    const n = parseInt(v, 10);
    if (!n || n < 1 || n > 14) return;
    saveData({ ...data, objSeancesSemaine: n });
  };

  // ————— Programmes personnels (créés depuis l'historique) —————
  const enregistrerProgramme = async (s) => {
    const nom = window.prompt("Nom du programme", s.nom);
    if (!nom || !nom.trim()) return;
    const exos = (s.exos || []).filter((e) => e.type !== "cardio").map((e) => ({
      nom: e.nom, poids: e.poids, parBras: !!e.parBras, series: e.series || 4, reps: e.reps || 10, reposSec: e.reposSec || 90,
    }));
    if (!exos.length) { window.alert("Aucun exercice de muscu à enregistrer dans un programme."); return; }
    await saveData({ ...data, programmesPerso: [...(data.programmesPerso || []), { id: uid(), nom: nom.trim(), exos }] });
  };
  const supprimerProgrammePerso = async (id) => {
    if (!window.confirm("Supprimer ce programme ?")) return;
    await saveData({ ...data, programmesPerso: (data.programmesPerso || []).filter((p) => p.id !== id) });
  };
  const demarrerProgramme = (prog) => {
    if (current) { window.alert("Une séance est déjà en cours — termine-la d'abord."); return; }
    demarrer(prog.nom, prog.exos);
  };
  const pickTemplateExo = (p) => {
    const sugg = suggestionFor(p.nom);
    setFNom(p.nom);
    setFParBras(!!p.parBras);
    setFSeries(p.series || 4);
    setFReps(p.reps || 10);
    if (p.reposSec) setFRepos(p.reposSec);
    setFPoids(fmtKg(sugg ? sugg.cible : p.poids));
  };

  const copierContexte = async () => {
    const d = dataRef.current;
    const p = PASSAGES_BASE + d.seances.filter((s) => s.date > PASSAGES_BASE_DATE).length + (d.passagesOffset || 0);
    const txt =
      "Voici mes données PLATEAU (mon app de musculation). Réponds-moi comme mon coach.\n\n" +
      buildContext(d) +
      `\nla salle : ${p} passages en salle (palier à 25).`;
    try {
      await navigator.clipboard.writeText(txt);
      setCtxCopie(true);
      setTimeout(() => setCtxCopie(false), 4000);
    } catch {
      window.alert("Copie impossible ici.");
    }
  };

  // ————— Export / import —————
  const reprendreSauvegarde = async () => {
    try {
      const txt = await navigator.clipboard.readText();
      const obj = JSON.parse(txt);
      if (!obj || !Array.isArray(obj.seances)) throw new Error("format");
      // robustesse : une séance sans exos (JSON bricolé) ferait planter les calculs
      obj.seances = obj.seances.map((s) => ({ ...s, exos: Array.isArray(s.exos) ? s.exos : [] }));
      if (!window.confirm("Restaurer cette sauvegarde ? Les données affichées seront remplacées.")) return;
      const { enCours, ...rest } = obj;
      await saveData(rest);
      if (enCours && enCours.startedAt) {
        await saveCurrent(enCours);
        if (enCours.exoEnCours && enCours.exoEnCours.sets && enCours.exoEnCours.sets.length) {
          const lastSet = enCours.exoEnCours.sets[enCours.exoEnCours.sets.length - 1];
          setEcPoids(fmtKg(lastSet.poids));
          setEcReps(lastSet.reps);
        }
        setTab("seance");
      }
    } catch {
      window.alert("Pas de sauvegarde PLATEAU valide dans le presse-papier.");
    }
  };
  const exportPayload = () => (current ? { ...data, enCours: current } : data);
  const copierEtat = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportPayload(), null, 2));
      setEtatCopie(true);
      setTimeout(() => setEtatCopie(false), 4000);
    } catch {
      window.alert("Copie impossible ici — utilise « Copier le JSON » sur l'accueil.");
    }
  };
  const exporter = async () => {
    const txt = JSON.stringify(exportPayload(), null, 2);
    try {
      await navigator.clipboard.writeText(txt);
      setCopieOk(true);
      setExportText(null);
      setTimeout(() => setCopieOk(false), 2500);
    } catch {
      setExportText(txt);
    }
  };
  const importer = async () => {
    try {
      const obj = JSON.parse(importText);
      if (!obj || !Array.isArray(obj.seances)) throw new Error("format");
      // robustesse : une séance sans exos (JSON bricolé) ferait planter les calculs
      obj.seances = obj.seances.map((s) => ({ ...s, exos: Array.isArray(s.exos) ? s.exos : [] }));
      if (!window.confirm("Remplacer toutes les données actuelles par cet import ?")) return;
      const { enCours, ...rest } = obj;
      await saveData(rest);
      if (enCours && enCours.startedAt) {
        await saveCurrent(enCours);
        if (enCours.exoEnCours && enCours.exoEnCours.sets && enCours.exoEnCours.sets.length) {
          const lastSet = enCours.exoEnCours.sets[enCours.exoEnCours.sets.length - 1];
          setEcPoids(fmtKg(lastSet.poids));
          setEcReps(lastSet.reps);
        }
        setTab("seance");
      }
      setImportOpen(false);
      setImportText("");
    } catch {
      window.alert("JSON invalide — vérifie le contenu collé.");
    }
  };

  // ————— Données progression —————
  const chartData = useMemo(() => {
    if (!selExo) return [];
    return data.seances
      .filter((s) => s.exos.some((e) => e.nom.toLowerCase() === selExo.toLowerCase()))
      .map((s) => ({
        date: fmtShort(s.date),
        poids: Math.max(...s.exos.filter((e) => e.nom.toLowerCase() === selExo.toLowerCase()).map((e) => e.poids)),
      }));
  }, [data, selExo]);
  const recordExo = chartData.length ? Math.max(...chartData.map((d) => d.poids)) : null;
  const objectifSel = selExo ? (data.objectifs || []).find((o) => o.nom.toLowerCase() === selExo.toLowerCase()) : null;
  const rm1Sel = selExo ? best1RM(data, selExo) : null;

  const definirObjectif = async () => {
    const cible = parseFloat(String(objInput).replace(",", "."));
    if (!selExo || isNaN(cible) || cible <= 0) return;
    const arr = [...(data.objectifs || []).filter((o) => o.nom.toLowerCase() !== selExo.toLowerCase()), { nom: selExo, cible }];
    await saveData({ ...data, objectifs: arr });
    setObjInput("");
    setObjEdit(false);
  };
  const retirerObjectif = async () => {
    if (!selExo) return;
    await saveData({ ...data, objectifs: (data.objectifs || []).filter((o) => o.nom.toLowerCase() !== selExo.toLowerCase()) });
    setObjInput("");
    setObjEdit(false);
  };

  const chartPoids = useMemo(
    () => (data.poids || []).map((p) => ({ date: fmtShort(p.date), kg: p.kg })),
    [data]
  );
  const chartMensu = useMemo(
    () => (data.mensu || []).filter((m) => m.zone === progMensuZone).map((m) => ({ date: fmtShort(m.date), cm: m.cm })),
    [data, progMensuZone]
  );
  const volumes = volumeMuscles7j(data, current ? current.exos : []);
  const maxVol = Math.max(1, ...MUSCLE_ORDRE.map((m) => volumes[m] || 0));

  useEffect(() => {
    if (!selExo && allExos.length) setSelExo(allExos[0]);
  }, [allExos, selExo]);

  const elapsed = current ? Math.max(0, Math.floor((now - current.startedAt) / 1000)) : 0;
  const elapsedTxt = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  const ec = current && current.exoEnCours;

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg, color: C.dim }}>
        Chargement…
      </div>
    );
  }

  // ————— Rendu —————
  return (
    <div className="pl-root min-h-screen w-full" style={{ color: C.text }}>
      <style>{`
        @keyframes plGo { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .55; transform: scale(1.06); } }
        @keyframes plFlash { 0%,100% { background: #eafbf1; } 50% { background: #c9f0d8; } }
        .pl-go { animation: plGo 0.9s ease-in-out infinite; }
        .pl-flash { animation: plFlash 0.9s ease-in-out infinite; }
        input::placeholder, textarea::placeholder { color: ${C.dim}; opacity: .7; }
        select { -webkit-appearance: none; }
        input[type="date"] { color-scheme: light; }
        input, textarea, select { transition: border-color .18s ease, box-shadow .18s ease; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: ${C.yellowDim} !important; box-shadow: 0 0 0 3px rgba(245,197,24,.18); }
        ::selection { background: rgba(245,197,24,.35); }

        /* Fond : clair, chaud, grain très subtil + halo jaune */
        .pl-root { position: relative; background:
          radial-gradient(rgba(20,16,8,.028) 1px, transparent 1.6px) 0 0 / 7px 7px,
          radial-gradient(130% 62% at 50% -6%, rgba(245,197,24,.12), transparent 58%),
          ${C.bg}; }
        .pl-content { position: relative; z-index: 1; }

        /* Header collant */
        .pl-header { position: sticky; top: 0; z-index: 20; margin: 0 -1rem; padding: 0.9rem 1rem 0.7rem;
          background: linear-gradient(${C.bg} 60%, rgba(246,244,239,0)); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }

        /* Carte */
        .pl-card { background: linear-gradient(180deg, #ffffff, #fbf9f3); border: 1px solid ${C.hair};
          box-shadow: 0 1px 0 rgba(255,255,255,.6) inset, 0 10px 22px -16px rgba(20,16,8,.18); }

        /* Feedback tactile */
        .pl-tap { transition: transform .12s ease, filter .18s ease; -webkit-tap-highlight-color: transparent; }
        .pl-tap:active { transform: scale(.97); }
        .pl-chip-on { box-shadow: 0 4px 14px -6px rgba(245,197,24,.55); }

        /* Entrée en cascade des blocs d'un onglet */
        .pl-anim > * { opacity: 0; animation: plRise .5s cubic-bezier(.2,.7,.2,1) forwards; }
        .pl-anim > *:nth-child(1){animation-delay:.02s}.pl-anim > *:nth-child(2){animation-delay:.06s}
        .pl-anim > *:nth-child(3){animation-delay:.10s}.pl-anim > *:nth-child(4){animation-delay:.14s}
        .pl-anim > *:nth-child(5){animation-delay:.18s}.pl-anim > *:nth-child(6){animation-delay:.22s}
        .pl-anim > *:nth-child(7){animation-delay:.26s}.pl-anim > *:nth-child(n+8){animation-delay:.30s}
        @keyframes plRise { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }

        /* Hero "Démarrer" */
        .pl-hero { position: relative; overflow: hidden; border: none; text-align: left;
          background: linear-gradient(165deg, ${C.yellowHi}, ${C.yellow} 46%, #e0af0c);
          box-shadow: 0 16px 44px -14px rgba(245,197,24,.55), 0 2px 0 rgba(255,255,255,.25) inset; }
        .pl-hero-glow { position: absolute; inset: -40% -12% auto auto; width: 72%; height: 190%; pointer-events: none;
          background: radial-gradient(closest-side, rgba(255,255,255,.5), transparent); transform: rotate(18deg); animation: plSweep 5.5s ease-in-out infinite; }
        @keyframes plSweep { 0%,100% { opacity: .22; transform: translateX(-6%) rotate(18deg) } 50% { opacity: .55; transform: translateX(10%) rotate(18deg) } }
        .pl-hero-plate { position: absolute; right: -26px; bottom: -30px; width: 130px; height: 130px; border-radius: 50%; border: 16px solid rgba(20,18,0,.10); pointer-events: none; }
        .pl-hero-plate::after { content: ''; position: absolute; inset: 20px; border-radius: 50%; border: 7px solid rgba(20,18,0,.10); }

        /* Point "live" pulsé */
        .pl-live { width: 7px; height: 7px; border-radius: 50%; background: ${C.green}; animation: plPulse 1.8s infinite; }
        @keyframes plPulse { 0% { box-shadow: 0 0 0 0 rgba(86,217,138,.55) } 70% { box-shadow: 0 0 0 7px rgba(86,217,138,0) } 100% { box-shadow: 0 0 0 0 rgba(86,217,138,0) } }

        /* Titre de section + ruban de chantier */
        .pl-label { display: flex; align-items: center; gap: 10px; margin: 6px 2px 2px; font-size: 11px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; color: ${C.dim}; }
        .pl-tape { flex: 1; height: 8px; border-radius: 2px; opacity: .5;
          background: repeating-linear-gradient(-45deg, ${C.yellow} 0 7px, #111 7px 14px);
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 42%); mask-image: linear-gradient(90deg, transparent, #000 42%); }

        /* Barres de volume */
        /* Barre d'onglets flottante */
        .pl-tabbar { position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; z-index: 40; width: 100%; max-width: 28rem;
          display: flex; padding: 8px 12px calc(10px + env(safe-area-inset-bottom));
          background: linear-gradient(rgba(246,244,239,0), ${C.bg} 40%); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
        .pl-tabbar-in { display: flex; flex: 1; background: rgba(255,255,255,.82); border: 1px solid ${C.hair}; border-radius: 18px; padding: 5px; gap: 2px;
          box-shadow: 0 10px 26px -16px rgba(20,16,8,.22); }
        .pl-tab { flex: 1; border: none; background: none; cursor: pointer; position: relative; border-radius: 13px;
          display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 7px 0 5px; }
        .pl-tab > * { position: relative; z-index: 1; }
        .pl-tab.on::before { content: ''; position: absolute; inset: 0; border-radius: 13px; border: 1px solid rgba(245,197,24,.4);
          background: linear-gradient(180deg, rgba(245,197,24,.28), rgba(245,197,24,.12)); }

        .pl-ring-glow { filter: drop-shadow(0 0 10px rgba(245,197,24,.35)); }
        .pl-atoi { animation: plAtoi 1.6s ease-in-out infinite; }
        @keyframes plAtoi { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.06); opacity: .9 } }

        /* Confettis (record battu) */
        .pl-confetti { position: fixed; inset: 0; pointer-events: none; z-index: 60; overflow: hidden; }
        .pl-confetti i { position: absolute; top: -12px; width: 8px; height: 14px; border-radius: 2px; animation: plFall linear forwards; }
        @keyframes plFall { to { transform: translateY(105vh) rotate(720deg); opacity: .1 } }

        @media (prefers-reduced-motion: reduce) {
          .pl-anim > *, .pl-hero-glow, .pl-live, .pl-atoi, .pl-go, .pl-flash { animation: none !important; opacity: 1 !important; transform: none !important; }
          .pl-confetti { display: none; }
        }
      `}</style>

      <div className="pl-content max-w-md mx-auto px-4" style={{ paddingBottom: "6.5rem" }}>

        {/* ————— Header ————— */}
        <div className="pl-header flex items-end justify-between mb-3">
          <div>
            <div className="text-3xl leading-none" style={{ ...DISPLAY, color: C.text }}>
              PLATEAU<span style={{ color: C.yellowDim }}>.</span>
            </div>
            <div className="text-xs mt-1 capitalize" style={{ color: C.dim }}>
              <span style={{ color: C.text, fontWeight: 700 }}>{salutation()}</span>
              {" · "}
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {clipState !== "idle" && data.prefAutoCopie === true && (
              <div className="text-xs font-semibold" style={{ color: clipState === "sync" ? C.green : C.dim }}>
                {clipState === "sync" ? "💾 sauvegarde copiée" : "💾 …"}
              </div>
            )}
            {current && tab !== "seance" && (
              <button
                onClick={() => setTab("seance")}
                className="pl-tap flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: "linear-gradient(180deg,#ffffff,#f3f0e6)", border: `1px solid ${C.hair}`, color: C.text }}
              >
                <span className="pl-live" /> Séance · {elapsedTxt}
              </button>
            )}
          </div>
        </div>

        {storageOk === false && (
          <div
            className="rounded-xl px-3 py-2 mb-3 text-xs font-semibold leading-relaxed"
            style={{ background: "#2a1518", border: `1px solid ${C.red}`, color: C.red }}
          >
            Stockage inaccessible (navigation privée ?). Active « Copie auto » dans Mes données
            pour garder une sauvegarde dans ton presse-papier.
          </div>
        )}

        {/* ————— ACCUEIL ————— */}
        {tab === "accueil" && (
          <div className="space-y-3 pl-anim">
            {!current ? (
              <button
                onClick={() => setShowStart(true)}
                className="pl-hero pl-tap w-full rounded-3xl px-5 py-5"
                style={{ color: "#141200" }}
              >
                <span className="pl-hero-glow" /><span className="pl-hero-plate" />
                <div className="text-xs font-extrabold tracking-widest uppercase" style={{ opacity: .6 }}>Prêt à charger</div>
                <div className="text-3xl leading-none mt-1" style={DISPLAY}>Démarrer une séance</div>
                <div className="text-xs font-semibold mt-2 flex items-center gap-1.5" style={{ opacity: .72 }}>
                  <Play size={13} />
                  {data.prochaine ? `${data.prochaine.nom} t'attend` : "C'est le moment"}
                </div>
              </button>
            ) : (
              <button
                onClick={() => setTab("seance")}
                className="pl-hero pl-tap w-full rounded-3xl px-5 py-5"
                style={{ color: "#141200" }}
              >
                <span className="pl-hero-glow" /><span className="pl-hero-plate" />
                <div className="text-xs font-extrabold tracking-widest uppercase flex items-center gap-1.5" style={{ opacity: .62 }}>
                  <span className="pl-live" style={{ background: "#141200" }} /> Séance en cours
                </div>
                <div className="text-3xl leading-none mt-1" style={DISPLAY}>Reprendre · {current.nom}</div>
                <div className="text-sm font-bold mt-2" style={{ ...NUMS, opacity: .78 }}>{elapsedTxt} écoulées</div>
              </button>
            )}

            {/* Objectif de la semaine */}
            <Card onClick={definirObjSeances} className="pl-tap flex items-center gap-4">
              <Ring value={seancesSemaine} max={objSeances} color={seancesSemaine >= objSeances ? C.green : C.yellow}>
                <div className="text-xl leading-none" style={{ ...DISPLAY, ...NUMS, color: C.text }}>{seancesSemaine}</div>
                <div className="text-xs leading-none mt-0.5" style={{ color: C.dim }}>/ {objSeances}</div>
              </Ring>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold">Cette semaine</div>
                <div className="text-xs mt-0.5 font-semibold" style={{ color: seancesSemaine >= objSeances ? C.green : C.dim }}>
                  {seancesSemaine >= objSeances ? "Objectif atteint, bravo 💪" : `Plus que ${objSeances - seancesSemaine} séance${objSeances - seancesSemaine > 1 ? "s" : ""}`}
                </div>
                <div className="text-xs mt-1" style={{ color: "#6a6a73" }}>Tape pour changer l'objectif</div>
              </div>
            </Card>

            {/* Le cerveau : ta séance du jour */}
            {!current && (() => {
              const reco = seanceConseillee(data);
              const repos = reco.type === "repos";
              return (
                <Card style={{ border: `1px solid ${repos ? C.hair : "rgba(245,197,24,.3)"}`, background: repos ? undefined : "linear-gradient(165deg, rgba(245,197,24,.10), #fffdf7 62%)" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl" style={{ background: "radial-gradient(circle at 30% 25%, #f3f0e6, #e7e3d6)", border: `1px solid ${C.hair}` }}>
                      {repos ? "😴" : "🧠"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-extrabold tracking-widest uppercase" style={{ color: repos ? C.dim : C.yellowDim }}>
                        {repos ? "Aujourd'hui" : "Ta séance du jour"}
                      </div>
                      <div className="text-2xl leading-none mt-1" style={{ ...DISPLAY, color: C.text }}>{reco.titre.toUpperCase()}</div>
                      <div className="text-xs mt-1.5 leading-relaxed" style={{ color: C.dim }}>
                        {reco.urgence ? <b style={{ color: C.yellowDim }}>{reco.urgence} </b> : null}{reco.raison}
                      </div>
                    </div>
                  </div>
                  {!repos && (
                    <button
                      onClick={() => { setStartNom(reco.titre); setShowStart(true); }}
                      className="pl-tap w-full rounded-xl py-3 mt-3 font-bold text-sm"
                      style={{ background: C.card2, border: `1px solid ${C.yellow}`, color: C.yellowDim }}
                    >
                      Lancer « {reco.titre} »
                    </button>
                  )}
                </Card>
              );
            })()}

            {/* Silhouette musculaire */}
            <div>
              <SectionLabel>Ton corps · 7 derniers jours</SectionLabel>
              <Card className="mt-2">
                <SilhouetteMuscles
                  volumes={volumes}
                  cibles={data.ciblesMuscles || {}}
                  onPick={(m, v) => window.alert(`${m} : ${v} série${v > 1 ? "s" : ""} ces 7 derniers jours.${(data.ciblesMuscles || {})[m] ? `\nCible : ${data.ciblesMuscles[m]} séries.` : ""}`)}
                />
                <div className="text-xs mt-2 text-center" style={{ color: C.dim }}>Tape un muscle pour le détail · gris = à travailler</div>
              </Card>
            </div>

            {/* Mes programmes */}
            {(data.programmesPerso || []).length > 0 && (
              <div>
                <SectionLabel>Mes programmes</SectionLabel>
                <Card className="mt-2">
                  <div className="flex flex-col gap-2.5">
                    {data.programmesPerso.map((prog) => (
                      <div key={prog.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ background: "radial-gradient(circle at 30% 25%, #f3f0e6, #e7e3d6)", border: `1px solid ${C.hair}` }}>📋</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate">{prog.nom}</div>
                          <div className="text-xs" style={{ color: C.dim }}>{prog.exos.length} exercice{prog.exos.length > 1 ? "s" : ""}</div>
                        </div>
                        <button onClick={() => demarrerProgramme(prog)} disabled={!!current} className="pl-tap px-3 py-2 rounded-xl text-xs font-bold shrink-0" style={{ background: current ? C.card2 : C.yellow, color: current ? C.dim : "#111" }}>Démarrer</button>
                        <button onClick={() => supprimerProgrammePerso(prog.id)} aria-label="Supprimer le programme" className="pl-tap w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.card2, color: C.red }}><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {showStart && !current && (
              <Card>
                <div className="text-sm font-bold mb-2">C'est quoi comme séance ?</div>
                <div className="flex gap-2 flex-wrap mb-3">
                  {["Jambes", "Push", "Pull", "Bras", "Dos-Épaules"].map((n) => (
                    <Chip key={n} active={startNom === n} onClick={() => setStartNom(n)}>
                      {n}{n === "Jambes" && !jambesFaites ? " · 1ère !" : ""}
                    </Chip>
                  ))}
                </div>
                <input
                  value={startNom}
                  onChange={(e) => setStartNom(e.target.value)}
                  placeholder="Ou un autre nom…"
                  className="w-full rounded-xl px-3 py-3 mb-3 text-base"
                  style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => demarrer(startNom)}
                    disabled={!startNom.trim()}
                    className="flex-1 rounded-xl py-3 font-bold"
                    style={{ background: startNom.trim() ? C.yellow : C.card2, color: startNom.trim() ? "#111" : C.dim }}
                  >
                    C'est parti
                  </button>
                  <button onClick={() => setShowStart(false)} className="px-4 rounded-xl" style={{ background: C.card2, color: C.dim }}>
                    <X size={18} />
                  </button>
                </div>
              </Card>
            )}

            {/* Cycle d'entraînement */}
            {(() => {
              const cy = cycleDe(data);
              return (
                <Card style={cy.deload ? { border: `1px solid ${C.green}` } : undefined}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold">Cycle {cy.cycle} · semaine {cy.sem}/{CYCLE_SEMAINES}</div>
                    <button
                      onClick={() => { if (window.confirm("Repartir sur un nouveau cycle à partir d'aujourd'hui ?")) saveData({ ...data, cycleDebut: todayISO() }); }}
                      className="text-xs font-semibold"
                      style={{ color: C.dim }}
                    >
                      Nouveau cycle
                    </button>
                  </div>
                  <div className="flex gap-1.5 mb-2">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="flex-1 text-center">
                        <div
                          className="rounded-lg mb-1"
                          style={{
                            height: 30,
                            background: n === cy.sem ? (n === 4 ? C.green : C.yellow) : C.card2,
                            border: `1px solid ${n === cy.sem ? (n === 4 ? C.green : C.yellow) : C.line}`,
                          }}
                        />
                        <div className="text-xs" style={{ color: n === cy.sem ? C.text : C.dim }}>S{n}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm leading-relaxed" style={{ color: cy.deload ? C.green : C.dim }}>
                    {cy.deload
                      ? "Semaine allégée : charges à −10 % et 3 séries au lieu de 4. C'est là que le muscle se construit vraiment — ne saute pas cette semaine."
                      : "Montée en charge : tu pousses les charges dès que tu as de la marge. Semaine 4 sera allégée."}
                  </div>
                </Card>
              );
            })()}

            {/* Prochaine séance */}
            <Card>
              {data.prochaine ? (
                <div className="flex items-center gap-3">
                  <Calendar size={18} style={{ color: C.yellowDim }} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold">Prochaine séance : {data.prochaine.nom}</div>
                    <div className="text-xs" style={{ color: planifRelatif(data.prochaine.date).retard ? C.red : C.dim }}>
                      {fmtDate(data.prochaine.date)} · {planifRelatif(data.prochaine.date).txt}
                    </div>
                  </div>
                  <button
                    onClick={() => { setPlanifOpen(true); setPlanifNom(data.prochaine.nom); setPlanifDate(data.prochaine.date); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: C.card2, color: C.dim }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => saveData({ ...data, prochaine: null })}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: C.card2, color: C.red }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                !planifOpen && (
                  <button
                    onClick={() => setPlanifOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-1 text-sm font-semibold"
                    style={{ color: C.dim }}
                  >
                    <Calendar size={15} /> Planifier ma prochaine séance
                  </button>
                )
              )}
              {planifOpen && (
                <div className={data.prochaine ? "mt-3" : ""}>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {["Jambes", "Push", "Pull", "Bras", "Dos-Épaules"].map((n) => (
                      <Chip key={n} active={planifNom === n} onClick={() => setPlanifNom(n)}>{n}</Chip>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={planifDate}
                      min={todayISO()}
                      onChange={(e) => setPlanifDate(e.target.value)}
                      className="flex-1 rounded-xl px-3 py-3 text-sm"
                      style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text }}
                    />
                    <button
                      onClick={enregistrerPlanif}
                      disabled={!planifNom.trim() || !planifDate}
                      className="px-4 rounded-xl font-bold text-sm"
                      style={{
                        background: planifNom.trim() && planifDate ? C.yellow : C.card2,
                        color: planifNom.trim() && planifDate ? "#111" : C.dim,
                      }}
                    >
                      OK
                    </button>
                    <button onClick={() => setPlanifOpen(false)} className="px-3 rounded-xl" style={{ background: C.card2, color: C.dim }}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className="text-xs mt-2" style={{ color: C.dim }}>
                    Pas de notification possible dans l'app — mets-toi un rappel sur ton iPhone en plus.
                  </div>
                </div>
              )}
            </Card>

            {/* Stats rapides */}
            <div className="grid grid-cols-4 gap-2">
              <Card className="text-center" style={{ padding: "0.75rem 0.25rem" }}>
                <div className="text-xl" style={{ ...DISPLAY, ...NUMS, color: C.yellowDim }}>{data.seances.length}</div>
                <div className="text-xs mt-1" style={{ color: C.dim }}>séances</div>
              </Card>
              <Card className="text-center" style={{ padding: "0.75rem 0.25rem" }}>
                <div className="text-xl" style={{ ...DISPLAY, ...NUMS, color: C.yellowDim }}>
                  {data.seances.reduce((a, s) => a + s.exos.reduce((x, e) => x + (e.series || 0), 0), 0)}
                </div>
                <div className="text-xs mt-1" style={{ color: C.dim }}>séries</div>
              </Card>
              <Card className="text-center" style={{ padding: "0.75rem 0.25rem" }}>
                <div className="text-xl flex items-center justify-center gap-1" style={{ ...DISPLAY, ...NUMS, color: streak > 0 ? C.yellowDim : C.dim }}>
                  <Flame size={16} /> {streak}
                </div>
                <div className="text-xs mt-1" style={{ color: C.dim }}>sem. streak</div>
              </Card>
              <Card className="text-center" style={{ padding: "0.75rem 0.25rem" }}>
                <div className="text-xl" style={{ ...DISPLAY, ...NUMS, color: dernierPoids ? C.yellowDim : C.dim }}>
                  {dernierPoids ? fmtKg(dernierPoids.kg) : "—"}
                </div>
                <div className="text-xs mt-1" style={{ color: C.dim }}>kg / {OBJECTIF_POIDS}</div>
              </Card>
            </div>

            {(!dernierPoids || joursDepuis(dernierPoids.date) >= 7) && (
              <button onClick={() => setTab("recup")} className="w-full text-left text-xs px-1" style={{ color: C.dim }}>
                ⚖️ {dernierPoids ? `Dernière pesée il y a ${joursDepuis(dernierPoids.date)} j` : "Aucune pesée enregistrée"} — passe sur la balance →
              </button>
            )}

            {/* Level Up la salle */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-sm">Level Up · la salle</div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => saveData({ ...data, passagesOffset: (data.passagesOffset || 0) - 1 })}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: C.card2, color: C.dim }}
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    onClick={() => saveData({ ...data, passagesOffset: (data.passagesOffset || 0) + 1 })}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: C.card2, color: C.dim }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl" style={{ ...DISPLAY, ...NUMS, color: C.yellowDim }}>{passages}</div>
                <div className="text-xs" style={{ color: C.dim }}>passages en salle</div>
              </div>
              <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: C.card2 }}>
                <div
                  className="h-full rounded-full"
                  style={{ background: C.yellow, width: `${Math.min(100, (passages / palier.cible) * 100)}%`, transition: "width 0.4s" }}
                />
              </div>
              <div className="text-xs mt-2" style={{ color: C.dim }}>
                {passages >= palier.cible
                  ? `${palier.nom} atteint !`
                  : `Encore ${palier.cible - passages} passage${palier.cible - passages > 1 ? "s" : ""} pour ${palier.nom}`}
                {" · +1 auto à chaque séance terminée"}
              </div>
            </Card>

            {/* Dernières séances */}
            <Card>
              <div className="font-bold text-sm mb-2">Dernières séances</div>
              {[...data.seances].reverse().slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setTab("historique"); setExpandedId(s.id); }}
                  className="w-full flex items-center justify-between py-2 text-left"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <div>
                    <div className="text-sm font-semibold">{s.nom}</div>
                    <div className="text-xs" style={{ color: C.dim }}>
                      {fmtDate(s.date)} · {s.exos.length} exos
                    </div>
                  </div>
                  <ChevronDown size={16} style={{ color: C.dim, transform: "rotate(-90deg)" }} />
                </button>
              ))}
            </Card>

            {/* Mes données — replié par défaut, pas besoin d'y penser au quotidien */}
            <button
              onClick={() => setReglagesOuvert(!reglagesOuvert)}
              className="pl-tap w-full flex items-center justify-between px-1 py-2 text-xs font-semibold"
              style={{ color: C.dim }}
            >
              <span>⚙️ Mes données</span>
              {reglagesOuvert ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {reglagesOuvert && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-sm">Mes données</div>
                <button
                  onClick={() => saveData({ ...data, prefAutoCopie: data.prefAutoCopie === true ? false : true })}
                  className="px-2 py-1 rounded-lg text-xs font-bold"
                  style={{
                    background: data.prefAutoCopie === true ? C.yellow : C.card2,
                    color: data.prefAutoCopie === true ? "#111" : C.dim,
                    border: `1px solid ${data.prefAutoCopie === true ? C.yellow : C.line}`,
                  }}
                >
                  Copie auto {data.prefAutoCopie === true ? "ON" : "OFF"}
                </button>
              </div>

              {doublonsExistants.length > 0 && (
                <div className="rounded-xl p-3 mb-3" style={{ background: C.card, border: `1px solid ${C.yellowDim}` }}>
                  <div className="text-xs font-bold mb-2">Exos qui se ressemblent ({doublonsExistants.length})</div>
                  <div className="flex flex-col gap-2">
                    {doublonsExistants.map(({ a, b }) => (
                      <div key={a + "|" + b} className="flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0" style={{ color: C.dim }}>
                          <span style={{ color: C.text, fontWeight: 600 }}>{a}</span> ↔ {b}
                        </div>
                        <button
                          onClick={() => renommerExo(b, a)}
                          className="pl-tap px-2.5 py-1.5 rounded-lg font-bold shrink-0"
                          style={{ background: C.yellow, color: "#111" }}
                        >
                          Fusionner
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={copierContexte}
                className="w-full rounded-xl py-3 mb-2 font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: C.card2, border: `1px solid ${ctxCopie ? C.green : C.line}`, color: ctxCopie ? C.green : C.dim }}
              >
                <Copy size={14} /> {ctxCopie ? "Copié — colle-le dans Claude" : "Copier mon contexte pour Claude"}
              </button>
              <button
                onClick={reprendreSauvegarde}
                className="w-full rounded-xl py-3 mb-2 font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: C.card2, border: `1px solid ${C.yellow}`, color: C.yellowDim }}
              >
                <Upload size={14} /> Reprendre ma sauvegarde (presse-papier)
              </button>
              <div className="flex gap-2">
                <button
                  onClick={exporter}
                  className="flex-1 rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2"
                  style={{ background: C.card2, border: `1px solid ${copieOk ? C.green : C.line}`, color: copieOk ? C.green : C.text }}
                >
                  <Copy size={14} /> {copieOk ? "Copié !" : "Copier le JSON"}
                </button>
                <button
                  onClick={() => setImportOpen(!importOpen)}
                  className="flex-1 rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2"
                  style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text }}
                >
                  <Upload size={14} /> Importer
                </button>
              </div>
              {exportText && (
                <textarea
                  readOnly
                  value={exportText}
                  onFocus={(e) => e.target.select()}
                  className="w-full rounded-xl p-3 mt-2 text-xs"
                  rows={5}
                  style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text }}
                />
              )}
              {importOpen && (
                <div className="mt-2">
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Colle ici un JSON exporté depuis PLATEAU…"
                    className="w-full rounded-xl p-3 text-xs"
                    rows={5}
                    style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text }}
                  />
                  <button
                    onClick={importer}
                    disabled={!importText.trim()}
                    className="w-full rounded-xl py-3 mt-2 font-bold text-sm"
                    style={{ background: importText.trim() ? C.yellow : C.card2, color: importText.trim() ? "#111" : C.dim }}
                  >
                    Restaurer ces données
                  </button>
                </div>
              )}
              <div className="text-xs mt-2" style={{ color: C.dim }}>
                Sauvegarde de secours (les photos ne sont pas incluses).
              </div>
            </Card>
            )}
          </div>
        )}

        {/* ————— SÉANCE ————— */}
        {tab === "seance" && (
          <div className="space-y-3 pl-anim">
            {!current ? (
              <Card className="text-center py-8">
                <div className="text-sm mb-4" style={{ color: C.dim }}>Aucune séance en cours.</div>
                <button
                  onClick={() => { setTab("accueil"); setShowStart(true); }}
                  className="px-5 py-3 rounded-xl font-bold"
                  style={{ background: C.yellow, color: "#111" }}
                >
                  Démarrer une séance
                </button>
              </Card>
            ) : (
              <>
                {/* Bandeau séance */}
                <Card className="flex items-center justify-between">
                  <div>
                    <div className="text-xl leading-none" style={DISPLAY}>{current.nom.toUpperCase()}</div>
                    <div className="text-xs mt-1" style={{ ...NUMS, color: C.dim }}>
                      Durée : {elapsedTxt}
                      {(() => {
                        const cible = data.dureeCible || 90;
                        const reste = cible - Math.floor(elapsed / 60);
                        return reste > 0
                          ? ` · reste ~${reste} min sur ${cible}`
                          : ` · objectif ${cible} min atteint`;
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copierEtat}
                      className="w-9 h-9 rounded-xl flex items-center justify-center mr-1"
                      style={{ background: C.card2, color: C.yellowDim, border: `1px solid ${C.line}` }}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => saveCurrent({ ...current, gourdes: Math.max(0, current.gourdes - 1) })}
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: C.card2, color: C.dim }}
                    >
                      <Minus size={14} />
                    </button>
                    <div className="flex items-center gap-1 px-2">
                      <Droplets size={16} style={{ color: C.yellowDim }} />
                      <span className="text-lg font-bold" style={NUMS}>{current.gourdes}</span>
                    </div>
                    <button
                      onClick={() => saveCurrent({ ...current, gourdes: current.gourdes + 1 })}
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: C.yellow, color: "#111" }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </Card>

                {cycleDe(data).deload && (
                  <div className="rounded-xl px-3 py-2 text-sm leading-relaxed" style={{ background: "#0f1f14", border: `1px solid ${C.green}`, color: C.green }}>
                    Semaine allégée : charges proposées à −10 % et 3 séries. C'est voulu, ne force pas.
                  </div>
                )}

                {/* Plan · programme lancé */}
                {current.template && current.template.length > 0 && !ec && (
                  <Card>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">📋</span>
                      <div className="font-bold text-sm">Programme · {current.nom}</div>
                    </div>
                    {current.template.map((p, i) => {
                      const fait = current.exos.some((x) => x.nom.toLowerCase() === p.nom.toLowerCase());
                      return (
                        <button
                          key={i}
                          onClick={() => !fait && pickTemplateExo(p)}
                          className="w-full flex items-center gap-3 py-2 text-left"
                          style={{ borderBottom: `1px solid ${C.hair}`, opacity: fait ? 0.45 : 1 }}
                        >
                          <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: fait ? C.green : C.card2, border: `1px solid ${fait ? C.green : C.line}` }}>
                            {fait && <Check size={12} color="#111" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{p.nom}</div>
                            <div className="text-xs" style={{ ...NUMS, color: C.dim }}>{p.series}×{p.reps} @ {fmtKg(p.poids)} kg{p.parBras ? "/bras" : ""}</div>
                          </div>
                          {!fait && <div className="text-xs font-bold shrink-0" style={{ color: C.yellowDim }}>Préparer</div>}
                        </button>
                      );
                    })}
                  </Card>
                )}

                {/* Échauffement */}
                {current.exos.length === 0 && !ec && (
                  <Card>
                    <div className="font-bold text-sm mb-2">Échauffement · avant de charger</div>
                    {echauffementPourSeance(current.nom).map((item, i) => {
                      const done = (current.echecks || [])[i];
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            const next = [...(current.echecks || [])];
                            next[i] = !next[i];
                            saveCurrent({ ...current, echecks: next });
                          }}
                          className="w-full flex items-center gap-3 py-2 text-left"
                          style={{ borderBottom: `1px solid ${C.line}`, opacity: done ? 0.5 : 1 }}
                        >
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{ background: done ? C.green : C.card2, border: `1px solid ${done ? C.green : C.line}` }}
                          >
                            {done && <Check size={12} color="#111" />}
                          </div>
                          <div className="text-sm">{item}</div>
                        </button>
                      );
                    })}
                    <div className="text-xs mt-2" style={{ color: C.dim }}>
                      5-8 minutes qui protègent tes articulations — surtout un jour de première.
                    </div>
                  </Card>
                )}

                {/* Première séance de ce type : plan du coach */}
                {!planSeance && !ec && (
                  <Card>
                    {current.planIA ? (
                      <>
                        <div className="font-bold text-sm mb-2">Plan du coach · première séance {current.nom}</div>
                        {current.planIA.map((p) => {
                          const fait = current.exos.some((x) => x.nom.toLowerCase() === p.nom.toLowerCase());
                          return (
                            <button
                              key={p.id}
                              onClick={() => !fait && pickExoPlan(p)}
                              className="w-full flex items-center gap-3 py-2 text-left"
                              style={{ borderBottom: `1px solid ${C.line}`, opacity: fait ? 0.45 : 1 }}
                            >
                              <div
                                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                style={{ background: fait ? C.green : C.card2, border: `1px solid ${fait ? C.green : C.line}` }}
                              >
                                {fait && <Check size={12} color="#111" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold truncate">{p.nom}</div>
                                <div className="text-xs" style={{ ...NUMS, color: C.dim }}>
                                  {p.series}×{p.reps} @ {fmtKg(p.poids)} kg{p.parBras ? "/bras" : ""} · repos {fmtRepos(p.reposSec)}
                                </div>
                                {p.conseil && (
                                  <div className="text-xs mt-0.5 italic" style={{ color: C.dim }}>{p.conseil}</div>
                                )}
                              </div>
                              {!fait && <div className="text-xs font-bold shrink-0" style={{ color: C.yellowDim }}>Préparer</div>}
                            </button>
                          );
                        })}
                        <div className="text-xs mt-2" style={{ color: C.dim }}>
                          Charges de départ prudentes — ajuste au ressenti, c'est fait pour.
                        </div>
                      </>
                    ) : (() => {
                      const prog = programmePour(current.nom);
                      if (progVu && prog) {
                        return (
                          <>
                            <div className="font-bold text-sm mb-1">Programme type · {prog.label}</div>
                            <div className="text-xs mb-3" style={{ color: C.dim }}>
                              Charges légères de découverte — ajuste vite au ressenti, ce n'est qu'un point de départ.
                            </div>
                            {prog.exos.map((p, i) => {
                              const fait = current.exos.some((x) => x.nom.toLowerCase() === p.nom.toLowerCase());
                              return (
                                <button
                                  key={i}
                                  onClick={() => !fait && pickExoPlan(p)}
                                  className="w-full flex items-center gap-3 py-2 text-left"
                                  style={{ borderBottom: `1px solid ${C.line}`, opacity: fait ? 0.45 : 1 }}
                                >
                                  <div
                                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                    style={{ background: fait ? C.green : C.card2, border: `1px solid ${fait ? C.green : C.line}` }}
                                  >
                                    {fait && <Check size={12} color="#111" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold truncate">{p.nom}</div>
                                    <div className="text-xs" style={{ ...NUMS, color: C.dim }}>
                                      {p.series}×{p.reps} @ {fmtKg(p.poids)} kg{p.parBras ? "/bras" : ""}
                                    </div>
                                  </div>
                                  {!fait && <div className="text-sm font-bold shrink-0" style={{ color: C.yellowDim }}>Préparer</div>}
                                </button>
                              );
                            })}
                            <button onClick={() => setProgVu(false)} className="text-xs font-semibold mt-2" style={{ color: C.dim }}>
                              ← autres options
                            </button>
                          </>
                        );
                      }
                      return (
                        <>
                          <div className="font-bold text-sm mb-1">Première séance {current.nom} !</div>
                          <div className="text-xs mb-3" style={{ color: C.dim }}>
                            Aucun historique pour ce type de séance.
                          </div>
                          <div className="flex gap-2">
                            {prog && (
                              <button
                                onClick={() => setProgVu(true)}
                                className="pl-tap flex-1 rounded-2xl py-3.5 font-bold"
                                style={{ background: C.yellow, color: "#111" }}
                              >
                                Programme type
                              </button>
                            )}
                            <button
                              onClick={copierContexte}
                              className="flex-1 rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2"
                              style={{ background: C.card2, border: `1px solid ${C.line}`, color: ctxCopie ? C.green : C.text }}
                            >
                              <Copy size={14} /> {ctxCopie ? "Copié !" : "Demander à Claude"}
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </Card>
                )}

                {/* Plan de séance */}
                {planSeance && !ec && (
                  <Card>
                    <button className="w-full flex items-center justify-between" onClick={() => setPlanOuvert(!planOuvert)}>
                      <div className="font-bold text-sm">Plan · d'après ta dernière séance {current.nom}</div>
                      {planOuvert ? <ChevronUp size={16} style={{ color: C.dim }} /> : <ChevronDown size={16} style={{ color: C.dim }} />}
                    </button>
                    {planOuvert && (
                      <div className="mt-2">
                        {planSeance.map((p, idx) => {
                          const fait = current.exos.some((x) => x.nom.toLowerCase() === p.nom.toLowerCase());
                          const s2 = suggestionFor(p.nom);
                          return (
                            <div
                              key={p.id}
                              className="w-full flex items-center gap-2 py-2 text-left"
                              style={{ borderBottom: `1px solid ${C.line}`, opacity: fait ? 0.45 : 1 }}
                            >
                              <div className="flex flex-col shrink-0">
                                <button onClick={() => deplacerPlan(idx, -1)} className="px-1" style={{ color: idx === 0 ? C.line : C.dim }}>
                                  <ChevronUp size={15} />
                                </button>
                                <button onClick={() => deplacerPlan(idx, 1)} className="px-1" style={{ color: idx === planSeance.length - 1 ? C.line : C.dim }}>
                                  <ChevronDown size={15} />
                                </button>
                              </div>
                              <button
                                onClick={() => !fait && pickExo(p.nom)}
                                className="flex-1 flex items-center gap-3 text-left min-w-0"
                              >
                              <div
                                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                style={{ background: fait ? C.green : C.card2, border: `1px solid ${fait ? C.green : C.line}` }}
                              >
                                {fait && <Check size={12} color="#111" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold truncate">{p.nom}</div>
                                {s2 && !fait && (
                                  <div className="text-xs" style={{ ...NUMS, color: s2.monte ? C.yellowDim : C.dim }}>
                                    {s2.monte
                                      ? `vise ${fmtKg(s2.cible)} kg (dernière fois ${fmtKg(s2.last.poids)}, marge)`
                                      : `reste à ${fmtKg(s2.cible)} kg${s2.last.ressenti === "tirait" ? " (ça tirait)" : ""}`}
                                  </div>
                                )}
                              </div>
                                {!fait && <div className="text-sm font-bold shrink-0" style={{ color: C.yellowDim }}>Préparer</div>}
                              </button>
                            </div>
                          );
                        })}
                        <div className="text-xs mt-2" style={{ color: C.dim }}>
                          Les flèches réordonnent le plan — l'ordre est retenu pour tes prochaines séances {current.nom}.
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Exo en cours (mode série par série) */}
                {ec && (
                  <Card style={{ border: `1px solid ${C.yellow}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-base">{ec.nom}</div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setFocusOuvert(true)} className="text-xs font-bold" style={{ color: C.yellowDim }}>
                          Plein écran
                        </button>
                        <button onClick={() => abandonnerExo(false)} className="text-xs font-semibold" style={{ color: C.red }}>
                          Abandonner
                        </button>
                      </div>
                    </div>
                    <div className="text-sm mb-3" style={{ color: C.dim }}>
                      Série {ec.sets.length}{ec.prevu ? `/${ec.prevu}` : ""} faite · repos {fmtRepos(ec.reposSec)}
                      {ec.parBras ? " · par bras" : ""}
                    </div>

                    {ec.sets.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 py-1.5" style={{ borderBottom: `1px solid ${C.line}` }}>
                        <div className="text-xs w-5 shrink-0" style={{ color: C.dim, ...NUMS }}>{i + 1}.</div>
                        <div className="text-sm flex-1 font-semibold" style={NUMS}>
                          {fmtKg(s.poids)} kg × {s.reps}
                        </div>
                        <button
                          onClick={() => supprimerSerie(i)}
                          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: C.card2, color: C.red }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}

                    <div className="text-xs mb-1.5 mt-3 font-semibold" style={{ color: C.dim }}>Poids série suivante (kg)</div>
                    <PoidsInput value={ecPoids} onChange={setEcPoids} />
                    <div className="flex gap-3 mt-3 mb-3">
                      <Stepper label="Reps" value={ecReps} onChange={setEcReps} max={50} />
                    </div>

                    <div className="text-xs mb-1" style={{ color: C.dim }}>Ressenti global de l'exo</div>
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setRessentiEc("marge")}
                        className="pl-tap flex-1 rounded-2xl py-3.5 font-bold"
                        style={{
                          background: ec.ressenti === "marge" ? C.green : C.card2,
                          color: ec.ressenti === "marge" ? "#111" : C.text,
                          border: `1px solid ${ec.ressenti === "marge" ? C.green : C.line}`,
                        }}
                      >
                        De la marge
                      </button>
                      <button
                        onClick={() => setRessentiEc("tirait")}
                        className="pl-tap flex-1 rounded-2xl py-3.5 font-bold"
                        style={{
                          background: ec.ressenti === "tirait" ? C.red : C.card2,
                          color: ec.ressenti === "tirait" ? "#111" : C.text,
                          border: `1px solid ${ec.ressenti === "tirait" ? C.red : C.line}`,
                        }}
                      >
                        Ça tirait
                      </button>
                    </div>

                    <button
                      onClick={validerSerie}
                      className="w-full rounded-xl py-4 font-black flex items-center justify-center gap-2"
                      style={{ background: C.yellow, color: "#111" }}
                    >
                      <Check size={18} /> Série {ec.sets.length + 1} faite → chrono
                    </button>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={finirSerieEtExo}
                        className="pl-tap flex-1 rounded-2xl py-3.5 font-bold"
                        style={{ background: C.text, color: C.card }}
                      >
                        Dernière série → fin de l'exo
                      </button>
                      <button
                        onClick={finirExo}
                        className="px-3 rounded-xl font-semibold text-xs"
                        style={{ background: C.card2, color: C.dim, border: `1px solid ${C.line}` }}
                      >
                        Finir sans<br />ajouter
                      </button>
                    </div>
                    <div className="text-xs mt-2 text-center" style={{ color: C.dim }}>
                      {ec.sets.length} série{ec.sets.length > 1 ? "s" : ""} enregistrée{ec.sets.length > 1 ? "s" : ""} — la série en cours n'est comptée que si tu la valides.
                    </div>
                  </Card>
                )}

                {/* Saisie exo */}
                {!ec && (
                  <Card style={editExoId ? { border: `1px solid ${C.yellow}` } : undefined}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-sm">{editExoId ? "Modifier l'exercice" : "Nouvel exercice"}</div>
                      {editExoId ? (
                        <button onClick={resetForm} className="text-xs font-semibold" style={{ color: C.dim }}>
                          Annuler la modif
                        </button>
                      ) : (
                        <button
                          onClick={() => saveData({ ...data, prefSerieParSerie: !serieMode })}
                          className="px-2 py-1 rounded-lg text-xs font-bold"
                          style={{
                            background: serieMode ? C.yellow : C.card2,
                            color: serieMode ? "#111" : C.dim,
                            border: `1px solid ${serieMode ? C.yellow : C.line}`,
                          }}
                        >
                          Série par série {serieMode ? "ON" : "OFF"}
                        </button>
                      )}
                    </div>
                    <input
                      value={fNom}
                      onChange={(e) => setFNom(e.target.value)}
                      placeholder="Nom de l'exercice…"
                      className="w-full rounded-2xl px-4 mb-2 font-semibold"
                      style={{ background: C.card2, border: `1px solid ${C.hair}`, color: C.text, height: 56, fontSize: 17 }}
                    />
                    {!editExoId && (
                      <div className="flex gap-2 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: "none" }}>
                        {suggestionsNoms.map((n) => (
                          <Chip key={n} active={fNom === n} onClick={() => pickExo(n)}>{n}</Chip>
                        ))}
                      </div>
                    )}

                    {/* Identifier la machine : photo perso + vidéo, tout de suite, sans repasser par Internet */}
                    {fNom.trim() && !isCardio && !editExoId && (
                      <div className="rounded-xl p-2.5 mb-3 flex items-center gap-3" style={{ background: C.card2, border: `1px solid ${C.hair}` }}>
                        {rappelPhotoId ? (
                          <PhotoThumb photoId={rappelPhotoId} onView={setPhotoView} size={56} />
                        ) : (
                          <button
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            className="rounded-lg flex flex-col items-center justify-center shrink-0 gap-0.5"
                            style={{ width: 56, height: 56, background: C.card, border: `1px dashed ${C.line}`, color: C.dim }}
                          >
                            <Camera size={16} />
                            <span style={{ fontSize: 9 }}>ajouter</span>
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate">{rappelPhotoId ? "Ta machine" : "Pas encore de photo"}</div>
                          <div className="text-xs" style={{ color: C.dim }}>{rappelPhotoId ? "Tape pour l'agrandir" : "Prends-la en photo une fois"}</div>
                        </div>
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(fNom.trim() + " technique musculation")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="pl-tap px-3 py-2.5 rounded-lg text-xs font-bold text-center shrink-0"
                          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.yellowDim }}
                        >
                          🎥 Vidéo
                        </a>
                      </div>
                    )}

                    {sugg && !isCardio && (
                      <div
                        className="rounded-xl px-3 py-2 mb-3 text-xs leading-relaxed"
                        style={{ background: C.card2, border: `1px solid ${sugg.monte ? C.yellow : C.line}`, ...NUMS }}
                      >
                        Dernière fois : <b>{fmtKg(sugg.last.poids)} kg{sugg.last.parBras ? "/bras" : ""}</b>
                        {sugg.last.ressenti === "marge" ? " avec de la marge" : sugg.last.ressenti === "tirait" ? ", ça tirait" : ""}
                        {" → "}
                        <b style={{ color: sugg.monte ? C.yellowDim : C.text }}>
                          {sugg.monte ? `objectif ${fmtKg(sugg.cible)} kg` : `reste à ${fmtKg(sugg.cible)} kg`}
                        </b>
                        {sugg.last.pr ? " (record en cours)" : ""}
                      </div>
                    )}

                    {doublonProbable && (
                      <div className="rounded-xl px-3 py-2 mb-3 text-sm leading-relaxed" style={{ background: C.card2, border: `1px solid ${C.yellowDim}` }}>
                        Ressemble à <b>{doublonProbable.nom}</b> que tu fais déjà.{" "}
                        <button onClick={() => pickExo(doublonProbable.nom)} className="font-bold underline" style={{ color: C.yellowDim }}>
                          C'est le même
                        </button>
                        <span style={{ color: C.dim }}> — sinon continue, ce sera un nouvel exercice.</span>
                      </div>
                    )}

                    {sugg && !isCardio && histoOf(fNom.trim()).length > 1 && (
                      <div className="text-xs mb-3" style={{ ...NUMS, color: C.dim }}>
                        Historique : {histoOf(fNom.trim()).map((h) => `${fmtShort(h.date)} ${fmtKg(h.poids)} kg`).join(" · ")}
                      </div>
                    )}

                    {stag && !isCardio && (
                      <div className="rounded-xl px-3 py-2 mb-3 text-xs leading-relaxed" style={{ background: "#251418", border: `1px solid ${C.red}` }}>
                        <span style={{ color: C.red }}>Plateau détecté : 3 séances bloquées à {fmtKg(stag.poids)} kg.</span>{" "}
                        <span style={{ color: C.dim }}>Copie ton contexte depuis l'accueil et demande une stratégie à Claude.</span>
                      </div>
                    )}

                    {fNom.trim() && !isCardio && repereFor(fNom, poidsCorps) && (() => {
                      const rp = repereFor(fNom, poidsCorps);
                      const brut = parseFloat(String(fPoids).replace(",", "."));
                      const charge = isNaN(brut) ? 0 : (fParBras ? brut * 2 : brut);
                      const niv = niveauPour(charge, rp.paliers);
                      const pct = Math.max(3, Math.min(100, (charge / rp.paliers[3]) * 100));
                      const manque = niv.seuil === -1 ? Math.round((rp.paliers[0] - charge) * 2) / 2 : null;
                      const prochain = niv.seuil >= 0 && niv.seuil < 3 ? rp.paliers[niv.seuil + 1] : null;
                      return (
                        <div className="rounded-xl px-3 py-2 mb-3" style={{ background: C.card2, border: `1px solid ${C.line}` }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">Repère · {fmtKg(poidsCorps)} kg de corps</span>
                            <span className="text-xs font-black" style={{ color: niv.color }}>{niv.label}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: C.bg }}>
                            <div style={{ width: `${pct}%`, background: niv.color, height: "100%", transition: "width .3s" }} />
                          </div>
                          <div className="flex justify-between text-xs mt-1" style={{ color: C.dim, ...NUMS }}>
                            <span>déb {fmtKg(rp.paliers[0])}</span>
                            <span>nov {fmtKg(rp.paliers[1])}</span>
                            <span>int {fmtKg(rp.paliers[2])}</span>
                            <span>av {fmtKg(rp.paliers[3])}</span>
                          </div>
                          {charge > 0 && manque != null && (
                            <div className="text-xs mt-1 font-semibold" style={{ color: niv.color }}>
                              Encore {fmtKg(manque)} kg pour le repère débutant — ça viendra.
                            </div>
                          )}
                          {charge > 0 && prochain != null && (
                            <div className="text-xs mt-1" style={{ color: C.dim, ...NUMS }}>
                              Prochain palier à {fmtKg(prochain)} kg{fParBras ? " au total (2 bras)" : ""}.
                            </div>
                          )}
                          <div className="text-xs mt-1" style={{ color: C.dim }}>
                            {rp.machine
                              ? "Indicatif : les charges machine varient beaucoup d'une marque à l'autre."
                              : "Repère standard pour un homme de adulte, charge totale."}
                          </div>
                        </div>
                      );
                    })()}

                    {fNom.trim() && !isCardio && (
                      <div className="mb-3">
                        <button
                          onClick={() => setSchemaOuvert(!schemaOuvert)}
                          className="w-full flex items-center justify-between rounded-xl px-3 py-2"
                          style={{ background: C.card2, border: `1px solid ${C.line}` }}
                        >
                          <span className="text-xs font-bold">Schéma & technique</span>
                          {schemaOuvert ? <ChevronUp size={14} style={{ color: C.dim }} /> : <ChevronDown size={14} style={{ color: C.dim }} />}
                        </button>
                        {schemaOuvert && (
                          <div className="rounded-xl mt-2 p-3" style={{ background: C.card2, border: `1px solid ${C.line}` }}>
                            <SchemaMouvement nom={fNom} />
                            <div className="text-xs mt-1 mb-2 text-center" style={{ color: C.dim }}>
                              trait plein = départ · pointillés = arrivée
                            </div>
                            {(TECHNIQUE[mouvementOf(fNom)] || TECHNIQUE.generique).map((t, i) => (
                              <div key={i} className="text-xs leading-relaxed" style={{ color: C.text }}>
                                <span style={{ color: C.yellowDim }}>·</span> {t}
                              </div>
                            ))}
                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(fNom.trim() + " technique musculation")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-xs font-bold mt-3"
                              style={{ color: C.yellowDim }}
                            >
                              Voir une démo vidéo →
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {!editExoId && !isCardio && fNom.trim() && !isNaN(parseFloat(String(fPoids).replace(",", "."))) && (
                      <div className="text-xs mb-3" style={{ color: C.dim }}>
                        Échauffement conseillé : {echauffementPour(parseFloat(String(fPoids).replace(",", ".")))} — pas compté dans tes séries.
                      </div>
                    )}

                    {!editExoId && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={onPhotoPicked}
                          style={{ display: "none" }}
                        />
                        <div className="flex items-center gap-3 mb-3">
                          <button
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold"
                            style={{
                              background: C.card2,
                              border: `1px solid ${fPhotoPreview ? C.yellow : C.line}`,
                              color: fPhotoPreview ? C.yellowDim : C.text,
                            }}
                          >
                            <Camera size={16} /> {photoBusy ? "Traitement…" : fPhotoPreview ? "Reprendre" : "Photo machine"}
                          </button>
                          {fPhotoPreview && (
                            <div className="relative">
                              <img
                                src={fPhotoPreview}
                                alt="Machine"
                                onClick={() => setPhotoView(fPhotoPreview)}
                                className="rounded-lg object-cover"
                                style={{ width: 46, height: 46, border: `1px solid ${C.yellow}` }}
                              />
                              <button
                                onClick={retirerPhotoForm}
                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ background: C.red, color: "#fff" }}
                              >
                                <X size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="flex gap-2 mb-3">
                      <Chip active={!isCardio} onClick={() => setFTypeManuel("muscu")}>Muscu</Chip>
                      <Chip active={isCardio} onClick={() => setFTypeManuel("cardio")}>Cardio</Chip>
                    </div>

                    {isCardio ? (
                      <>
                        <div className="flex gap-3 mb-3">
                          <Stepper label="Durée (min)" value={fDuree} onChange={setFDuree} min={1} max={180} />
                          <div className="flex-1">
                            <div className="text-xs mb-1" style={{ color: C.dim }}>Distance (km)</div>
                            <input
                              value={fDistance}
                              onChange={(e) => setFDistance(e.target.value)}
                              inputMode="decimal"
                              placeholder="—"
                              className="w-full rounded-xl px-3 py-3 text-lg font-bold"
                              style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text, ...NUMS }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs mb-1" style={{ color: C.dim }}>Niveau</div>
                            <input
                              value={fNiveau}
                              onChange={(e) => setFNiveau(e.target.value)}
                              placeholder="—"
                              className="w-full rounded-xl px-3 py-3 text-lg font-bold"
                              style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text, ...NUMS }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mb-3">
                          {[5, 10, 15, 20, 30].map((m) => (
                            <Chip key={m} active={fDuree === m} onClick={() => setFDuree(m)}>{m} min</Chip>
                          ))}
                        </div>
                        <div className="text-xs mb-1" style={{ color: C.dim }}>Ressenti</div>
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() => setFRessenti(fRessenti === "marge" ? null : "marge")}
                            className="pl-tap flex-1 rounded-2xl py-3.5 font-bold"
                            style={{
                              background: fRessenti === "marge" ? C.green : C.card2,
                              color: fRessenti === "marge" ? "#111" : C.text,
                              border: `1px solid ${fRessenti === "marge" ? C.green : C.line}`,
                            }}
                          >
                            Facile
                          </button>
                          <button
                            onClick={() => setFRessenti(fRessenti === "tirait" ? null : "tirait")}
                            className="pl-tap flex-1 rounded-2xl py-3.5 font-bold"
                            style={{
                              background: fRessenti === "tirait" ? C.red : C.card2,
                              color: fRessenti === "tirait" ? "#111" : C.text,
                              border: `1px solid ${fRessenti === "tirait" ? C.red : C.line}`,
                            }}
                          >
                            Ça piquait
                          </button>
                        </div>
                        <button
                          onClick={validerExo}
                          disabled={!fNom.trim()}
                          className="w-full rounded-xl py-4 text-lg font-black flex items-center justify-center gap-2"
                          style={{ background: fNom.trim() ? C.yellow : C.card2, color: fNom.trim() ? "#111" : C.dim }}
                        >
                          <Check size={20} /> {editExoId ? "Enregistrer la modif" : "Valider le cardio"}
                        </button>
                      </>
                    ) : (
                      <>
                    {/* Poids : sa propre ligne, en grand */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-xs font-semibold" style={{ color: C.dim }}>Poids (kg)</div>
                      <button
                        onClick={() => setFParBras(!fParBras)}
                        className="pl-tap px-3 py-1.5 rounded-lg text-xs font-bold"
                        style={{
                          background: fParBras ? C.yellow : C.card2,
                          color: fParBras ? "#111" : C.dim,
                          border: `1px solid ${fParBras ? C.yellow : C.hair}`,
                        }}
                      >
                        /bras
                      </button>
                    </div>
                    <div className="mb-3">
                      <PoidsInput value={fPoids} onChange={setFPoids} />
                    </div>

                    {/* Séries + Reps : ligne dédiée */}
                    <div className="flex gap-3 mb-3">
                      <Stepper label="Séries" value={fSeries} onChange={setFSeries} />
                      <Stepper label="Reps" value={fReps} onChange={setFReps} max={50} />
                    </div>

                    {fNom.trim().toLowerCase().includes("barre") && String(fPoids).trim() && !isNaN(parseFloat(String(fPoids).replace(",", "."))) && (
                      <div className="mb-3">
                        <button
                          onClick={() => setPlaquesOuvert(!plaquesOuvert)}
                          className="text-xs font-bold flex items-center gap-1"
                          style={{ color: C.yellowDim }}
                        >
                          🧮 Calcul des plaques {plaquesOuvert ? "▴" : "▾"}
                        </button>
                        {plaquesOuvert && (() => {
                          const cible = parseFloat(String(fPoids).replace(",", "."));
                          const r = calculPlaques(cible, barreKg);
                          return (
                            <div className="rounded-xl mt-2 p-3" style={{ background: C.card2, border: `1px solid ${C.line}` }}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs" style={{ color: C.dim }}>Barre :</span>
                                {[15, 20].map((b) => (
                                  <Chip key={b} active={barreKg === b} onClick={() => setBarreKg(b)}>{b} kg</Chip>
                                ))}
                              </div>
                              {r.parCote.length === 0 ? (
                                <div className="text-sm" style={{ color: C.dim }}>Juste la barre ({barreKg} kg) suffit.</div>
                              ) : (
                                <>
                                  <div className="text-sm font-bold mb-1">Par côté : {r.parCote.map((p) => fmtKg(p)).join(" + ")} kg</div>
                                  <div className="text-xs" style={{ color: C.dim, ...NUMS }}>
                                    Total réel : {fmtKg(r.atteint)} kg
                                    {r.reste > 0 && ` (visé ${fmtKg(cible)} kg, écart ${fmtKg(r.reste * 2)} kg — pas de plaque assez fine)`}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="text-xs mb-1" style={{ color: C.dim }}>Repos entre séries</div>
                    <div className="flex gap-2 mb-3">
                      {[60, 90, 120, 150].map((s) => (
                        <Chip key={s} active={fRepos === s} onClick={() => setFRepos(s)}>{fmtRepos(s)}</Chip>
                      ))}
                    </div>

                    {(!serieMode || editExoId) && (
                      <>
                        <div className="text-xs mb-1" style={{ color: C.dim }}>Ressenti</div>
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() => setFRessenti(fRessenti === "marge" ? null : "marge")}
                            className="pl-tap flex-1 rounded-2xl py-3.5 font-bold"
                            style={{
                              background: fRessenti === "marge" ? C.green : C.card2,
                              color: fRessenti === "marge" ? "#111" : C.text,
                              border: `1px solid ${fRessenti === "marge" ? C.green : C.line}`,
                            }}
                          >
                            De la marge
                          </button>
                          <button
                            onClick={() => setFRessenti(fRessenti === "tirait" ? null : "tirait")}
                            className="pl-tap flex-1 rounded-2xl py-3.5 font-bold"
                            style={{
                              background: fRessenti === "tirait" ? C.red : C.card2,
                              color: fRessenti === "tirait" ? "#111" : C.text,
                              border: `1px solid ${fRessenti === "tirait" ? C.red : C.line}`,
                            }}
                          >
                            Ça tirait
                          </button>
                        </div>

                        <div className="text-xs mb-1" style={{ color: C.dim }}>RPE (optionnel) — effort ressenti sur 10</div>
                        <div className="flex gap-1 mb-4">
                          {[6, 7, 8, 9, 10].map((r) => (
                            <button
                              key={r}
                              onClick={() => setFRpe(fRpe === r ? null : r)}
                              className="flex-1 rounded-lg py-2 text-sm font-bold"
                              style={{
                                background: fRpe === r ? C.yellow : C.card2,
                                color: fRpe === r ? "#111" : C.dim,
                                border: `1px solid ${fRpe === r ? C.yellow : C.line}`,
                              }}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    <button
                      onClick={validerExo}
                      disabled={!fNom.trim() || !String(fPoids).trim()}
                      className="w-full rounded-xl py-4 text-lg font-black flex items-center justify-center gap-2"
                      style={{
                        background: fNom.trim() && String(fPoids).trim() ? C.yellow : C.card2,
                        color: fNom.trim() && String(fPoids).trim() ? "#111" : C.dim,
                      }}
                    >
                      <Check size={20} />
                      {editExoId ? "Enregistrer la modif" : serieMode ? "Série 1 faite → chrono" : "Valider + chrono"}
                    </button>
                      </>
                    )}
                  </Card>
                )}

                {/* Exos validés */}
                {current.exos.length > 0 && (
                  <Card>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-sm">Validé aujourd'hui ({current.exos.length})</div>
                      <div className="text-xs font-bold" style={{ ...NUMS, color: seriesJour >= 24 ? C.red : seriesJour >= 18 ? "#b45309" : C.dim }}>
                        {seriesJour} séries
                      </div>
                    </div>
                    {seriesJour >= 18 && (
                      <div className="text-xs mb-2 leading-relaxed" style={{ color: seriesJour >= 24 ? C.red : "#b45309" }}>
                        {seriesJour >= 24
                          ? "Volume très élevé pour une séance — au-delà, tu accumules surtout de la fatigue."
                          : "Volume déjà solide — 16 à 20 séries par séance suffisent pour progresser."}
                      </div>
                    )}
                    {[...current.exos].reverse().map((e) => (
                      <div key={e.id} className="py-2 flex gap-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold">
                            <Dot ressenti={e.ressenti} />{e.nom}{e.pr && <PrBadge />}
                          </div>
                          <div className="text-xs mt-0.5" style={{ ...NUMS, color: C.dim }}>
                            {e.type === "cardio"
                              ? `${e.dureeCardio} min${e.distance ? ` · ${fmtKg(e.distance)} km` : ""}${e.niveau ? ` · niveau ${e.niveau}` : ""}`
                              : `${e.series}×${e.reps} @ ${fmtKg(e.poids)} kg${e.parBras ? "/bras" : ""} · repos ${fmtRepos(e.reposSec)}${e.dureeMin ? ` · ${e.dureeMin} min` : ""}${e.rpe ? ` · RPE ${e.rpe}` : ""}`}
                          </div>
                          {e.type !== "cardio" && (() => {
                            const d = deltaExo(e.nom, e.poids);
                            if (!d) return <div className="text-xs mt-0.5" style={{ color: C.dim }}>première fois sur cet exo</div>;
                            return (
                              <div className="text-xs mt-0.5 font-bold" style={{ ...NUMS, color: d.delta > 0 ? C.green : d.delta < 0 ? C.red : C.dim }}>
                                {d.delta > 0 ? `+${fmtKg(d.delta)} kg` : d.delta < 0 ? `${fmtKg(d.delta)} kg` : "même charge"}
                                <span style={{ color: C.dim, fontWeight: 400 }}> vs {fmtKg(d.avant)} kg le {fmtShort(d.date)}</span>
                              </div>
                            );
                          })()}
                          {e.note && <div className="text-xs mt-0.5" style={{ ...NUMS, color: C.dim }}>{e.note}</div>}
                          {coachBusyId === e.id && (
                            <div className="text-xs mt-1 italic" style={{ color: C.dim }}>Le coach réfléchit…</div>
                          )}
                          {e.coach && (
                            <div className="text-xs mt-1 leading-relaxed" style={{ color: C.yellowDim }}>{e.coach}</div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <PhotoThumb photoId={e.photoId} onView={setPhotoView} />
                          <div className="flex gap-1">
                            <button
                              onClick={() => editerExo(e)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ background: C.card2, color: C.dim }}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => supprimerExoCourant(e.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ background: C.card2, color: C.red }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Card>
                )}

                <Card>
                  <div className="text-xs mb-1 font-bold">Note de séance</div>
                  <textarea
                    value={current.note || ""}
                    onChange={(e) => setCurrent({ ...current, note: e.target.value })}
                    onBlur={() => saveCurrent(current)}
                    placeholder="Douleurs, forme du jour, remarques… le coach en tiendra compte."
                    rows={2}
                    className="w-full rounded-xl p-3 text-sm"
                    style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text }}
                  />
                </Card>

                {finOuvert && (
                  <Card style={{ border: `1px solid ${C.yellow}` }}>
                    <div className="text-sm font-bold mb-1">Combien de gourdes bues ?</div>
                    <div className="text-xs mb-3" style={{ color: C.dim }}>
                      Tu oublies souvent de les compter pendant l'effort — c'est le moment.
                    </div>
                    <div className="flex gap-2 flex-wrap mb-3">
                      {[0, 1, 2, 3, 4, 5].map((g) => (
                        <Chip key={g} active={current.gourdes === g} onClick={() => saveCurrent({ ...current, gourdes: g })}>
                          {g}
                        </Chip>
                      ))}
                    </div>
                    <button
                      onClick={() => { setFinOuvert(false); terminer(); }}
                      className="w-full rounded-xl py-4 font-black"
                      style={{ background: C.yellow, color: "#111" }}
                    >
                      Terminer la séance
                    </button>
                    <button
                      onClick={() => setFinOuvert(false)}
                      className="w-full rounded-xl py-3 mt-2 font-semibold text-sm"
                      style={{ background: C.card2, color: C.dim }}
                    >
                      Continuer la séance
                    </button>
                  </Card>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setFinOuvert(true)}
                    className="flex-1 rounded-xl py-4 font-black"
                    style={{ background: C.text, color: C.card }}
                  >
                    Terminer la séance
                  </button>
                  <button onClick={annuler} className="px-4 rounded-xl" style={{ background: C.card2, color: C.red }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ————— RÉCUP ————— */}
        {tab === "recup" && (
          <div className="space-y-3 pl-anim">

            {/* Sommeil — la seule saisie quotidienne */}
            <Card>
              <div className="text-sm mb-2 flex items-center gap-2 font-bold">
                <Moon size={16} style={{ color: C.yellowDim }} /> Sommeil cette nuit
              </div>
              <div className="flex items-center rounded-2xl overflow-hidden" style={{ background: C.card2, border: `1px solid ${C.line}` }}>
                <button className="px-6 py-5" onClick={() => setJour({ sommeil: Math.max(0, (jourDuJour.sommeil ?? 7.5) - 0.5) })} style={{ color: C.text }}>
                  <Minus size={20} />
                </button>
                <div className="flex-1 text-center text-3xl font-black" style={{ ...NUMS, color: jourDuJour.sommeil != null ? C.text : C.dim }}>
                  {jourDuJour.sommeil != null ? `${fmtKg(jourDuJour.sommeil)} h` : "—"}
                </div>
                <button className="px-6 py-5" onClick={() => setJour({ sommeil: Math.min(14, (jourDuJour.sommeil ?? 6.5) + 0.5) })} style={{ color: C.text }}>
                  <Plus size={20} />
                </button>
              </div>
              {sommeilMoyen != null && (
                <div className="text-sm mt-2" style={{ color: sommeilMoyen < 6.5 ? C.red : C.dim, ...NUMS }}>
                  Moyenne sur 7 jours : {fmtKg(sommeilMoyen)} h
                </div>
              )}
            </Card>

            {/* Routine du jour */}
            <Card>
              <div className="text-sm font-bold mb-3">Ma routine du jour</div>

              {/* Eau */}
              <div className="text-sm mb-1 flex items-center gap-2" style={{ color: C.dim }}>
                <Droplets size={15} style={{ color: C.yellowDim }} /> Eau bue
              </div>
              <div className="flex items-center rounded-2xl overflow-hidden mb-4" style={{ background: C.card2, border: `1px solid ${C.line}` }}>
                <button className="px-6 py-4" onClick={() => setJour({ eau: Math.max(0, Math.round(((jourDuJour.eau || 0) - 0.25) * 100) / 100) })} style={{ color: C.text }}>
                  <Minus size={18} />
                </button>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-black" style={{ ...NUMS, color: jourDuJour.eau ? C.text : C.dim }}>
                    {jourDuJour.eau ? `${fmtKg(jourDuJour.eau)} L` : "—"}
                  </div>
                  {jourDuJour.eau > 0 && (
                    <div className="text-xs" style={{ color: jourDuJour.eau >= 2 ? C.green : C.dim }}>
                      {jourDuJour.eau >= 2 ? "objectif 2 L atteint" : `reste ${fmtKg(2 - jourDuJour.eau)} L`}
                    </div>
                  )}
                </div>
                <button className="px-6 py-4" onClick={() => setJour({ eau: Math.round(((jourDuJour.eau || 0) + 0.25) * 100) / 100 })} style={{ color: C.text }}>
                  <Plus size={18} />
                </button>
              </div>

              {/* Cases à cocher */}
              {[
                { k: "douche", label: "Douche", Ic: ShowerHead, hint: seanceAujourdhui ? "après la séance, priorité peau" : null },
                { k: "dentsMatin", label: "Dents · matin", Ic: Sparkles },
                { k: "dentsSoir", label: "Dents · soir", Ic: Sparkles },
                { k: "visageMatin", label: "Soins visage · matin", Ic: Droplets },
                { k: "visageSoir", label: "Soins visage · soir", Ic: Droplets },
              ].map(({ k, label, Ic, hint }) => {
                const on = !!jourDuJour[k];
                return (
                  <button
                    key={k}
                    onClick={() => setJour({ [k]: !on })}
                    className="w-full flex items-center gap-3 py-3 text-left"
                    style={{ borderTop: `1px solid ${C.line}` }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: on ? C.green : C.card2, border: `1px solid ${on ? C.green : C.line}` }}
                    >
                      {on && <Check size={15} color="#111" />}
                    </div>
                    <Ic size={15} style={{ color: on ? C.yellowDim : C.dim }} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold" style={{ color: on ? C.text : C.dim }}>{label}</div>
                      {hint && <div className="text-xs" style={{ color: C.dim }}>{hint}</div>}
                    </div>
                  </button>
                );
              })}

              {(() => {
                const total = 5;
                const faits = ["douche", "dentsMatin", "dentsSoir", "visageMatin", "visageSoir"].filter((k) => jourDuJour[k]).length;
                return (
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span style={{ color: C.dim }}>Routine du jour</span>
                      <span className="font-bold" style={{ ...NUMS, color: faits === total ? C.green : C.dim }}>{faits}/{total}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: C.card2 }}>
                      <div className="h-full rounded-full" style={{ width: `${(faits / total) * 100}%`, background: faits === total ? C.green : C.yellow, transition: "width .3s" }} />
                    </div>
                  </div>
                );
              })()}
            </Card>

            {/* Routine sur 7 jours */}
            <Card>
              <div className="text-sm font-bold mb-2">Ma régularité</div>
              {[
                { k: "douche", label: "Douche" },
                { k: "dents", label: "Dents" },
                { k: "visage", label: "Visage" },
                { k: "eau", label: "Eau 2 L" },
              ].map(({ k, label }) => (
                <div key={k} className="flex items-center gap-2 py-2" style={{ borderTop: `1px solid ${C.line}` }}>
                  <div className="text-sm w-24 shrink-0" style={{ color: C.dim }}>{label}</div>
                  <div className="flex gap-1.5 flex-1">
                    {[...Array(7)].map((_, i) => {
                      const dt = new Date(); dt.setDate(dt.getDate() - (6 - i));
                      const j = (data.jours || {})[isoOf(dt)] || {};
                      const ok = k === "dents" ? (j.dentsMatin && j.dentsSoir)
                        : k === "visage" ? (j.visageMatin && j.visageSoir)
                        : k === "eau" ? (j.eau || 0) >= 2
                        : !!j[k];
                      const partiel = k === "dents" ? (j.dentsMatin || j.dentsSoir)
                        : k === "visage" ? (j.visageMatin || j.visageSoir)
                        : k === "eau" ? (j.eau || 0) > 0 : false;
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded"
                          style={{ height: 26, background: ok ? C.green : partiel ? C.yellowDim : C.card2, border: `1px solid ${ok ? C.green : C.line}` }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="text-xs mt-2" style={{ color: C.dim }}>
                7 derniers jours, du plus ancien à aujourd'hui — vert = complet, jaune = partiel.
              </div>
            </Card>

            {/* Poids de corps */}
            <Card>
              <div className="text-sm mb-2 flex items-center gap-2 font-bold">
                <Scale size={16} style={{ color: C.yellowDim }} /> Poids de corps
                <span className="font-normal text-xs" style={{ color: C.dim }}>objectif {OBJECTIF_POIDS} kg</span>
              </div>
              {dernierPoids && (
                <div className="text-2xl mb-2" style={{ ...DISPLAY, ...NUMS, color: C.yellowDim }}>
                  {fmtKg(dernierPoids.kg)} kg
                  <span className="text-sm ml-2" style={{ color: C.dim, fontFamily: "inherit" }}>
                    {joursDepuis(dernierPoids.date) === 0 ? "aujourd'hui" : `il y a ${joursDepuis(dernierPoids.date)} j`}
                    {OBJECTIF_POIDS - dernierPoids.kg > 0 ? ` · encore ${fmtKg(OBJECTIF_POIDS - dernierPoids.kg)} kg` : " · atteint !"}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={pdsInput}
                  onChange={(e) => setPdsInput(e.target.value)}
                  inputMode="decimal"
                  placeholder="Nouvelle pesée (kg)…"
                  className="flex-1 rounded-2xl px-4 py-4 text-lg font-bold"
                  style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text, ...NUMS }}
                />
                <button
                  onClick={ajouterPoids}
                  disabled={!pdsInput.trim()}
                  className="px-6 rounded-2xl font-black"
                  style={{ background: pdsInput.trim() ? C.yellow : C.card2, color: pdsInput.trim() ? "#111" : C.dim }}
                >
                  OK
                </button>
              </div>
            </Card>

            {/* Rythme des séances */}
            <Card>
              <div className="text-sm font-bold mb-2">Mon rythme</div>
              <div className="flex gap-1.5 mb-2">
                {[...Array(7)].map((_, i) => {
                  const dt = new Date(); dt.setDate(dt.getDate() - (6 - i));
                  const iso = isoOf(dt);
                  const seance = data.seances.some((s) => s.date === iso) || (current && iso === todayISO());
                  return (
                    <div key={iso} className="flex-1 text-center">
                      <div
                        className="rounded-lg mb-1"
                        style={{ height: 34, background: seance ? C.yellow : C.card2, border: `1px solid ${seance ? C.yellow : C.line}` }}
                      />
                      <div className="text-xs" style={{ color: C.dim }}>{["L", "M", "M", "J", "V", "S", "D"][(dt.getDay() + 6) % 7]}</div>
                    </div>
                  );
                })}
              </div>
              <div className="text-sm" style={{ color: C.dim }}>
                {reposDepuis == null
                  ? "Aucune séance enregistrée."
                  : reposDepuis === 0
                  ? "Séance aujourd'hui — pense à la douche."
                  : `Dernière séance il y a ${reposDepuis} j.`}
              </div>
            </Card>

            {/* Le reste, replié */}
            <Card>
              <button onClick={() => setRecupPlus(!recupPlus)} className="w-full flex items-center justify-between">
                <span className="text-sm font-bold">Mensurations</span>
                {recupPlus ? <ChevronUp size={16} style={{ color: C.dim }} /> : <ChevronDown size={16} style={{ color: C.dim }} />}
              </button>
              {recupPlus && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    {dernieresMensu.map(({ zone, last, delta }) => (
                      <div key={zone} className="text-sm" style={NUMS}>
                        <span style={{ color: C.dim }}>{zone} : </span>
                        {last ? (
                          <>
                            <b>{fmtKg(last.cm)} cm</b>
                            {delta != null && delta !== 0 && (
                              <span style={{ color: delta > 0 ? C.green : C.red }}> ({delta > 0 ? "+" : ""}{fmtKg(delta)})</span>
                            )}
                          </>
                        ) : (
                          <span style={{ color: C.line }}>—</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-2">
                    {ZONES.map((z) => (
                      <Chip key={z} active={mensuZone === z} onClick={() => setMensuZone(z)}>{z}</Chip>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={mensuInput}
                      onChange={(e) => setMensuInput(e.target.value)}
                      inputMode="decimal"
                      placeholder={`Tour de ${mensuZone.toLowerCase()} (cm)…`}
                      className="flex-1 rounded-2xl px-4 py-4 text-lg font-bold"
                      style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text, ...NUMS }}
                    />
                    <button
                      onClick={ajouterMensu}
                      disabled={!mensuInput.trim()}
                      className="px-6 rounded-2xl font-black"
                      style={{ background: mensuInput.trim() ? C.yellow : C.card2, color: mensuInput.trim() ? "#111" : C.dim }}
                    >
                      OK
                    </button>
                  </div>
                  {(data.mensu || []).filter((m) => m.zone === mensuZone).length > 0 && (
                    <div className="mt-2">
                      {[...(data.mensu || [])].filter((m) => m.zone === mensuZone).reverse().slice(0, 5).map((m) => (
                        <div key={m.date + m.zone} className="flex items-center gap-2 py-2" style={{ borderTop: `1px solid ${C.line}` }}>
                          <div className="text-xs w-12 shrink-0" style={{ color: C.dim }}>{fmtShort(m.date)}</div>
                          <div className="text-sm flex-1 font-semibold" style={NUMS}>{fmtKg(m.cm)} cm</div>
                          <button onClick={() => supprimerMensu(m.date, m.zone)} className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: C.card2, color: C.red }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {(data.poids || []).length > 1 && (
              <Card>
                <div className="text-sm font-bold mb-1">Historique des pesées</div>
                {[...(data.poids || [])].reverse().slice(0, 6).map((pp) => (
                  <div key={pp.date} className="flex items-center gap-2 py-2" style={{ borderTop: `1px solid ${C.line}` }}>
                    <div className="text-xs w-12 shrink-0" style={{ color: C.dim }}>{fmtShort(pp.date)}</div>
                    <div className="text-sm flex-1 font-semibold" style={NUMS}>{fmtKg(pp.kg)} kg</div>
                    <button onClick={() => supprimerPoids(pp.date)} className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: C.card2, color: C.red }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        {/* ————— HISTORIQUE ————— */}
        {tab === "historique" && (
          <div className="space-y-3 pl-anim">
            {[...data.seances].reverse().map((s) => {
              const open = expandedId === s.id;
              return (
                <Card key={s.id}>
                  <button className="w-full flex items-center justify-between text-left" onClick={() => setExpandedId(open ? null : s.id)}>
                    <div>
                      <div className="text-base font-bold">{s.nom}</div>
                      <div className="text-xs mt-0.5" style={{ color: C.dim }}>
                        {fmtDate(s.date)}
                        {s.duree ? ` · ${fmtDuree(s.duree)}` : ""}
                        {s.gourdes != null ? ` · ${s.gourdes} 🥤` : ""}
                        {` · ${s.exos.length} exos`}
                      </div>
                    </div>
                    {open ? <ChevronUp size={18} style={{ color: C.dim }} /> : <ChevronDown size={18} style={{ color: C.dim }} />}
                  </button>
                  {open && (
                    <div className="mt-3">
                      {s.exos.map((e) => {
                        const enEdition = ehKey === s.id + "|" + e.id;
                        return (
                          <div key={e.id} className="py-2" style={{ borderTop: `1px solid ${C.line}` }}>
                            <div className="flex gap-3">
                              <div className="flex-1 min-w-0">
                                <button onClick={() => setFicheExo(e.nom)} className="text-sm font-semibold text-left">
                                  <Dot ressenti={e.ressenti} />{e.nom}{e.pr && <PrBadge />}
                                </button>
                                {!enEdition && (
                                  <div className="text-xs mt-0.5" style={{ ...NUMS, color: C.dim }}>
                                    {e.type === "cardio"
                                      ? `${e.dureeCardio} min${e.distance ? ` · ${fmtKg(e.distance)} km` : ""}${e.niveau ? ` · niveau ${e.niveau}` : ""}`
                                      : `${e.series}×${e.reps} @ ${fmtKg(e.poids)} kg${e.parBras ? "/bras" : ""}${e.reposSec ? ` · repos ${fmtRepos(e.reposSec)}` : ""}${e.dureeMin ? ` · ${e.dureeMin} min` : ""}`}
                                    {e.note ? ` · ${e.note}` : ""}
                                  </div>
                                )}
                                {!enEdition && e.coach && <div className="text-xs mt-1" style={{ color: C.yellowDim }}>{e.coach}</div>}
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <PhotoThumb photoId={e.photoId} onView={setPhotoView} />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => (enEdition ? setEhKey(null) : startEditHist(s.id, e))}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ background: C.card2, color: enEdition ? C.yellowDim : C.dim }}
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button
                                    onClick={() => supprimerExoHist(s.id, e.id)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ background: C.card2, color: C.red }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            {enEdition && (
                              <div className="flex items-end gap-2 mt-2">
                                {ehCardio ? (
                                  <>
                                    <Stepper label="Durée (min)" value={ehDuree} onChange={setEhDuree} min={1} max={180} />
                                    <div className="flex-1">
                                      <div className="text-xs mb-1" style={{ color: C.dim }}>Distance (km)</div>
                                      <input
                                        value={ehDistance}
                                        onChange={(ev) => setEhDistance(ev.target.value)}
                                        inputMode="decimal"
                                        placeholder="—"
                                        className="w-full rounded-xl px-3 py-2 text-base font-bold"
                                        style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text, ...NUMS }}
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex-1">
                                      <div className="text-xs mb-1" style={{ color: C.dim }}>Poids (kg)</div>
                                      <input
                                        value={ehPoids}
                                        onChange={(ev) => setEhPoids(ev.target.value)}
                                        inputMode="decimal"
                                        className="w-full rounded-xl px-3 py-2 text-base font-bold"
                                        style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text, ...NUMS }}
                                      />
                                    </div>
                                    <Stepper label="Séries" value={ehSeries} onChange={setEhSeries} />
                                    <Stepper label="Reps" value={ehReps} onChange={setEhReps} max={50} />
                                  </>
                                )}
                                <button
                                  onClick={saveEditHist}
                                  className="px-4 py-2 rounded-xl font-bold"
                                  style={{ background: C.yellow, color: "#111" }}
                                >
                                  <Check size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {(s.note || ehNoteKey === s.id) && (
                        <div className="mt-3 rounded-xl p-3" style={{ background: C.card2, border: `1px solid ${C.line}` }}>
                          <div className="text-xs font-bold mb-1" style={{ color: C.yellowDim }}>Ta note</div>
                          {ehNoteKey === s.id ? (
                            <>
                              <textarea
                                value={ehNote}
                                onChange={(ev) => setEhNote(ev.target.value)}
                                rows={3}
                                className="w-full rounded-xl p-2 text-sm"
                                style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.text }}
                              />
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => saveNoteHist(s.id)} className="flex-1 rounded-xl py-2 font-bold text-sm" style={{ background: C.yellow, color: "#111" }}>
                                  Enregistrer
                                </button>
                                <button onClick={() => setEhNoteKey(null)} className="px-4 rounded-xl text-sm" style={{ background: C.bg, color: C.dim }}>
                                  Annuler
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-sm leading-relaxed">{s.note}</div>
                          )}
                        </div>
                      )}
                      {bilanBusyId === s.id && (
                        <div className="text-xs italic mt-2" style={{ color: C.dim }}>Le coach prépare son bilan…</div>
                      )}
                      {s.bilan && (
                        <div className="mt-3 rounded-xl p-3 text-sm leading-relaxed" style={{ background: C.card2, border: `1px solid ${C.line}` }}>
                          <div className="flex items-center gap-1 mb-1 text-xs font-bold" style={{ color: C.yellowDim }}>
                            <Sparkles size={12} /> Bilan du coach
                          </div>
                          {s.bilan}
                        </div>
                      )}
                      {shareFallback && shareFallback.id === s.id && (
                        <textarea
                          readOnly
                          value={shareFallback.text}
                          onFocus={(ev) => ev.target.select()}
                          className="w-full rounded-xl p-3 mt-3 text-xs"
                          rows={6}
                          style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text }}
                        />
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <button
                          onClick={() => partagerSeance(s)}
                          className="text-xs flex items-center gap-1 font-semibold"
                          style={{ color: shareId === s.id ? C.green : C.yellowDim }}
                        >
                          <Share2 size={12} /> {shareId === s.id ? "Récap copié !" : "Partager le récap"}
                        </button>
                        <button
                          onClick={() => { setEhNoteKey(s.id); setEhNote(s.note || ""); }}
                          className="text-xs flex items-center gap-1 font-semibold"
                          style={{ color: C.yellowDim }}
                        >
                          <Pencil size={12} /> Note
                        </button>
                        <button
                          onClick={() => ajouterExoHist(s.id)}
                          className="text-xs flex items-center gap-1 font-semibold"
                          style={{ color: C.yellowDim }}
                        >
                          <Plus size={12} /> Exo
                        </button>
                        <button
                          onClick={() => refaireSeance(s)}
                          className="text-xs flex items-center gap-1 font-semibold"
                          style={{ color: C.yellowDim }}
                        >
                          <Play size={12} /> Refaire
                        </button>
                        <button
                          onClick={() => enregistrerProgramme(s)}
                          className="text-xs flex items-center gap-1 font-semibold"
                          style={{ color: C.yellowDim }}
                        >
                          <Copy size={12} /> Programme
                        </button>
                        <button
                          onClick={() => genererCarte(s)}
                          className="text-xs flex items-center gap-1 font-semibold"
                          style={{ color: C.yellowDim }}
                        >
                          <Camera size={12} /> Carte image
                        </button>
                        <button
                          onClick={() => supprimerSeance(s.id)}
                          className="text-xs flex items-center gap-1"
                          style={{ color: C.red }}
                        >
                          <Trash2 size={12} /> Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* ————— PROGRESSION ————— */}
        {tab === "progression" && (
          <div className="space-y-3 pl-anim">
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <Chip active={progMode === "exo"} onClick={() => setProgMode("exo")}>Exercices</Chip>
              <Chip active={progMode === "corps"} onClick={() => setProgMode("corps")}>Corps</Chip>
              <Chip active={progMode === "muscles"} onClick={() => setProgMode("muscles")}>Muscles</Chip>
              <Chip active={progMode === "equilibre"} onClick={() => setProgMode("equilibre")}>Équilibre</Chip>
              <Chip active={progMode === "retro"} onClick={() => setProgMode("retro")}>Rétro ✨</Chip>
              <Chip active={progMode === "records"} onClick={() => setProgMode("records")}>Records</Chip>
              <Chip active={progMode === "volume"} onClick={() => setProgMode("volume")}>Volume</Chip>
              <Chip active={progMode === "bilan"} onClick={() => setProgMode("bilan")}>Bilan</Chip>
            </div>

            {progMode === "exo" && (
              <>
                <Card>
                  <div className="text-xs mb-1" style={{ color: C.dim }}>Exercice</div>
                  <select
                    value={selExo}
                    onChange={(e) => setSelExo(e.target.value)}
                    className="w-full rounded-xl px-3 py-3 text-base"
                    style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text }}
                  >
                    {allExos.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Card>

                {selExo && (
                  <Card>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-bold">Mon objectif</div>
                      {objectifSel && !objEdit && (
                        <div className="flex items-center gap-3">
                          <button onClick={() => { setObjInput(fmtKg(objectifSel.cible)); setObjEdit(true); }} className="text-xs font-bold" style={{ color: C.yellowDim }}>
                            Modifier
                          </button>
                          <button onClick={retirerObjectif} className="text-xs font-semibold" style={{ color: C.red }}>
                            Retirer
                          </button>
                        </div>
                      )}
                    </div>

                    {objectifSel && !objEdit ? (() => {
                      const rec = recordOf(data, selExo) || 0;
                      const pct = Math.min(100, (rec / objectifSel.cible) * 100);
                      const reste = Math.round((objectifSel.cible - rec) * 10) / 10;
                      return (
                        <>
                          <div className="flex items-baseline justify-between mb-2">
                            <div className="text-2xl" style={{ ...DISPLAY, ...NUMS, color: C.yellowDim }}>
                              {fmtKg(rec)} <span style={{ fontSize: 16, color: C.dim }}>/ {fmtKg(objectifSel.cible)} kg</span>
                            </div>
                            <div className="text-xs font-bold" style={{ ...NUMS, color: reste <= 0 ? C.green : C.dim }}>
                              {reste <= 0 ? "Atteint !" : `encore ${fmtKg(reste)} kg`}
                            </div>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: C.card2 }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: reste <= 0 ? C.green : C.yellow, transition: "width .4s" }} />
                          </div>
                        </>
                      );
                    })() : (
                      <div className="flex gap-2">
                        <input
                          value={objInput}
                          onChange={(e) => setObjInput(e.target.value)}
                          inputMode="decimal"
                          placeholder="Charge à atteindre (kg)…"
                          className="flex-1 rounded-xl px-3 py-3 text-base font-bold"
                          style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text, ...NUMS }}
                        />
                        <button
                          onClick={definirObjectif}
                          disabled={!objInput.trim()}
                          className="px-4 rounded-xl font-bold text-sm"
                          style={{ background: objInput.trim() ? C.yellow : C.card2, color: objInput.trim() ? "#111" : C.dim }}
                        >
                          OK
                        </button>
                        {objEdit && (
                          <button onClick={() => { setObjEdit(false); setObjInput(""); }} className="px-3 rounded-xl" style={{ background: C.card2, color: C.dim }}>
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    )}

                    {rm1Sel != null && (
                      <div className="text-xs mt-3 pt-3 leading-relaxed" style={{ borderTop: `1px solid ${C.line}`, color: C.dim }}>
                        <span style={{ color: C.text, fontWeight: 700, ...NUMS }}>1RM estimé : {fmtKg(Math.round(rm1Sel * 2) / 2)} kg</span>
                        {" "}— la charge que tu sortirais sur une seule répétition, calculée depuis tes séries. Estimation, ne la teste pas en vrai sans partenaire.
                      </div>
                    )}
                  </Card>
                )}
                <Card>
                  {chartData.length === 0 ? (
                    <div className="text-sm text-center py-8" style={{ color: C.dim }}>Pas encore de données pour cet exercice.</div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-bold">
                          Charge max par séance <span style={{ color: C.dim, fontWeight: 400 }}>(kg)</span>
                        </div>
                        {recordExo != null && (
                          <div className="flex items-center gap-1 text-xs font-bold" style={{ ...NUMS, color: C.yellowDim }}>
                            <Trophy size={12} /> {fmtKg(recordExo)} kg
                          </div>
                        )}
                      </div>
                      <MiniLine data={chartData} dataKey="poids" color={C.yellow} height={240} />
                      {chartData.length === 1 && (
                        <div className="text-xs mt-2" style={{ color: C.dim }}>
                          Une seule séance pour l'instant — la courbe se dessinera au fil des prochaines.
                        </div>
                      )}
                    </>
                  )}
                </Card>
              </>
            )}

            {progMode === "corps" && (
              <>
                <Card>
                  {chartPoids.length === 0 ? (
                    <div className="text-sm text-center py-8" style={{ color: C.dim }}>
                      Pas encore de pesée — enregistre ton poids dans l'onglet Récup.
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-bold mb-2">
                        Poids de corps <span style={{ color: C.dim, fontWeight: 400 }}>(objectif {OBJECTIF_POIDS} kg)</span>
                      </div>
                      <MiniLine data={chartPoids} dataKey="kg" color={C.green} height={220} refY={OBJECTIF_POIDS} />
                    </>
                  )}
                </Card>
                <Card>
                  <div className="text-sm font-bold mb-2">Mensurations</div>
                  <div className="flex gap-2 mb-3">
                    {ZONES.map((z) => (
                      <Chip key={z} active={progMensuZone === z} onClick={() => setProgMensuZone(z)}>{z}</Chip>
                    ))}
                  </div>
                  {chartMensu.length === 0 ? (
                    <div className="text-sm text-center py-6" style={{ color: C.dim }}>
                      Pas encore de mesure pour {progMensuZone.toLowerCase()} — saisis-la dans Récup.
                    </div>
                  ) : (
                    <MiniLine data={chartMensu} dataKey="cm" color={C.yellow} height={200} />
                  )}
                </Card>
              </>
            )}

            {progMode === "muscles" && (
              <Card>
                <div className="text-sm font-bold mb-1">Séries par groupe musculaire</div>
                <div className="text-xs mb-3" style={{ color: C.dim }}>7 derniers jours (séance en cours incluse)</div>
                {MUSCLE_ORDRE.filter((m) => m !== "Autre" || volumes[m]).map((m) => {
                  const v = volumes[m] || 0;
                  const cible = (data.ciblesMuscles || {})[m];
                  const alerte = m === "Jambes" && v === 0 && !cible;
                  const atteint = cible && v >= cible;
                  const pct = cible ? Math.min(100, (v / cible) * 100) : Math.max(v > 0 ? 4 : 0, (v / maxVol) * 100);
                  return (
                    <button key={m} onClick={() => definirCibleMuscle(m)} className="w-full mb-3 text-left">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold" style={{ color: alerte ? C.red : C.text }}>{m}</span>
                        <span style={{ ...NUMS, color: atteint ? C.green : alerte ? C.red : C.dim }}>
                          {cible ? `${v} / ${cible} séries` : `${v} série${v > 1 ? "s" : ""}`}
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: C.card2 }}>
                        <div
                          className="h-full rounded-full"
                          style={{ background: atteint ? C.green : alerte ? C.red : C.yellow, width: `${pct}%`, transition: "width 0.4s" }}
                        />
                      </div>
                    </button>
                  );
                })}
                <div className="text-xs mt-1" style={{ color: C.dim }}>
                  Tape un groupe pour fixer sa cible de séries hebdo. Un groupe à 0 mérite ta prochaine séance.
                </div>
                <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                  <div className="text-sm font-bold mb-1">Équilibre sur 14 jours</div>
                  <div className="text-xs mb-3" style={{ color: C.dim }}>
                    Un coach surveille les paires opposées, pas seulement le volume total.
                  </div>
                  {equilibres(data, current ? current.exos : []).map((e) => {
                    const [n1, n2] = e.label.split(" / ");
                    if (e.etat === "vide") {
                      return (
                        <div key={e.label} className="text-sm py-2" style={{ borderTop: `1px solid ${C.line}`, color: C.dim }}>
                          {e.label} — rien d'enregistré
                        </div>
                      );
                    }
                    const total = e.a + e.b;
                    const pctA = (e.a / total) * 100;
                    const coul = e.etat === "ok" ? C.green : "#b45309";
                    return (
                      <div key={e.label} className="py-2" style={{ borderTop: `1px solid ${C.line}` }}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-semibold">{e.label}</span>
                          <span style={{ ...NUMS, color: coul }}>{e.a} / {e.b}</span>
                        </div>
                        <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: C.card2 }}>
                          <div style={{ width: `${pctA}%`, background: C.yellow }} />
                          <div style={{ width: `${100 - pctA}%`, background: "#5b6cff" }} />
                        </div>
                        <div className="text-xs mt-1" style={{ color: e.etat === "ok" ? C.dim : coul }}>
                          {e.etat === "ok"
                            ? "équilibré"
                            : e.etat === "tropA"
                            ? `trop de ${n1.toLowerCase()} — rattrape le ${n2.toLowerCase()}`
                            : `trop de ${n2.toLowerCase()} — rattrape le ${n1.toLowerCase()}`}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(() => {
                  const dep = new Date(); dep.setDate(dep.getDate() - 6);
                  const iso = isoOf(dep);
                  const min = data.seances.filter((s) => s.date >= iso)
                    .reduce((a, s) => a + s.exos.filter((e) => e.type === "cardio").reduce((x, e) => x + (e.dureeCardio || 0), 0), 0)
                    + (current ? current.exos.filter((e) => e.type === "cardio").reduce((x, e) => x + (e.dureeCardio || 0), 0) : 0);
                  return (
                    <div className="text-xs mt-3 pt-3 font-semibold" style={{ borderTop: `1px solid ${C.line}`, color: min > 0 ? C.text : C.dim }}>
                      Cardio cette semaine : <span style={{ color: min > 0 ? C.yellowDim : C.dim, ...NUMS }}>{min} min</span>
                    </div>
                  );
                })()}
              </Card>
            )}

            {progMode === "bilan" && (() => {
              const now = new Date();
              const moisISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
              const seancesMois = data.seances.filter((s) => s.date.startsWith(moisISO));
              const seriesMois = seancesMois.reduce((a, s) => a + s.exos.reduce((x, e) => x + (e.series || 0), 0), 0);
              const recordsMois = seancesMois.reduce((a, s) => a + s.exos.filter((e) => e.pr).length, 0);
              const poidsAn = (data.poids || []);
              const poidsMoisDebut = [...poidsAn].reverse().find((p) => p.date < moisISO + "-01");
              const poidsMoisFin = [...poidsAn].filter((p) => p.date.startsWith(moisISO)).slice(-1)[0] || poidsMoisDebut;
              const deltaPoids = poidsMoisDebut && poidsMoisFin ? Math.round((poidsMoisFin.kg - poidsMoisDebut.kg) * 10) / 10 : null;
              const vGroupes = volumeGros(data, 30);
              const negliges = MUSCLE_ORDRE.filter((m) => m !== "Autre" && (vGroupes[m] || 0) === 0);
              const nomMois = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

              const anISO = String(now.getFullYear());
              const seancesAn = data.seances.filter((s) => s.date.startsWith(anISO));
              const recordsAn = seancesAn.reduce((a, s) => a + s.exos.filter((e) => e.pr).length, 0);

              return (
                <>
                  <Card>
                    <div className="text-sm font-bold mb-3">Bilan de {nomMois}</div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-2xl" style={{ ...DISPLAY, ...NUMS, color: C.yellowDim }}>{seancesMois.length}</div>
                        <div className="text-xs" style={{ color: C.dim }}>séances</div>
                      </div>
                      <div>
                        <div className="text-2xl" style={{ ...DISPLAY, ...NUMS, color: C.yellowDim }}>{seriesMois}</div>
                        <div className="text-xs" style={{ color: C.dim }}>séries</div>
                      </div>
                      <div>
                        <div className="text-2xl flex items-center gap-1" style={{ ...DISPLAY, ...NUMS, color: recordsMois > 0 ? C.yellowDim : C.dim }}>
                          <Trophy size={18} /> {recordsMois}
                        </div>
                        <div className="text-xs" style={{ color: C.dim }}>records battus</div>
                      </div>
                      <div>
                        <div className="text-2xl" style={{ ...DISPLAY, ...NUMS, color: deltaPoids > 0 ? C.green : deltaPoids < 0 ? C.red : C.dim }}>
                          {deltaPoids != null ? `${deltaPoids > 0 ? "+" : ""}${fmtKg(deltaPoids)} kg` : "—"}
                        </div>
                        <div className="text-xs" style={{ color: C.dim }}>poids de corps</div>
                      </div>
                    </div>
                    {negliges.length > 0 ? (
                      <div className="text-sm" style={{ color: "#b45309" }}>
                        Négligés ce mois-ci (30 j) : {negliges.join(", ")}.
                      </div>
                    ) : (
                      <div className="text-sm" style={{ color: C.green }}>Tous les groupes travaillés ce mois — bon équilibre.</div>
                    )}
                  </Card>
                  <Card>
                    <div className="text-sm font-bold mb-1">Depuis le 1er janvier {anISO}</div>
                    <div className="text-sm" style={{ color: C.dim }}>
                      <b style={{ color: C.text, ...NUMS }}>{seancesAn.length}</b> séances ·{" "}
                      <b style={{ color: C.text, ...NUMS }}>{recordsAn}</b> records personnels battus
                    </div>
                  </Card>
                </>
              );
            })()}

            {progMode === "volume" && (() => {
              const vol = volumeSemaines(data, 8);
              return (
                <Card>
                  <div className="text-sm font-bold mb-1">Volume total soulevé, par semaine</div>
                  <div className="text-xs mb-3" style={{ color: C.dim }}>
                    Toutes séances confondues — la tendance de fond compte plus qu'une semaine isolée.
                  </div>
                  {vol.length < 2 ? (
                    <div className="text-sm text-center py-8" style={{ color: C.dim }}>
                      Pas encore assez de semaines pour une courbe — reviens dans quelques séances.
                    </div>
                  ) : (
                    <MiniLine data={vol} dataKey="kg" color={C.yellow} height={220} />
                  )}
                </Card>
              );
            })()}

            {progMode === "retro" && (() => {
              const an = new Date().getFullYear();
              const sAn = data.seances.filter((s) => s.date.startsWith(String(an)));
              if (!sAn.length) return <Card><div className="text-sm text-center py-8" style={{ color: C.dim }}>Ta rétro {an} s'écrira séance après séance. Va charger. 💪</div></Card>;
              const tonnage = sAn.reduce((a, s) => a + tonnageSeance(s), 0);
              const series = sAn.reduce((a, s) => a + s.exos.reduce((x, e) => x + (e.type === "cardio" ? 0 : (e.series || 0)), 0), 0);
              const minutes = sAn.reduce((a, s) => a + (s.duree || 0), 0);
              const prs = sAn.reduce((a, s) => a + s.exos.filter((e) => e.pr).length, 0);
              // exo fétiche
              const cnt = {};
              sAn.forEach((s) => s.exos.forEach((e) => { const k = e.nom; cnt[k] = (cnt[k] || 0) + 1; }));
              const fetiche = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
              // plus grosse séance
              const best = [...sAn].sort((a, b) => tonnageSeance(b) - tonnageSeance(a))[0];
              // équivalences parlantes
              const ELEPHANT = 5000, VOITURE = 1400;
              const equiv = tonnage >= ELEPHANT
                ? `${(tonnage / ELEPHANT).toFixed(1)} éléphants 🐘`
                : `${(tonnage / VOITURE).toFixed(1)} voitures 🚗`;
              const partager = async () => {
                const txt = `PLATEAU — ma rétro ${an}\n\n${sAn.length} séances · ${series} séries\n${tonnage.toLocaleString("fr-FR")} kg soulevés (${equiv})\n${Math.round(minutes / 60)} h à la salle\n${prs} records battus\nExo fétiche : ${fetiche}`;
                try { await navigator.clipboard.writeText(txt); setShareId("retro"); setTimeout(() => setShareId(null), 2500); }
                catch { window.alert(txt); }
              };
              const tuiles = [
                [sAn.length, "séances"], [series, "séries"],
                [Math.round(minutes / 60) + " h", "à la salle"], [prs, "records"],
              ];
              return (
                <>
                  <Card style={{ background: "linear-gradient(165deg, rgba(245,197,24,.16), #fffdf7 60%)", border: "1px solid rgba(245,197,24,.28)" }}>
                    <div className="text-xs font-extrabold tracking-widest uppercase" style={{ color: C.yellowDim }}>Ta rétro</div>
                    <div className="leading-none mt-1" style={{ ...DISPLAY, fontSize: 52, color: C.text }}>{an}</div>
                    <div className="mt-4">
                      <div className="text-xs" style={{ color: C.dim }}>Tu as soulevé</div>
                      <div className="leading-none mt-1" style={{ ...DISPLAY, ...NUMS, fontSize: 40, color: C.yellowDim }}>
                        <CountUp value={tonnage} /> <span style={{ fontSize: 20 }}>kg</span>
                      </div>
                      <div className="text-sm font-bold mt-1">soit {equiv}</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {tuiles.map(([v, k], i) => (
                        <div key={i} className="rounded-xl py-2.5 px-1 text-center" style={{ background: "rgba(255,255,255,.55)", border: `1px solid ${C.hair}` }}>
                          <div style={{ ...DISPLAY, ...NUMS, fontSize: 19, color: C.text }}>{v}</div>
                          <div className="text-xs mt-0.5" style={{ color: C.dim, fontSize: 10 }}>{k}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🏅</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs" style={{ color: C.dim }}>Ton exercice fétiche</div>
                        <div className="text-base font-bold truncate">{fetiche}</div>
                        <div className="text-xs" style={{ color: C.dim }}>{cnt[fetiche]} fois cette année</div>
                      </div>
                    </div>
                  </Card>
                  {best && (
                    <Card>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🔥</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs" style={{ color: C.dim }}>Ta plus grosse séance</div>
                          <div className="text-base font-bold truncate">{best.nom} · {fmtDate(best.date)}</div>
                          <div className="text-xs" style={{ ...NUMS, color: C.yellowDim }}>{tonnageSeance(best).toLocaleString("fr-FR")} kg en une séance</div>
                        </div>
                      </div>
                    </Card>
                  )}
                  <button onClick={partager} className="pl-tap w-full rounded-2xl py-4 font-black flex items-center justify-center gap-2" style={{ background: shareId === "retro" ? C.card2 : C.yellow, color: shareId === "retro" ? C.green : "#111", border: shareId === "retro" ? `1px solid ${C.green}` : "none" }}>
                    <Share2 size={16} /> {shareId === "retro" ? "Copié !" : "Partager ma rétro"}
                  </button>
                </>
              );
            })()}

            {progMode === "equilibre" && (() => {
              const groupes = ["Pecs", "Dos", "Épaules", "Biceps", "Triceps", "Jambes"];
              const v30 = volumeGros(data, 30);
              const vals = groupes.map((g) => v30[g] || 0);
              const maxG = Math.max(...vals), minG = Math.min(...vals);
              const fort = groupes[vals.indexOf(maxG)], faible = groupes[vals.indexOf(minG)];
              const total = vals.reduce((a, b) => a + b, 0);
              return (
                <>
                  <Card>
                    <div className="text-sm font-bold mb-1">Équilibre du physique</div>
                    <div className="text-xs mb-2" style={{ color: C.dim }}>Séries par groupe · 30 derniers jours</div>
                    {total === 0 ? (
                      <div className="text-sm text-center py-8" style={{ color: C.dim }}>Pas encore de données — enchaîne quelques séances.</div>
                    ) : (
                      <>
                        <RadarMuscles volumes={v30} groupes={groupes} />
                        <div className="mt-2 rounded-xl px-3 py-2.5 text-xs leading-relaxed" style={{ background: C.card2, border: `1px solid ${C.hair}` }}>
                          {minG === 0
                            ? <>⚠️ <b style={{ color: C.red }}>{faible}</b> : rien en 30 jours. C'est le trou dans ta raquette.</>
                            : <>Point fort : <b style={{ color: C.yellowDim }}>{fort}</b> ({maxG} séries) · À rattraper : <b style={{ color: maxG > minG * 2 ? C.red : C.text }}>{faible}</b> ({minG} séries).</>}
                        </div>
                      </>
                    )}
                  </Card>
                  <Card>
                    <div className="text-sm font-bold mb-1">Assiduité · 6 derniers mois</div>
                    <div className="text-xs mb-3" style={{ color: C.dim }}>Une case par jour — plus c'est jaune, plus tu as soulevé</div>
                    <Heatmap seances={data.seances} />
                    <div className="flex items-center justify-end gap-1.5 mt-2 text-xs" style={{ color: C.dim }}>
                      <span>−</span>
                      {["#e6e1d2", "#e9dba3", "#f2d066", C.yellow, C.yellowHi].map((c) => (
                        <i key={c} style={{ width: 11, height: 11, borderRadius: 3, background: c, display: "inline-block", border: `1px solid ${C.hair}` }} />
                      ))}
                      <span>+</span>
                    </div>
                  </Card>
                </>
              );
            })()}

            {progMode === "records" && (
              <Card>
                <div className="text-sm font-bold mb-2">Mur des records</div>
                {mursRecords.length === 0 ? (
                  <div className="text-sm text-center py-6" style={{ color: C.dim }}>Pas encore de records — ça vient.</div>
                ) : (
                  mursRecords.map((r) => {
                    const rp = repereFor(r.nom, poidsCorps);
                    const niv = rp ? niveauPour(r.parBras ? r.poids * 2 : r.poids, rp.paliers) : null;
                    return (
                      <div key={r.nom} className="flex items-center gap-2 py-2" style={{ borderBottom: `1px solid ${C.line}` }}>
                        <Trophy size={14} style={{ color: C.yellowDim }} className="shrink-0" />
                        <button onClick={() => setFicheExo(r.nom)} className="flex-1 min-w-0 text-left">
                          <div className="text-sm font-semibold truncate">{r.nom}</div>
                          {niv && <div className="text-xs" style={{ color: niv.color }}>{niv.label}</div>}
                        </button>
                        <div className="text-sm font-bold shrink-0" style={{ ...NUMS, color: C.yellowDim }}>
                          {fmtKg(r.poids)} kg{r.parBras ? "/bras" : ""}
                        </div>
                        <div className="text-xs shrink-0" style={{ color: C.dim }}>{fmtShort(r.date)}</div>
                      </div>
                    );
                  })
                )}
              </Card>
            )}

          </div>
        )}
      </div>

      {/* ————— Toast sauvegarde ————— */}
      {etatCopie && (
        <div
          className="fixed left-1/2 z-40 px-4 py-2 rounded-full text-xs font-bold text-center"
          style={{ bottom: "8rem", transform: "translateX(-50%)", background: C.card2, border: `1px solid ${C.yellow}`, color: C.yellowDim, maxWidth: "90%" }}
        >
          📋 État copié, séance comprise — colle-le dans Importer si l'app se recharge
        </div>
      )}
      {finJsonCopie && (
        <div
          className="fixed left-1/2 z-40 px-4 py-2 rounded-full text-xs font-bold text-center"
          style={{ bottom: "8rem", transform: "translateX(-50%)", background: C.card2, border: `1px solid ${C.yellow}`, color: C.yellowDim, maxWidth: "90%" }}
        >
          📋 JSON de la séance copié — colle-le à Claude pour la sauvegarde
        </div>
      )}
      {savedFlash && (
        <div
          className="fixed left-1/2 z-40 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ bottom: "5.5rem", transform: "translateX(-50%)", background: C.card2, border: `1px solid ${C.green}`, color: C.green }}
        >
          ✓ Enregistré
        </div>
      )}

      {/* ————— Photo plein écran ————— */}
      {photoView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(5,5,7,0.96)" }}
          onClick={() => setPhotoView(null)}
        >
          <img src={photoView} alt="Machine" className="max-w-full max-h-full rounded-2xl" />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: C.card2, color: C.text }}
            onClick={() => setPhotoView(null)}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ————— Fiche exercice ————— */}
      {ficheExo && (() => {
        const nom = ficheExo;
        const hist = [];
        data.seances.forEach((s) => s.exos.forEach((e) => {
          if (e.nom.toLowerCase() === nom.toLowerCase()) hist.push({ date: s.date, e });
        }));
        const cardio = hist.length > 0 && hist[hist.length - 1].e.type === "cardio";
        const rec = mursRecords.find((r) => r.nom.toLowerCase() === nom.toLowerCase());
        const rp = cardio ? null : repereFor(nom, poidsCorps);
        const niv = rp && rec ? niveauPour(rec.parBras ? rec.poids * 2 : rec.poids, rp.paliers) : null;
        const sg = suggestionFor(nom);
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: C.bg }}>
            <div className="max-w-md mx-auto px-4" style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))", paddingBottom: "2rem" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="text-xl leading-tight font-bold pr-3">{nom}</div>
                <button
                  onClick={() => setFicheExo(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: C.card2, color: C.text }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs" style={{ color: C.dim }}>{cardio ? "Dernière séance" : "Record"}</div>
                      <div className="text-2xl" style={{ ...DISPLAY, ...NUMS, color: C.yellowDim }}>
                        {cardio
                          ? `${hist[hist.length - 1].e.dureeCardio} min`
                          : rec ? `${fmtKg(rec.poids)} kg${rec.parBras ? "/bras" : ""}` : "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs" style={{ color: C.dim }}>{hist.length} fois</div>
                      {niv && <div className="text-sm font-black" style={{ color: niv.color }}>{niv.label}</div>}
                    </div>
                  </div>
                  {sg && !cardio && (
                    <div className="text-xs mt-2" style={{ ...NUMS, color: sg.monte ? C.yellowDim : C.dim }}>
                      {sg.monte ? `Prochaine fois : vise ${fmtKg(sg.cible)} kg` : `Prochaine fois : reste à ${fmtKg(sg.cible)} kg`}
                    </div>
                  )}
                </Card>

                {rp && (
                  <Card>
                    <div className="text-xs font-bold mb-2">Repères · {fmtKg(poidsCorps)} kg de corps</div>
                    <div className="flex justify-between text-xs" style={{ color: C.dim, ...NUMS }}>
                      <span>déb {fmtKg(rp.paliers[0])}</span>
                      <span>nov {fmtKg(rp.paliers[1])}</span>
                      <span>int {fmtKg(rp.paliers[2])}</span>
                      <span>av {fmtKg(rp.paliers[3])}</span>
                    </div>
                  </Card>
                )}

                {!cardio && (
                  <Card>
                    <SchemaMouvement nom={nom} />
                    <div className="text-xs mt-1 mb-2 text-center" style={{ color: C.dim }}>
                      trait plein = départ · pointillés = arrivée
                    </div>
                    {(TECHNIQUE[mouvementOf(nom)] || TECHNIQUE.generique).map((t, i) => (
                      <div key={i} className="text-xs leading-relaxed" style={{ color: C.text }}>
                        <span style={{ color: C.yellowDim }}>·</span> {t}
                      </div>
                    ))}
                  </Card>
                )}

                <Card>
                  <div className="text-xs font-bold mb-1">Historique</div>
                  {hist.length === 0 ? (
                    <div className="text-sm py-3 text-center" style={{ color: C.dim }}>Jamais fait pour l'instant.</div>
                  ) : (
                    [...hist].reverse().map(({ date, e }, i) => (
                      <div key={i} className="flex items-center gap-2 py-2" style={{ borderBottom: `1px solid ${C.line}` }}>
                        <div className="text-xs w-12 shrink-0" style={{ color: C.dim }}>{fmtShort(date)}</div>
                        <div className="text-sm flex-1" style={NUMS}>
                          <Dot ressenti={e.ressenti} />
                          {e.type === "cardio"
                            ? `${e.dureeCardio} min${e.distance ? ` · ${fmtKg(e.distance)} km` : ""}`
                            : `${e.series}×${e.reps} @ ${fmtKg(e.poids)} kg${e.parBras ? "/bras" : ""}`}
                        </div>
                        {e.pr && <PrBadge />}
                      </div>
                    ))
                  )}
                </Card>

                <button
                  onClick={() => {
                    const nv = window.prompt("Nouveau nom — si le nom existe déjà, les deux exercices fusionnent.", nom);
                    if (nv && nv.trim() && nv.trim().toLowerCase() !== nom.toLowerCase()) {
                      renommerExo(nom, nv.trim());
                      setFicheExo(nv.trim());
                    }
                  }}
                  className="w-full rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.text }}
                >
                  <Pencil size={14} /> Renommer / fusionner
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ————— Mode exercice plein écran ————— */}
      {ec && focusOuvert && (() => {
        const left = rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : 0;
        const frac = rest && rest.total > 0 ? left / rest.total : 0;
        const R = 92, circ = 2 * Math.PI * R;
        const enRepos = !!rest && left > 0;
        return (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#faf8f2" }}>
            <div className="max-w-md mx-auto w-full flex flex-col h-full px-5" style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))", paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>

              <div className="flex items-center justify-between mb-1">
                <div className="min-w-0">
                  <div className="text-lg font-bold truncate">{ec.nom}</div>
                  <div className="text-sm" style={{ color: C.dim }}>
                    Série <b style={{ color: C.text }}>{Math.min(ec.sets.length + 1, ec.prevu || ec.sets.length + 1)}/{ec.prevu || "?"}</b>
                    {ec.parBras ? " · par bras" : ""} · repos {fmtRepos(ec.reposSec)}
                  </div>
                </div>
                <button
                  onClick={() => setFocusOuvert(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold shrink-0 ml-2"
                  style={{ background: C.card2, color: C.dim, border: `1px solid ${C.line}` }}
                >
                  Réduire
                </button>
              </div>

              {ec.sets.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 mb-1" style={{ scrollbarWidth: "none" }}>
                  {ec.sets.map((s, i) => (
                    <div
                      key={i}
                      className="px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap"
                      style={{ background: C.card2, border: `1px solid ${C.line}`, color: C.dim, ...NUMS }}
                    >
                      {i + 1}· {fmtKg(s.poids)}×{s.reps}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex-1 flex flex-col items-center justify-center">
                <div className={"relative flex items-center justify-center" + (enRepos ? "" : " pl-go")} style={{ width: 220, height: 220 }}>
                  <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="110" cy="110" r={R} fill="none" stroke={C.line} strokeWidth="9" />
                    <circle
                      cx="110" cy="110" r={R} fill="none"
                      stroke={enRepos ? C.yellow : C.green} strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={circ}
                      strokeDashoffset={enRepos ? circ * (1 - frac) : 0}
                      style={{ transition: "stroke-dashoffset 0.3s linear" }}
                    />
                  </svg>
                  <div className="absolute text-center">
                    {enRepos ? (
                      <>
                        <div style={{ ...DISPLAY, ...NUMS, fontSize: 60, lineHeight: 1 }}>
                          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
                        </div>
                        <div className="text-xs mt-1 uppercase tracking-widest" style={{ color: C.dim }}>repos</div>
                      </>
                    ) : (
                      <>
                        <div style={{ ...DISPLAY, fontSize: 46, lineHeight: 1, color: C.green }}>À TOI</div>
                        <div className="text-sm mt-1" style={{ color: C.dim }}>
                          série {ec.sets.length + 1}{ec.prevu ? ` / ${ec.prevu}` : ""}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {enRepos && (
                  <div className="flex gap-3 mt-5 w-full">
                    <button
                      onClick={() => setRest({ ...rest, endsAt: Math.max(Date.now(), rest.endsAt - 30000), total: Math.max(30, rest.total - 30) })}
                      className="flex-1 rounded-2xl py-5 text-lg font-black"
                      style={{ background: C.card2, color: C.text, border: `1px solid ${C.line}` }}
                    >
                      −30 s
                    </button>
                    <button
                      onClick={() => setRest({ ...rest, endsAt: rest.endsAt + 30000, total: rest.total + 30 })}
                      className="flex-1 rounded-2xl py-5 text-lg font-black"
                      style={{ background: C.card2, color: C.text, border: `1px solid ${C.line}` }}
                    >
                      +30 s
                    </button>
                    <button
                      onClick={() => { setRest(null); beepedRef.current = false; }}
                      className="flex-1 rounded-2xl py-5 text-lg font-black"
                      style={{ background: C.yellow, color: "#111" }}
                    >
                      Passer
                    </button>
                  </div>
                )}
              </div>

              <div className="text-xs mb-1.5 font-semibold" style={{ color: C.dim }}>Poids (kg)</div>
              <PoidsInput value={ecPoids} onChange={setEcPoids} />
              <div className="flex gap-3 mt-3 mb-3">
                <Stepper label="Reps" value={ecReps} onChange={setEcReps} max={50} />
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setRessentiEc("marge")}
                  className="pl-tap flex-1 rounded-2xl py-3.5 font-bold"
                  style={{
                    background: ec.ressenti === "marge" ? C.green : C.card2,
                    color: ec.ressenti === "marge" ? "#111" : C.text,
                    border: `1px solid ${ec.ressenti === "marge" ? C.green : C.line}`,
                  }}
                >
                  De la marge
                </button>
                <button
                  onClick={() => setRessentiEc("tirait")}
                  className="pl-tap flex-1 rounded-2xl py-3.5 font-bold"
                  style={{
                    background: ec.ressenti === "tirait" ? C.red : C.card2,
                    color: ec.ressenti === "tirait" ? "#111" : C.text,
                    border: `1px solid ${ec.ressenti === "tirait" ? C.red : C.line}`,
                  }}
                >
                  Ça tirait
                </button>
              </div>

              {(() => {
                const n = ec.sets.length + 1;
                const derniere = ec.prevu && n >= ec.prevu;
                return (
                  <>
                    <button
                      onClick={validerSerie}
                      className="w-full rounded-2xl py-5 text-xl font-black flex items-center justify-center gap-2"
                      style={{ background: derniere ? C.green : C.yellow, color: "#111" }}
                    >
                      <Check size={22} /> {derniere ? `Dernière série (${n}/${ec.prevu}) → fin` : `Série ${n}${ec.prevu ? "/" + ec.prevu : ""} faite`}
                    </button>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={ajouterSeriePrevue}
                        className="pl-tap flex-1 rounded-2xl py-3.5 font-bold"
                        style={{ background: C.card2, color: C.text, border: `1px solid ${C.line}` }}
                      >
                        + 1 série
                      </button>
                      {!derniere && (
                        <button
                          onClick={finirSerieEtExo}
                          className="pl-tap flex-1 rounded-2xl py-3.5 font-bold"
                          style={{ background: C.text, color: C.card }}
                        >
                          Stop après celle-ci
                        </button>
                      )}
                      <button
                        onClick={finirExo}
                        className="px-4 rounded-xl font-semibold text-xs"
                        style={{ background: C.card2, color: C.dim, border: `1px solid ${C.line}` }}
                      >
                        Finir sans<br />ajouter
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* ————— Chrono plein écran ————— */}
      {rest && !(ec && focusOuvert) && (() => {
        const left = Math.max(0, Math.ceil((rest.endsAt - now) / 1000));
        const frac = rest.total > 0 ? left / rest.total : 0;
        const R = 118, circ = 2 * Math.PI * R;
        const done = left === 0;
        const relancer = (sec) => { beepedRef.current = false; setRest({ endsAt: Date.now() + sec * 1000, total: sec }); };
        const fermer = () => { setRest(null); beepedRef.current = false; };
        return (
          <div
            className={"fixed inset-0 z-50 flex flex-col" + (done ? " pl-flash" : "")}
            style={{ background: done ? "#eafbf1" : "#faf8f2" }}
          >
            <div
              className="max-w-md mx-auto w-full flex flex-col h-full px-5"
              style={{ paddingTop: "calc(1.2rem + env(safe-area-inset-top))", paddingBottom: "calc(1.2rem + env(safe-area-inset-bottom))" }}
            >
              {/* Où j'en suis */}
              <div className="text-center">
                <div className="text-base font-black uppercase tracking-widest" style={{ color: done ? C.green : C.yellowDim }}>
                  {done ? "Go — à toi !" : "Repos"}
                </div>
                {ec ? (
                  <div className="text-lg font-bold mt-1 truncate">{ec.nom}</div>
                ) : current ? (
                  <div className="text-lg font-bold mt-1 truncate">{current.nom}</div>
                ) : null}
                {ec ? (
                  <div className="text-base mt-0.5" style={{ color: C.dim }}>
                    Série {ec.sets.length}{ec.prevu ? `/${ec.prevu}` : ""} faite · prochaine : n°{ec.sets.length + 1}
                  </div>
                ) : current && current.exos.length > 0 ? (
                  <div className="text-base mt-0.5" style={{ color: C.green }}>
                    {current.exos[current.exos.length - 1].nom} terminé ({current.exos[current.exos.length - 1].series} séries)
                  </div>
                ) : null}
              </div>

              {/* Le compteur */}
              <div className="flex-1 flex items-center justify-center">
                <div className={"relative flex items-center justify-center" + (done ? " pl-go" : "")} style={{ width: 280, height: 280 }}>
                  <svg width="280" height="280" viewBox="0 0 280 280" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="140" cy="140" r={R} fill="none" stroke={C.line} strokeWidth="14" />
                    <circle
                      cx="140" cy="140" r={R} fill="none"
                      stroke={done ? C.green : C.yellow} strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={circ}
                      strokeDashoffset={done ? 0 : circ * (1 - frac)}
                      style={{ transition: "stroke-dashoffset 0.3s linear" }}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <div style={{ ...DISPLAY, ...NUMS, fontSize: done ? 86 : 92, lineHeight: 1, color: done ? C.green : C.text }}>
                      {done ? "GO" : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}
                    </div>
                    {!done && (
                      <div className="text-sm mt-2" style={{ color: C.dim, ...NUMS }}>
                        sur {fmtRepos(rest.total)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Commandes — grosses et en bas, à portée de pouce */}
              {done ? (
                <>
                  <button
                    onClick={fermer}
                    className="w-full rounded-2xl py-6 text-2xl font-black"
                    style={{ background: C.green, color: "#0c1a10" }}
                  >
                    Je repars
                  </button>
                  <button
                    onClick={() => relancer(rest.total)}
                    className="w-full rounded-2xl py-4 text-base font-bold mt-3"
                    style={{ background: C.card2, color: C.text, border: `1px solid ${C.line}` }}
                  >
                    Encore {fmtRepos(rest.total)} de repos
                  </button>
                </>
              ) : (
                <>
                  <div className="flex gap-3 mb-3">
                    <button
                      onClick={() => setRest({ ...rest, endsAt: Math.max(Date.now(), rest.endsAt - 30000), total: Math.max(30, rest.total - 30) })}
                      className="flex-1 rounded-2xl py-5 text-xl font-black"
                      style={{ background: C.card2, color: C.text, border: `1px solid ${C.line}` }}
                    >
                      −30 s
                    </button>
                    <button
                      onClick={() => setRest({ ...rest, endsAt: rest.endsAt + 30000, total: rest.total + 30 })}
                      className="flex-1 rounded-2xl py-5 text-xl font-black"
                      style={{ background: C.card2, color: C.text, border: `1px solid ${C.line}` }}
                    >
                      +30 s
                    </button>
                  </div>
                  <button
                    onClick={fermer}
                    className="w-full rounded-2xl py-6 text-2xl font-black"
                    style={{ background: C.yellow, color: "#111" }}
                  >
                    Passer le repos
                  </button>
                  <button
                    onClick={() => relancer(rest.total)}
                    className="w-full rounded-2xl py-4 text-base font-bold mt-3"
                    style={{ background: C.card2, color: C.dim, border: `1px solid ${C.line}` }}
                  >
                    Relancer à zéro
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ————— Onboarding (premier lancement) ————— */}
      {loaded && !data.onboarded && data.seances.length === 0 && !current && !bilanSeance && (
        <div
          className="fixed inset-0 z-50 flex flex-col px-6 overflow-y-auto"
          style={{ background: "radial-gradient(72% 45% at 50% 10%, rgba(245,197,24,.14), transparent 70%), #faf8f2", paddingTop: "calc(env(safe-area-inset-top) + 3rem)", paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)" }}
        >
          <div className="mx-auto w-full flex flex-col flex-1" style={{ maxWidth: 400 }}>
            <div className="leading-none" style={{ ...DISPLAY, fontSize: 48, color: C.text }}>PLATEAU<span style={{ color: C.yellowDim }}>.</span></div>
            <div className="text-sm mt-2" style={{ color: C.dim }}>Ton carnet de muscu — pensé pour la salle, pour de vrai.</div>
            <div className="flex flex-col gap-3.5 mt-8">
              {[["🏋️", "Chaque séance loggée", "Charges, séries, repos, ressenti — en 2 taps."], ["📈", "Records & progression", "1RM, plateaux détectés, tonnage, courbes."], ["📷", "Retrouve ta machine", "Photo perso + vidéo technique pour chaque exo."]].map(([e, t, s], i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ background: C.card, border: `1px solid ${C.hair}` }}>{e}</div>
                  <div><div className="text-sm font-bold">{t}</div><div className="text-xs mt-0.5" style={{ color: C.dim }}>{s}</div></div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <div className="text-xs font-extrabold tracking-widest uppercase mb-2" style={{ color: C.dim }}>Ton objectif par semaine ?</div>
              <div className="flex gap-2">
                {[2, 3, 4, 5].map((n) => <Chip key={n} active={onbGoal === n} onClick={() => setOnbGoal(n)}>{n} séances</Chip>)}
              </div>
            </div>
            <div className="flex-1" style={{ minHeight: 24 }} />
            <button
              onClick={() => { saveData({ ...data, onboarded: true, objSeancesSemaine: onbGoal }); setTab("accueil"); setShowStart(true); }}
              className="pl-tap w-full rounded-2xl py-4 font-black mt-8"
              style={{ background: C.yellow, color: "#111" }}
            >
              C'est parti 💪
            </button>
            <button
              onClick={() => saveData({ ...data, onboarded: true, objSeancesSemaine: onbGoal })}
              className="pl-tap text-xs font-semibold mt-3 mx-auto"
              style={{ color: C.dim }}
            >
              Explorer d'abord
            </button>
          </div>
        </div>
      )}

      {/* ————— Fin de séance fêtée ————— */}
      {bilanSeance && (() => {
        const s = bilanSeance;
        const nbSeries = s.exos.reduce((a, e) => a + (e.type === "cardio" ? 0 : (e.series || 0)), 0);
        const tonnage = tonnageSeance(s);
        const prs = s.exos.filter((e) => e.pr);
        const tuiles = [[fmtDuree(s.duree) || "—", "durée"], [String(nbSeries), "séries"], [`${tonnage.toLocaleString("fr-FR")}`, "kg soulevés"]];
        return (
          <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center overflow-y-auto"
            style={{ background: "radial-gradient(62% 46% at 50% 28%, rgba(245,197,24,.13), transparent 70%), #fdfbf5", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {prs.length > 0 && <Confetti />}
            <div className="pl-atoi" style={{ fontSize: 52, lineHeight: 1 }}>💪</div>
            <div className="text-xs font-extrabold tracking-widest uppercase mt-3" style={{ color: C.yellowDim }}>Séance terminée</div>
            <div className="leading-none mt-1 mb-6" style={{ ...DISPLAY, color: C.text, fontSize: 40 }}>{s.nom.toUpperCase()}</div>
            <div className="grid grid-cols-3 gap-3 w-full" style={{ maxWidth: 340 }}>
              {tuiles.map(([v, k], i) => (
                <div key={i} className="rounded-2xl py-3 px-1" style={{ background: C.card, border: `1px solid ${C.hair}` }}>
                  <div className="text-lg" style={{ ...DISPLAY, ...NUMS, color: C.yellowDim }}>{v}</div>
                  <div className="text-xs mt-1" style={{ color: C.dim }}>{k}</div>
                </div>
              ))}
            </div>
            {prs.length > 0 && (
              <div className="mt-4 w-full rounded-2xl p-3" style={{ maxWidth: 340, background: "linear-gradient(180deg, rgba(245,197,24,.15), rgba(245,197,24,.04))", border: "1px solid rgba(245,197,24,.32)" }}>
                <div className="flex items-center justify-center gap-1.5 text-xs font-black" style={{ color: C.yellowDim }}>
                  <Trophy size={13} /> {prs.length} nouveau{prs.length > 1 ? "x" : ""} record{prs.length > 1 ? "s" : ""} !
                </div>
                <div className="text-xs mt-1 leading-relaxed" style={{ ...NUMS, color: C.text }}>
                  {prs.map((e) => `${e.nom} ${fmtKg(e.poids)} kg`).join(" · ")}
                </div>
              </div>
            )}
            <button
              onClick={() => setBilanSeance(null)}
              className="pl-tap mt-7 w-full rounded-2xl py-4 font-black"
              style={{ maxWidth: 340, background: C.yellow, color: "#111" }}
            >
              Terminé
            </button>
            <div className="text-xs mt-3 flex items-center gap-1.5" style={{ color: C.dim }}><ShowerHead size={13} /> Pense à la douche</div>
          </div>
        );
      })()}

      {/* ————— Nav basse ————— */}
      <div className="pl-tabbar">
        <div className="pl-tabbar-in">
          {[
            { id: "accueil", label: "Accueil", Icon: Home },
            { id: "seance", label: "Séance", Icon: Dumbbell },
            { id: "recup", label: "Récup", Icon: Moon },
            { id: "historique", label: "Histo", Icon: HistoryIcon },
            { id: "progression", label: "Progrès", Icon: TrendingUp },
          ].map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={"pl-tab pl-tap" + (tab === id ? " on" : "")}>
              <Icon size={19} style={{ opacity: tab === id ? 1 : 0.6 }} />
              <span className="font-semibold" style={{ color: tab === id ? C.text : C.dim, fontSize: 10 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
