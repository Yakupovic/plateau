// ═══════════════════════════════════════════════════════════════════
// PLATEAU — interface « Silence ».
// Un seul parcours : démarrer, faire ses séries, se reposer, finir.
// Toute la logique est dans moteur.js ; ici on affiche et on enregistre.
// ═══════════════════════════════════════════════════════════════════

const { useState, useEffect, useRef } = React;

const T = {
  fond: "#f3f1ec", encre: "#1b1a18", gris: "#666159", trait: "#dfdbd3",
  bord: "#cfcac1", accent: "#a8431b", blanc: "#ffffff", erreur: "#a82a20",
};
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

// ————— Stockage —————
const lire = (cle) => { try { return localStorage.getItem(cle); } catch (e) { return null; } };
const ecrire = (cle, valeur) => {
  try {
    if (valeur == null) localStorage.removeItem(cle); else localStorage.setItem(cle, valeur);
    return true;
  } catch (e) { return false; }
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
    if (!cle) { cle = "pl:plateau-data-abime-" + Date.now(); ecrire(cle, brut); }
    return { abime: { cle: cle, taille: brut.length, debut: brut.slice(0, 300) }, data: null, enCours: null };
  }
  if (lu.etat === "vide") ecrire(CLE_DATA, JSON.stringify(lu.data));
  return { abime: null, data: lu.data, enCours: lireEnCours(lire(CLE_EN_COURS)) };
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
    [0, 0.22].forEach((t) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t + 0.16);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.18);
    });
  } catch (e) {}
};

