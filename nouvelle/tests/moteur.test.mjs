// Tests du moteur de la nouvelle app. Usage : node tests/moteur.test.mjs
import fs from "fs";
import vm from "vm";
import path from "path";
import { fileURLToPath } from "url";

const ici = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(ici, "..", "src", "moteur.js"), "utf8");
const EXPORTS = ["lireDonnees", "lireEnCours", "consigne", "texteDerniereFois", "e1RMDe", "repsUtiles", "resumeSeries",
  "exoTermine", "seanceTerminee", "seanceDuJour", "planDe", "nomCanonique", "nomsExos", "dernierExo", "nomsSeances",
  "rappelSauvegarde", "lireSauvegarde", "chiffrerTexte", "dechiffrerTexte", "fmtKg", "lireNombre", "joursEntre", "fmtChrono", "meilleureSerie"];
const ctx = vm.createContext({ crypto: globalThis.crypto, TextEncoder, TextDecoder, atob, btoa, console });
const M = vm.runInContext(src + "\n;({" + EXPORTS.join(",") + "})", ctx);

let ok = 0, ko = 0;
const eq = (nom, reel, attendu) => {
  const a = JSON.stringify(reel), b = JSON.stringify(attendu);
  if (a === b) ok++; else { ko++; console.log("  ÉCHEC " + nom + "\n     attendu " + b + "\n     obtenu  " + a); }
};
const vrai = (nom, cond) => { if (cond) ok++; else { ko++; console.log("  ÉCHEC " + nom); } };
const section = (t) => console.log("— " + t);

section("lecture sûre des données");
eq("rien en stock -> vide", M.lireDonnees(null).etat, "vide");
eq("JSON tronqué -> abîmé", M.lireDonnees('{"seances":[{"date":"2026').etat, "abime");
eq("null -> abîmé", M.lireDonnees("null").etat, "abime");
eq("tableau -> abîmé", M.lireDonnees("[1,2]").etat, "abime");
eq("objet sans séances -> abîmé", M.lireDonnees('{"poids":[]}').etat, "abime");
const lu = M.lireDonnees(JSON.stringify({ seances: [{ date: "2026-09-01", nom: "Pull" }], poids: [{ kg: 63 }], jours: { a: 1 } }));
eq("séance sans exos -> exos []", lu.data.seances[0].exos, []);
eq("clés inconnues conservées", [lu.data.poids, lu.data.jours], [[{ kg: 63 }], { a: 1 }]);
eq("en cours illisible -> null", M.lireEnCours("{oups"), null);
eq("en cours sans startedAt -> null", M.lireEnCours('{"exos":[]}'), null);

section("consigne de progression");
eq("première fois", M.consigne(null).texte, "Première fois : choisis ta charge");
const c12 = M.consigne({ poids: 40, reps: 12, series: 4, sets: [{ poids: 40, reps: 12 }] });
eq("12 reps -> on monte", [c12.poids, c12.reps, c12.monte, c12.texte], [42.5, 8, true, "Monte à 42,5 kg, repars à 8 reps"]);
const c10 = M.consigne({ poids: 40, reps: 10, series: 4 });
eq("10 reps -> une de plus", [c10.poids, c10.reps, c10.texte], [40, 11, "Garde 40 kg, vise 11 reps"]);
const c6 = M.consigne({ poids: 40, reps: 6, series: 4 });
eq("6 reps -> remonter à 8", [c6.poids, c6.reps], [40, 8]);
eq("marge -> on monte même à 9 reps", M.consigne({ poids: 40, reps: 9, ressenti: "marge" }).monte, true);
eq("petits haltères par bras : +2 kg", M.consigne({ poids: 10, reps: 12, parBras: true }).poids, 12);
eq("séries et repos repris", [c10.series, c10.repos], [4, 90]);
eq("série la plus lourde décide", M.consigne({ poids: 45, sets: [{ poids: 35, reps: 12 }, { poids: 45, reps: 7 }] }).reps, 8);
eq("texte dernière fois", M.texteDerniereFois({ poids: 40, sets: [{ poids: 40, reps: 12 }, { poids: 40, reps: 12 }] }), "La dernière fois : 2 × 12 à 40 kg");
eq("texte dégressif", M.texteDerniereFois({ poids: 40, sets: [{ poids: 40, reps: 12 }, { poids: 40, reps: 10 }] }), "La dernière fois : 12-10 à 40 kg");

section("records");
const hist = { seances: [{ date: "2026-09-01", nom: "Pull", exos: [{ nom: "Tirage vertical", poids: 40, reps: 8, series: 3, sets: [{ poids: 40, reps: 8 }] }] }] };
const plusDeReps = M.exoTermine(hist, { nom: "Tirage vertical", sets: [{ poids: 40, reps: 11 }] }, 0, 600000);
eq("plus de reps à charge égale = record", plusDeReps.pr, true);
const pareil = M.exoTermine(hist, { nom: "Tirage vertical", sets: [{ poids: 40, reps: 8 }] }, 0, 600000);
eq("même perf = pas de record", pareil.pr, false);
eq("plus lourd = record", M.exoTermine(hist, { nom: "tirage  vertical", sets: [{ poids: 42.5, reps: 6 }] }, 0, 600000).pr, true);
eq("première fois = pas de record", M.exoTermine(hist, { nom: "Curl", sets: [{ poids: 10, reps: 10 }] }, 0, 600000).pr, false);

eq("meilleure série : la plus lourde", M.meilleureSerie({ sets: [{ poids: 40, reps: 12 }, { poids: 42.5, reps: 6 }, { poids: 42.5, reps: 9 }] }), { poids: 42.5, reps: 9 });
eq("meilleure série sans détail", M.meilleureSerie({ poids: 40, reps: 10 }), { poids: 40, reps: 10 });

