# PLATEAU — nouvelle version

Réécriture complète, volontairement petite : démarrer une séance, faire ses
séries, se reposer, finir. Plus un historique et la sauvegarde. Rien d'autre.

**Aperçu :** https://yakupovic.github.io/plateau/nouvelle/ (l'ancienne app reste à `/plateau/` tant que celle-ci n'est pas validée).

## Les fichiers

| Fichier | Rôle |
|---|---|
| `src/moteur.js` | toute la logique, sans interface : lecture sûre, progression, séance du jour, sauvegarde |
| `src/ui.jsx` | les écrans |
| `build.mjs` | compile les deux en `app.js` et change le numéro de version |
| `tests/moteur.test.mjs` | la logique, cas par cas |
| `tests/parcours.test.mjs` | l'app réelle dans un navigateur simulé : séance complète, reprise, données abîmées, historique, et relecture par l'ancienne app |

```bash
node build.mjs
node tests/moteur.test.mjs
node tests/parcours.test.mjs
```

## Ce qui ne doit jamais changer

- **Même stockage que l'ancienne app** (`pl:plateau-data`, `pl:plateau-current`), même format de séance. La nouvelle app ne réécrit jamais une clé qu'elle ne connaît pas : on peut revenir à l'ancienne version sans rien perdre.
- **Une donnée illisible n'est jamais écrasée** : elle est copiée de côté et un écran de récupération s'affiche.
- **La séance est écrite avant que la séance en cours soit effacée.**
- **Aucun appel réseau, aucune police externe** : l'app marche à la salle sans connexion.
- **Progression** : double progression, fourchette 8-12 reps puis charge. Elle ne dépend d'aucun bouton facultatif.
- Pas de barre fixe en bas d'écran (source du bug de l'ancienne version sur iPhone).
