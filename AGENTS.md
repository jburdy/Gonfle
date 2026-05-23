# Consignes Agents

Ce projet est un calculateur statique de pression pneus vélo. Il tourne côté navigateur, sans backend ni dépendances de build.

## Structure

- `index.html` : interface, textes visibles, panneaux d’explication et dialogues profils.
- `app.js` : état local, calculs, rendu dynamique, alertes et copie des pressions.
- `styles.css` : design responsive sombre, composants et mise en page.
- `docs/silca-tire-pressure-formulas.md` : référence technique du modèle de calcul.
- `docs/Rapport-impacte-TPU.md` : justification locale des choix liés aux chambres TPU.
- `assets/surface-conditions.webp` : guide visuel des surfaces.

## Invariants

- Le calcul doit rester local au navigateur. Ne pas ajouter de backend, tracking, CDN obligatoire ou dépendance lourde.
- Les profils cycliste/vélo restent dans `localStorage` via la clé `jtirepresscalc:v1`.
- Les valeurs par défaut sont `Route usée` et `Détente`.
- La correction conditions ne porte que sur la température. Ne pas réintroduire la notion d’altitude.
- Les pressions affichées sont les pressions à régler au gonflage. Les cibles de roulage peuvent apparaître dans les alertes.
- Les bar sont la valeur principale et s’affichent avec une décimale. Les PSI sont secondaires et arrondis sans décimale.
- Le poids total valide pour le modèle SILCA reste `34` à `205 kg`.

## Calcul

- Modifier les formules dans `app.js` et mettre à jour `docs/silca-tire-pressure-formulas.md` dans le même changement.
- Conserver les coefficients SILCA documentés sauf demande explicite.
- Toute hypothèse ajoutée, notamment TPU, doit être courte, visible dans la doc et cohérente avec `docs/Rapport-impacte-TPU.md`.
- Ne pas masquer les alertes de sécurité : hookless, pincement, TPU et limites pneus/jantes.

## Interface Et Textes

- Écrire en français, de façon concise et directe.
- Éviter les paragraphes longs dans l’interface. Préférer une phrase utile à deux phrases explicatives.
- Garder les libellés mobiles courts. Tester mentalement sur écran étroit avant d’allonger un texte.
- Pour `Répartition du poids`, rappeler que le choix décrit la charge avant/arrière, pas un poids à saisir.
- Préserver la structure accessible : labels explicites, boutons typés, textes d’aide liés avec `aria-describedby` si utile.

## Style De Code

- Garder le projet en JavaScript vanilla, HTML sémantique et CSS simple.
- Préférer les changements minimaux et lisibles.
- Ne pas créer d’abstraction si le code n’est utilisé qu’une fois.
- Maintenir les commentaires existants quand le comportement change.
- Supprimer imports, code mort et espaces inutiles après modification.

## Vérifications

- Vérifier la syntaxe JavaScript avec `node --check app.js`.
- Vérifier les espaces et conflits simples avec `git diff --check`.
- Rechercher les termes supprimés quand un concept disparaît, par exemple `altitude`.
- Pour une modification UI, ouvrir `index.html` dans un navigateur et contrôler desktop + mobile si possible.
- S’il n’existe pas de suite de tests, le dire clairement dans le résumé final.

## Git

- Ne pas lancer `git commit`, `git commit --amend` ou `git push` sans demande explicite.
- Ne jamais annuler des changements non liés faits par l’utilisateur.
- Avant un commit demandé, inspecter `git status`, `git diff` et `git log --oneline -10`.