section("format compatible avec l'ancienne app");
const ex = M.exoTermine(hist, { id: "x1", nom: "Rowing", reposSec: 120, sets: [{ poids: "30", reps: 10 }, { poids: 32.5, reps: 8 }] }, 0, 180000);
eq("champs de l'exo", Object.keys(ex).sort(), ["at", "coach", "dureeMin", "id", "nom", "note", "parBras", "photoId", "poids", "pr", "reposSec", "reps", "ressenti", "series", "sets"]);
eq("valeurs de l'exo", [ex.poids, ex.series, ex.reps, ex.reposSec, ex.dureeMin, ex.sets[0].poids], [32.5, 2, 10, 120, 3, 30]);
eq("note série par série", ex.note, "série par série : 30 kg ×10, 32,5 kg ×8");
const sc = M.seanceTerminee({ nom: "Pull", startedAt: 0, exos: [ex], gourdes: 0 }, 52 * 60000, "2026-09-13");
eq("champs de la séance", Object.keys(sc).sort(), ["bilan", "date", "duree", "exos", "gourdes", "id", "nom", "note"]);
eq("durée en minutes", sc.duree, 52);

section("séance du jour");
const d3 = { seances: [
  { date: "2026-09-01", nom: "Push", exos: [] },
  { date: "2026-09-03", nom: "Pull", exos: [] },
  { date: "2026-09-05", nom: "Jambes", exos: [] },
  { date: "2026-09-08", nom: "Push", exos: [] },
] };
eq("la moins récente, pas la dernière", M.seanceDuJour(d3, "2026-09-13").nom, "Pull");
eq("depuis combien de jours", M.seanceDuJour(d3, "2026-09-13").depuis, 10);
eq("déjà faite aujourd'hui", M.seanceDuJour(d3, "2026-09-08").etat, "faite");
eq("aucune séance", M.seanceDuJour({ seances: [] }, "2026-09-13").etat, "premiere");
eq("un seul nom -> on le repropose", M.seanceDuJour({ seances: [{ date: "2026-09-01", nom: "Full", exos: [] }] }, "2026-09-13").nom, "Full");
eq("noms de séance récents d'abord", M.nomsSeances(d3), ["Push", "Jambes", "Pull"]);

section("plan de séance");
const dp = { seances: [
  { date: "2026-09-01", nom: "Pull", exos: [{ nom: "Tirage" }, { nom: "Rameur", type: "cardio" }, { nom: "Curl" }] },
  { date: "2026-09-06", nom: "pull", exos: [{ nom: "Tirage" }, { nom: "Rowing" }, { nom: "Curl" }, { nom: "curl" }] },
] };
eq("dernière séance du même nom, sans cardio ni doublon", M.planDe(dp, { nom: "Pull", exos: [] }), ["Tirage", "Rowing", "Curl"]);
eq("sans ce qui est déjà fait", M.planDe(dp, { nom: "PULL", exos: [{ nom: "rowing" }] }), ["Tirage", "Curl"]);
eq("séance inédite -> plan vide", M.planDe(dp, { nom: "Bras", exos: [] }), []);

section("noms d'exercice");
eq("orthographe connue reprise", M.nomCanonique("  tirage   vertical ", ["Tirage vertical"]), "Tirage vertical");
eq("accents ignorés", M.nomCanonique("developpe couche", ["Développé couché"]), "Développé couché");
eq("nouveau nom propre", M.nomCanonique("écarté poulie", []), "Écarté poulie");
eq("dernier exo ignore le cardio", M.dernierExo({ seances: [{ date: "2026-09-01", exos: [{ nom: "Tapis", type: "cardio", poids: 0 }] }] }, "tapis", null), null);

section("sauvegarde");
eq("rappel si jamais sauvegardé", M.rappelSauvegarde({ seances: [{}] }, "2026-09-13"), true);
eq("pas de rappel sans séance", M.rappelSauvegarde({ seances: [] }, "2026-09-13"), false);
eq("pas de rappel à 6 jours", M.rappelSauvegarde({ seances: [{}], dernierExport: "2026-09-07" }, "2026-09-13"), false);
eq("rappel à 7 jours", M.rappelSauvegarde({ seances: [{}], dernierExport: "2026-09-06" }, "2026-09-13"), true);
eq("fichier non-JSON refusé", !!M.lireSauvegarde("pas du json").erreur, true);
eq("fichier sans séances refusé", !!M.lireSauvegarde('{"a":1}').erreur, true);
const imp = M.lireSauvegarde(JSON.stringify({ seances: [], enCours: { startedAt: 1, exos: [] } }));
eq("séance en cours extraite de l'import", [imp.enCours.startedAt, "enCours" in imp.data], [1, false]);
const chiffre = await M.chiffrerTexte('{"seances":[]}', "motdepasse");
eq("fichier chiffré reconnu", M.lireSauvegarde(chiffre).chiffre, true);
eq("aller-retour chiffrement", await M.dechiffrerTexte(chiffre, "motdepasse"), '{"seances":[]}');
let refuse = false;
try { await M.dechiffrerTexte(chiffre, "mauvais"); } catch (e) { refuse = true; }
eq("mauvais mot de passe refusé", refuse, true);

section("formats");
eq("virgule française", [M.fmtKg(42.5), M.fmtKg(40), M.lireNombre("42,5"), isNaN(M.lireNombre("abc"))], ["42,5", "40", 42.5, true]);
eq("chrono", [M.fmtChrono(72), M.fmtChrono(5)], ["1:12", "0:05"]);

console.log("");
console.log(ko === 0 ? `MOTEUR : ${ok} tests OK` : `MOTEUR : ${ko} ÉCHEC(S) sur ${ok + ko}`);
process.exit(ko === 0 ? 0 : 1);
