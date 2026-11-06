# Arcade Orthodontie

Plateforme d'apprentissage de l'orthodontie : parcours, notions, flashcards à répétition espacée, QCM adaptatifs, cas cliniques, Labo et examen blanc.

Elle s'appuie sur *Orthodontie de l'enfant et du jeune adulte*, tomes 1 et 2 (Elsevier Masson, 2011 et 2013). Les contenus sont des reformulations à visée d'étude, sans relecture par un enseignant. Les cas et les QCM sont originaux et ne viennent pas du NDEB.

## Ouvrir le site

- **Sur ton ordinateur :** double-clique sur `index.html`.
- **En ligne :** active GitHub Pages sur ce dépôt (Settings > Pages > Deploy from a branch > `main` / `/ (root)`).

## Organisation

| Fichier ou dossier | Rôle |
|---|---|
| `index.html` | Structure de la page |
| `css/style.css` | Apparence, thèmes clair et sombre |
| `js/app.js` | Fonctionnement de l'application |
| `js/data.js` | Contenu utilisé par le site, généré automatiquement |
| `sources/chapitres/` | Contenu par chapitre (`ch1` à `ch9` : tome 1 ; `ch11` à `ch18` : chapitres 1 à 8 du tome 2) |
| `sources/extra.json` | Cas, chaînes de raisonnement, tensions, parcours et QCM supplémentaires |
| `sources/build.py` | Régénère `js/data.js` |

## Modifier le contenu

Modifie les fichiers de `sources/`, puis lance depuis la racine du dossier :

```
python sources/build.py
```

## Limites

- Le mode conversationnel du Professeur ne fonctionne pas en dehors de claude.ai. Son mode autonome reste disponible.
- La progression reste dans le navigateur de chaque visiteur.
- Les PDF des livres ne font pas partie de ce dépôt. Chacun choisit son propre fichier, qui reste sur son appareil.