const dateLongue = (iso) => {
  const t = new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const dateCourte = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

// ————— Petits éléments —————
function Ecran({ children, style }) {
  return <div className="ecran" style={style}>{children}</div>;
}
function Etiquette({ children, style }) {
  return <div style={Object.assign({ fontFamily: MONO, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: T.gris }, style)}>{children}</div>;
}
function Bouton({ children, onClick, variante, disabled, style, label }) {
  const plein = variante !== "contour" && variante !== "texte";
  const base = {
    minHeight: variante === "texte" ? 48 : 64, width: "100%", borderRadius: 14, fontSize: variante === "texte" ? 16 : 19,
    fontWeight: variante === "texte" ? 500 : 600, fontFamily: "inherit", cursor: disabled ? "default" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px",
    background: plein ? T.encre : "transparent", color: plein ? T.blanc : variante === "texte" ? T.gris : T.encre,
    border: variante === "contour" ? `1px solid ${T.bord}` : "none", opacity: disabled ? 0.4 : 1,
  };
  return <button type="button" aria-label={label} disabled={disabled} onClick={onClick} style={Object.assign(base, style)}>{children}</button>;
}
function Entete({ gauche, droite, onDroite }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 44 }}>
      <div style={{ fontFamily: MONO, fontSize: 14, color: T.gris }}>{gauche}</div>
      {droite && <button type="button" onClick={onDroite} style={{ minHeight: 44, minWidth: 44, padding: "0 0 0 16px", fontSize: 16, fontWeight: 500, color: T.encre, background: "none", border: "none", fontFamily: "inherit" }}>{droite}</button>}
    </div>
  );
}
function Retour({ onClick, titre }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, minHeight: 44 }}>
      <button type="button" aria-label="Retour" onClick={onClick} style={{ minHeight: 44, minWidth: 44, marginLeft: -12, background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.encre} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <div style={{ fontSize: 17, fontWeight: 600 }}>{titre}</div>
    </div>
  );
}
function Ligne({ titre, detail, onClick, droite }) {
  return (
    <button type="button" onClick={onClick} style={{ width: "100%", minHeight: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", background: "none", border: "none", borderBottom: `1px solid ${T.trait}`, textAlign: "left", fontFamily: "inherit", color: T.encre }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>{titre}</div>
        {detail && <div style={{ fontSize: 14, color: T.gris, marginTop: 2 }}>{detail}</div>}
      </div>
      {droite || <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.gris} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 5l7 7-7 7" /></svg>}
    </button>
  );
}
function Compteur({ valeur, onChange, unite, pas, decimal, label }) {
  const bouger = (sens) => {
    const v = lireNombre(valeur);
    const base = isNaN(v) ? 0 : v;
    const suivant = Math.max(0, Math.round((base + sens * pas) * 100) / 100);
    onChange(decimal ? fmtKg(suivant) : String(Math.round(suivant)));
  };
  const rond = { border: `1px solid ${T.bord}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <button type="button" aria-label={`Moins ${label}`} onClick={() => bouger(-1)} className="compteur-rond" style={rond}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.encre} strokeWidth="1.8" strokeLinecap="round"><path d="M5 12h14" /></svg>
      </button>
      <label style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, minWidth: 0, flex: 1 }}>
        <input
          aria-label={label}
          value={valeur}
          inputMode={decimal ? "decimal" : "numeric"}
          placeholder="—"
          onChange={(e) => onChange(e.target.value.replace(decimal ? /[^\d.,]/g : /\D/g, ""))}
          onFocus={(e) => e.target.select()}
          className="compteur-valeur"
          style={{ width: "100%", maxWidth: 170, minWidth: 0, textAlign: "right", fontFamily: MONO, fontWeight: 500, letterSpacing: "-0.03em", color: T.encre, background: "transparent", border: "none", outline: "none", padding: 0 }}
        />
        <span style={{ fontSize: 17, color: T.gris, width: 38, flexShrink: 0 }}>{unite}</span>
      </label>
      <button type="button" aria-label={`Plus ${label}`} onClick={() => bouger(1)} className="compteur-rond" style={rond}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.encre} strokeWidth="1.8" strokeLinecap="round"><path d="M5 12h14M12 5v14" /></svg>
      </button>
    </div>
  );
}

// ————— Écran de récupération —————
function Recuperation({ abime }) {
  const copier = async () => {
    try { await navigator.clipboard.writeText(lire(abime.cle) || ""); window.alert("Contenu copié."); }
    catch (e) { window.alert("Copie impossible ici."); }
  };
  const repartir = () => {
    if (!window.confirm("Repartir d'un carnet vide ?\n\nLa copie de tes anciennes données reste gardée sur le téléphone.")) return;
    if (ecrire(CLE_DATA, JSON.stringify({ seances: [] }))) window.location.reload();
    else window.alert("Écriture impossible.");
  };
  return (
    <Ecran>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
        <Etiquette>Problème de lecture</Etiquette>
        <div style={{ fontSize: 34, fontWeight: 600, lineHeight: 1.1 }}>Tes données n'ont pas pu être lues</div>
        <div style={{ fontSize: 17, lineHeight: 1.45, color: T.gris }}>
          Rien n'a été effacé. Le contenu d'origine ({abime.taille} caractères) est gardé de côté.
          Restaure ta dernière sauvegarde, ou copie le contenu et envoie-le à Claude pour le réparer.
        </div>
        <pre style={{ fontFamily: MONO, fontSize: 12, color: T.gris, whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0, padding: "12px 0", borderTop: `1px solid ${T.trait}`, borderBottom: `1px solid ${T.trait}` }}>{abime.debut}</pre>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Bouton onClick={copier}>Copier le contenu gardé</Bouton>
        <Bouton variante="texte" onClick={repartir} style={{ color: T.erreur }}>Repartir de zéro</Bouton>
      </div>
    </Ecran>
  );
}

// ═══════════════════════════════════════════════════════════════════
// La décision « données lisibles ou pas » est prise une fois, avant tout le reste.
function Racine() {
  const [depart] = useState(chargerAuDemarrage);
  return depart.abime ? <Recuperation abime={depart.abime} /> : <App depart={depart} />;
}

function App({ depart }) {
  const [data, setData] = useState(depart.data);
  const [enCours, setEnCours] = useState(depart.enCours);
  const [ecran, setEcran] = useState("accueil");
  const [detailId, setDetailId] = useState(null);
  const [bilan, setBilan] = useState(null);
  const [repos, setRepos] = useState(null);           // { fin, total }
  const [maintenant, setMaintenant] = useState(Date.now());
  const [poids, setPoids] = useState("");
  const [reps, setReps] = useState("10");
  const [formPour, setFormPour] = useState(null);     // id de l'exo auquel le formulaire correspond
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
  const sauverData = (next) => {
    const ok = ecrire(CLE_DATA, JSON.stringify(next));
    setAlerteStockage(!ok);
    if (ok) setData(next);
    return ok;
  };
  const sauverEnCours = (cur) => {
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
      navigator.wakeLock.request("screen").then((v) => { verrou.current = v; }).catch(() => {});
    };
    demander();
    document.addEventListener("visibilitychange", demander);
    return () => {
      actif = false;
      document.removeEventListener("visibilitychange", demander);
      if (verrou.current) { verrou.current.release().catch(() => {}); verrou.current = null; }
    };
  }, [!!enCours]);

  // Formulaire aligné sur l'exercice en cours (y compris après une réouverture de l'app).
  useEffect(() => {
    if (!ec || formPour === ec.id) return;
    if (ec.sets.length) {
      const der = ec.sets[ec.sets.length - 1];
      setPoids(fmtKg(der.poids)); setReps(String(der.reps));
    } else {
      const c = consigne(dernierExo(data, ec.nom, enCours));
      setPoids(c.poids == null ? "" : fmtKg(c.poids)); setReps(String(c.reps));
    }
    setFormPour(ec.id);
    setErreur(null);
  }, [ec && ec.id]);

  // ————— Actions de séance —————
  const demarrer = (nom) => {
    const propre = nomPropre(nom);
    if (!propre) return;
    deverrouillerSon();
    const connu = nomsSeances(data).find((n) => cleNom(n) === cleNom(propre));
    sauverEnCours({ startedAt: Date.now(), nom: connu || propre, gourdes: 0, exos: [], exoEnCours: null, note: "", template: null });
    setNomSeance(""); setBilan(null); setEcran("accueil");
  };

  const commencerExo = (nomSaisi) => {
    if (!nomSaisi || !nomSaisi.trim()) return;
    deverrouillerSon();
    const nom = nomCanonique(nomSaisi, nomsExos(data, enCours));
    const der = dernierExo(data, nom, enCours);
    const c = consigne(der);
    sauverEnCours(Object.assign({}, enCours, {
      exoEnCours: { id: uid(), nom: nom, parBras: der ? !!der.parBras : false, reposSec: c.repos, photoId: null, ressenti: null, prevu: c.series, sets: [] },
    }));
    setSaisie("");
  };

  const terminerExo = (exoCourant, base) => {
    const cur = base || enCours;
    if (!exoCourant.sets.length) return Object.assign({}, cur, { exoEnCours: null });
    const debut = cur.exos.length ? cur.exos[cur.exos.length - 1].at || cur.startedAt : cur.startedAt;
    const exo = exoTermine(data, exoCourant, debut, Date.now());
    return Object.assign({}, cur, { exos: cur.exos.concat([exo]), exoEnCours: null });
  };

  const validerSerie = () => {
    const p = lireNombre(poids), r = parseInt(reps, 10);
    if (isNaN(p)) { setErreur("Indique la charge."); return; }
    if (!(r >= 1)) { setErreur("Indique le nombre de reps."); return; }
    setErreur(null);
    deverrouillerSon();
    const nx = Object.assign({}, ec, { sets: ec.sets.concat([{ poids: p, reps: r }]) });
    const cur = nx.sets.length >= (nx.prevu || SERIES_DEFAUT)
      ? terminerExo(nx, Object.assign({}, enCours, { exoEnCours: nx }))
      : Object.assign({}, enCours, { exoEnCours: nx });
    sauverEnCours(cur);
    bipFait.current = false;
    setRepos({ fin: Date.now() + (nx.reposSec || REPOS_DEFAUT) * 1000, total: nx.reposSec || REPOS_DEFAUT });
  };

  const serieDePlus = () => sauverEnCours(Object.assign({}, enCours, { exoEnCours: Object.assign({}, ec, { prevu: Math.max(ec.prevu || 0, ec.sets.length) + 1 }) }));
  const retirerSerie = () => sauverEnCours(Object.assign({}, enCours, { exoEnCours: Object.assign({}, ec, { sets: ec.sets.slice(0, -1) }) }));
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
      sauverEnCours(null); setRepos(null);
      return;
    }
    if (!window.confirm("Terminer la séance ?")) return;
    const seance = seanceTerminee(cur, Date.now(), todayISO());
    // La séance doit être écrite AVANT d'effacer la séance en cours.
    if (!sauverData(Object.assign({}, data, { seances: data.seances.concat([seance]) }))) {
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
      const contenu = await chiffrerTexte(JSON.stringify(enCours ? Object.assign({}, data, { enCours: enCours }) : data), mdp.trim());
      const nom = `plateau-sauvegarde-${todayISO()}.json`;
      const fichier = new File([contenu], nom, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
        try { await navigator.share({ files: [fichier], title: "Sauvegarde PLATEAU" }); }
        catch (e) { return; } // partage annulé : pas de sauvegarde, on ne le compte pas
      } else {
        const url = URL.createObjectURL(fichier);
        const a = document.createElement("a");
        a.href = url; a.download = nom;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
      sauverData(Object.assign({}, data, { dernierExport: todayISO() }));
    } catch (e) {
      window.alert("La sauvegarde a échoué sur ce téléphone.");
    }
  };

  const restaurer = async (fichier) => {
    if (!fichier) return;
    try {
      let texte = await fichier.text();
      let lu = lireSauvegarde(texte);
      if (lu.chiffre) {
        const mdp = window.prompt("Mot de passe de la sauvegarde :");
        if (!mdp) return;
        try { texte = await dechiffrerTexte(texte, mdp); }
        catch (e) { window.alert("Mot de passe incorrect, ou fichier abîmé."); return; }
        lu = lireSauvegarde(texte);
      }
      if (lu.erreur) { window.alert(lu.erreur); return; }
      if (!window.confirm(`Remplacer tes données actuelles par cette sauvegarde (${lu.data.seances.length} séances) ?`)) return;
      if (!sauverData(lu.data)) { window.alert("Écriture impossible."); return; }
      sauverEnCours(lu.enCours && lu.enCours.startedAt ? lu.enCours : null);
      setRepos(null); setBilan(null); setEcran("accueil");
    } catch (e) {
      window.alert("Ce fichier n'a pas pu être lu.");
    }
  };

  const bandeau = alerteStockage && (
    <div role="alert" style={{ fontSize: 14, color: T.erreur, padding: "10px 0", borderBottom: `1px solid ${T.trait}` }}>
      Enregistrement impossible sur ce téléphone. Fais une sauvegarde depuis le menu.
    </div>
  );

  // ═══ FIN DE SÉANCE ═══
  if (bilan) {
    const series = bilan.exos.reduce((n, e) => n + (e.series || 0), 0);
    const records = bilan.exos.filter((e) => e.pr);
    return (
      <Ecran>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Etiquette>Séance terminée</Etiquette>
            <div className="titre-geant">{bilan.nom}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, padding: "20px 0", borderTop: `1px solid ${T.trait}`, borderBottom: `1px solid ${T.trait}` }}>
            {[[bilan.duree, bilan.duree > 1 ? "minutes" : "minute"], [series, series > 1 ? "séries" : "série"], [records.length, records.length > 1 ? "records" : "record"]].map(([v, l], i) => (
              <div key={l} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 500, color: i === 2 && v > 0 ? T.accent : T.encre }}>{v}</div>
                <div style={{ fontSize: 14, color: T.gris }}>{l}</div>
              </div>
            ))}
          </div>
          {records.map((e) => (
            <div key={e.id} style={{ fontSize: 18, lineHeight: 1.45 }}>
              Record sur {e.nom.charAt(0).toLowerCase() + e.nom.slice(1)} : <b>{fmtKg(meilleureSerie(e).poids)} kg × {meilleureSerie(e).reps}</b>.
            </div>
          ))}
        </div>
        <Bouton onClick={() => setBilan(null)}>Fermer</Bouton>
      </Ecran>
    );
  }

  // ═══ SÉANCE EN COURS ═══
  if (enCours) {
    const entete = <Entete gauche={`${enCours.nom} · ${fmtDuree(maintenant - enCours.startedAt)}`} droite="Finir" onDroite={finirSeance} />;

    // — Repos —
    if (enRepos) {
      const suite = ec
        ? { haut: `Ensuite : série ${ec.sets.length + 1} sur ${ec.prevu}`, bas: poids ? `${poids} kg × ${reps}` : "" }
        : { haut: "Ensuite", bas: planDe(data, enCours)[0] || "l'exercice suivant" };
      return (
        <Ecran>
          {entete}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 18 }}>
            <Etiquette>Repos</Etiquette>
            <div aria-live="polite" style={{ fontFamily: MONO, fontSize: 112, fontWeight: 500, letterSpacing: "-0.05em", lineHeight: 1 }}>{fmtChrono(resteRepos)}</div>
            <div style={{ width: 240, height: 3, background: T.trait, borderRadius: 2 }}>
              <div style={{ width: `${Math.min(100, (1 - resteRepos / repos.total) * 100)}%`, height: "100%", background: T.encre, borderRadius: 2 }} />
            </div>
            <div style={{ marginTop: 22, fontSize: 17, color: T.gris, textAlign: "center", lineHeight: 1.5 }}>
              {suite.haut}<br /><span style={{ color: T.encre, fontWeight: 600 }}>{suite.bas}</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <Bouton variante="contour" onClick={() => setRepos(Object.assign({}, repos, { fin: repos.fin + 15000, total: repos.total + 15 }))}>+15 s</Bouton>
            <Bouton onClick={() => { bipFait.current = true; setRepos(null); }}>Passer</Bouton>
          </div>
        </Ecran>
      );
    }

    // — Choix de l'exercice —
    if (!ec) {
      const plan = planDe(data, enCours);
      const connus = nomsExos(data, enCours);
      const k = cleNom(saisie);
      const propositions = k ? connus.filter((n) => cleNom(n).indexOf(k) !== -1 && !plan.some((p) => cleNom(p) === cleNom(n))).slice(0, 4) : [];
      return (
        <Ecran>
          {entete}
          {bandeau}
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 8 }}>
            <Etiquette>{enCours.exos.length ? `${enCours.exos.length} fait${enCours.exos.length > 1 ? "s" : ""} · la suite` : "Premier exercice"}</Etiquette>
          </div>
          <div style={{ marginTop: 12, flex: 1, overflowY: "auto" }}>
            {plan.map((nom) => {
              const c = consigne(dernierExo(data, nom, enCours));
              return <Ligne key={nom} titre={nom} detail={c.poids == null ? "Première fois" : `${fmtKg(c.poids)} kg × ${c.reps}`} onClick={() => commencerExo(nom)} />;
            })}
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 15, color: T.gris }}>{plan.length ? "Autre exercice" : "Quel exercice ?"}</div>
              <input
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") commencerExo(saisie); }}
                placeholder="Nom de l'exercice"
                enterKeyHint="go"
                style={{ height: 56, fontSize: 18, padding: "0 16px", borderRadius: 14, border: `1px solid ${T.bord}`, background: T.blanc, color: T.encre, fontFamily: "inherit", outline: "none" }}
              />
              {propositions.map((n) => (
                <Ligne key={n} titre={n} onClick={() => commencerExo(n)} />
              ))}
              {saisie.trim() && !propositions.some((n) => cleNom(n) === k) && (
                <Bouton variante="contour" onClick={() => commencerExo(saisie)}>Commencer « {nomCanonique(saisie, connus)} »</Bouton>
              )}
            </div>
          </div>
        </Ecran>
      );
    }

    // — Exercice en cours —
    const der = dernierExo(data, ec.nom, enCours);
    const c = consigne(der);
    const numero = enCours.exos.length + 1;
    return (
      <Ecran>
        {entete}
        {bandeau}
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 8 }}>
          <Etiquette>Exercice {numero} · Série {Math.min(ec.sets.length + 1, ec.prevu)} sur {ec.prevu}</Etiquette>
          <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.02em", overflowWrap: "anywhere" }}>{ec.nom}</div>
        </div>
        <div style={{ marginTop: 22, padding: "16px 0", borderTop: `1px solid ${T.trait}`, borderBottom: `1px solid ${T.trait}`, display: "flex", flexDirection: "column", gap: 6 }}>
          {der && <div style={{ fontSize: 15, color: T.gris }}>{texteDerniereFois(der)}</div>}
          <div style={{ fontSize: 18, fontWeight: 600, color: T.accent }}>{c.texte}</div>
        </div>
        {ec.sets.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: T.gris, overflowWrap: "anywhere" }}>
              {ec.sets.map((st) => `${fmtKg(st.poids)}×${st.reps}`).join("  ")}
            </div>
            <button type="button" onClick={retirerSerie} style={{ minHeight: 44, padding: "0 0 0 12px", background: "none", border: "none", fontSize: 14, color: T.gris, fontFamily: "inherit", flexShrink: 0 }}>Retirer la dernière</button>
          </div>
        )}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, minHeight: 170 }}>
          <Compteur valeur={poids} onChange={setPoids} unite="kg" pas={pasDeCharge({ parBras: ec.parBras, poids: lireNombre(poids) })} decimal label="charge" />
          <Compteur valeur={reps} onChange={setReps} unite="reps" pas={1} label="répétitions" />
        </div>
        {erreur && <div role="alert" style={{ fontSize: 15, color: T.erreur, textAlign: "center", marginBottom: 10 }}>{erreur}</div>}
        <Bouton onClick={validerSerie}>{ec.sets.length + 1 >= ec.prevu ? "Valider la dernière série" : "Valider la série"}</Bouton>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 4 }}>
          <Bouton variante="texte" onClick={serieDePlus}>Série de plus</Bouton>
          <Bouton variante="texte" onClick={exoFini}>{ec.sets.length ? "Exercice fini" : "Changer"}</Bouton>
        </div>
      </Ecran>
    );
  }

  // ═══ MENU ═══
  if (ecran === "menu") {
    const apercu = typeof location !== "undefined" && location.pathname.indexOf("/nouvelle/") !== -1;
    return (
      <Ecran>
        <Retour titre="Menu" onClick={() => setEcran("accueil")} />
        <div style={{ marginTop: 16 }}>
          <Ligne titre="Historique" detail={`${data.seances.length} séance${data.seances.length > 1 ? "s" : ""}`} onClick={() => setEcran("historique")} />
          <Ligne titre="Sauvegarde" detail={data.dernierExport ? `Dernière le ${dateCourte(data.dernierExport)}` : "Jamais faite"} onClick={() => setEcran("sauvegarde")} />
          {apercu && <Ligne titre="Revenir à l'ancienne version" onClick={() => { window.location.href = "../"; }} />}
        </div>
      </Ecran>
    );
  }

  // ═══ HISTORIQUE ═══
  if (ecran === "historique") {
    const liste = seancesTriees(data).reverse();
    return (
      <Ecran>
        <Retour titre="Historique" onClick={() => setEcran("menu")} />
        <div style={{ marginTop: 12, flex: 1, overflowY: "auto" }}>
          {!liste.length && <div style={{ fontSize: 17, color: T.gris, marginTop: 24 }}>Aucune séance pour l'instant.</div>}
          {liste.map((s) => (
            <Ligne key={s.id || s.date + s.nom} titre={s.nom} detail={`${dateCourte(s.date)}${s.duree ? ` · ${s.duree} min` : ""} · ${s.exos.length} exercice${s.exos.length > 1 ? "s" : ""}`} onClick={() => { setDetailId(s.id); setEcran("detail"); }} />
          ))}
        </div>
      </Ecran>
    );
  }

  if (ecran === "detail") {
    const s = data.seances.find((x) => x.id === detailId);
    if (!s) {
      return (
        <Ecran>
          <Retour titre="Historique" onClick={() => setEcran("historique")} />
          <div style={{ fontSize: 17, color: T.gris, marginTop: 24 }}>Cette séance n'existe plus.</div>
        </Ecran>
      );
    }
    const supprimer = () => {
      if (!window.confirm(`Supprimer la séance ${s.nom} du ${dateCourte(s.date)} ? C'est définitif.`)) return;
      if (sauverData(Object.assign({}, data, { seances: data.seances.filter((x) => x !== s) }))) setEcran("historique");
    };
    return (
      <Ecran>
        <Retour titre="Historique" onClick={() => setEcran("historique")} />
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          <Etiquette>{dateLongue(s.date)}{s.duree ? ` · ${s.duree} min` : ""}</Etiquette>
          <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.05 }}>{s.nom}</div>
        </div>
        <div style={{ marginTop: 20, flex: 1, overflowY: "auto" }}>
          {s.exos.map((e, i) => (
            <div key={e.id || i} style={{ padding: "14px 0", borderBottom: `1px solid ${T.trait}`, display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 500 }}>{e.nom}</div>
              <div style={{ fontFamily: MONO, fontSize: 15, color: e.pr ? T.accent : T.gris, textAlign: "right", flexShrink: 0 }}>
                {estCardio(e) ? `${e.dureeCardio || "?"} min` : `${resumeSeries(e) ? resumeSeries(e) + " · " : ""}${fmtKg(Number(e.poids) || 0)} kg`}
                {e.pr ? " · record" : ""}
              </div>
            </div>
          ))}
        </div>
        <Bouton variante="texte" onClick={supprimer} style={{ color: T.erreur }}>Supprimer cette séance</Bouton>
      </Ecran>
    );
  }

  // ═══ SAUVEGARDE ═══
  if (ecran === "sauvegarde") {
    return (
      <Ecran>
        <Retour titre="Sauvegarde" onClick={() => setEcran("menu")} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
          <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.15 }}>Tes séances ne vivent que sur ce téléphone.</div>
          <div style={{ fontSize: 17, color: T.gris, lineHeight: 1.45 }}>
            Une sauvegarde est un fichier chiffré à ranger dans Fichiers ou à t'envoyer. {data.dernierExport ? `Dernière : ${dateLongue(data.dernierExport).toLowerCase()}.` : "Tu n'en as jamais fait."}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Bouton onClick={exporter}>Faire une sauvegarde</Bouton>
          <Bouton variante="contour" onClick={() => fichierRef.current && fichierRef.current.click()}>Restaurer une sauvegarde</Bouton>
          <input ref={fichierRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={(e) => { restaurer(e.target.files && e.target.files[0]); e.target.value = ""; }} />
        </div>
      </Ecran>
    );
  }

  // ═══ CHOIX DE LA SÉANCE ═══
  if (ecran === "choix") {
    const noms = nomsSeances(data);
    return (
      <Ecran>
        <Retour titre="Quelle séance ?" onClick={() => setEcran("accueil")} />
        <div style={{ marginTop: 12, flex: 1, overflowY: "auto" }}>
          {noms.map((n) => <Ligne key={n} titre={n} onClick={() => demarrer(n)} />)}
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 15, color: T.gris }}>{noms.length ? "Ou une nouvelle" : "Donne-lui un nom"}</div>
            <input
              value={nomSeance}
              onChange={(e) => setNomSeance(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") demarrer(nomSeance); }}
              placeholder="Pull, Jambes, Haut du corps…"
              enterKeyHint="go"
              style={{ height: 56, fontSize: 18, padding: "0 16px", borderRadius: 14, border: `1px solid ${T.bord}`, background: T.blanc, color: T.encre, fontFamily: "inherit", outline: "none" }}
            />
            {nomSeance.trim() && <Bouton onClick={() => demarrer(nomSeance)}>Démarrer « {nomPropre(nomSeance)} »</Bouton>}
          </div>
        </div>
      </Ecran>
    );
  }

  // ═══ ACCUEIL ═══
  const sj = seanceDuJour(data, aujourdhui);
  const jSauv = joursSansSauvegarde(data, aujourdhui);
  let titre, sousTitre, action;
  if (sj.etat === "premiere") { titre = "Première séance"; sousTitre = "Donne-lui un nom et c'est parti."; action = <Bouton onClick={() => setEcran("choix")}>Commencer</Bouton>; }
  else if (sj.etat === "faite") { titre = "C'est fait"; sousTitre = `${sj.seance.nom}${sj.seance.duree ? `, ${sj.seance.duree} min` : ""}. Récupère bien.`; action = <Bouton variante="contour" onClick={() => setEcran("choix")}>Nouvelle séance</Bouton>; }
  else { titre = sj.nom; sousTitre = texteDepuis(sj.depuis); action = <Bouton onClick={() => demarrer(sj.nom)}>Démarrer</Bouton>; }

  return (
    <Ecran>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 44 }}>
        <div style={{ fontSize: 15, color: T.gris }}>{dateLongue(aujourdhui)}</div>
        <button type="button" aria-label="Menu" onClick={() => setEcran("menu")} style={{ width: 44, height: 44, marginRight: -10, background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.encre} strokeWidth="1.6" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>
      {bandeau}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
        <Etiquette>Aujourd'hui</Etiquette>
        <div className="titre-geant">{titre}</div>
        <div style={{ fontSize: 18, lineHeight: 1.4, color: T.gris }}>{sousTitre}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rappelSauvegarde(data, aujourdhui) && (
          <button type="button" onClick={() => setEcran("sauvegarde")} style={{ minHeight: 44, background: "none", border: "none", fontSize: 15, color: T.accent, fontFamily: "inherit" }}>
            {jSauv === Infinity ? "Tes séances ne sont sauvegardées nulle part" : `Pas de sauvegarde depuis ${jSauv} jours`}
          </button>
        )}
        {action}
        {sj.etat !== "premiere" && sj.etat !== "faite" && <Bouton variante="texte" onClick={() => setEcran("choix")}>Autre séance</Bouton>}
      </div>
    </Ecran>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Racine));
