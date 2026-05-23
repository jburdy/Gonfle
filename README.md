# Gonflé 🚴‍♂️💨

Un calculateur de pression de pneus vélo moderne, esthétique, 100% local, qui intègre nativement les chambres à air TPU.

## Pourquoi Gonflé ?

Les calculateurs existants (SRAM AXS, SILCA, Pirelli, etc.) souffrent de plusieurs limites :
- **Design daté (old school) & peu ergonomique** : Souvent truffés de formulaires austères et peu adaptés aux smartphones au fond du garage.
- **Oubli des chambres TPU** : Le TPU (polyuréthane thermoplastique) s'est imposé comme alternative légère au tubeless et performante au butyl. Pourtant, aucun calculateur ne prend en compte son comportement spécifique (le TPU permet de rouler **5 à 10% plus bas** qu'avec du butyl pour un même ressenti, et comporte des contraintes de montage ou thermiques uniques).
- **Température négligée** : La pression idéale au roulage dépend fortement de l'écart de température entre le moment du gonflage (ex: à la cave à 15°C) et les conditions réelles de la sortie (ex: au soleil à 25°C).

**Gonflé** résout cela avec une interface sombre, fluide, moderne et optimisée pour mobile, fonctionnant entièrement côté client sans aucun tracking ni backend.

---

## Fonctionnalités

- 👥 **Gestion de profils** : Sauvegarde locale (`localStorage`) de vos cyclistes et vélos.
- 🧪 **Calcul de pression de pointe** : Basé sur le modèle physique SILCA (pression critique, hystérèse et impédance de surface).
- 🌡️ **Correction de température** : Ajustement automatique de la pression à appliquer au gonflage selon la météo prévue.
- 🎈 **Support natif du TPU** : Application d'un coefficient réducteur de -10% pour les montages TPU léger ou standard.
- ⚠️ **Alertes de sécurité** : Risques de pincement (*Pinch Flat*), limites *Hookless* (max 70 PSI / 4.8 bar) et risques de surchauffe TPU sur freins à patins.

---

## Sources scientifiques et techniques

Les formules et coefficients de Gonflé s'appuient sur des recherches et publications de référence :

- **Modèle de pression & impédance** :
  - [SILCA Pro Tire Pressure Calculator](https://silca.cc/pages/pro-tire-pressure-calculator) : Modèle mathématique de base (CPP).
  - [SILCA - Rolling Resistance: The History and Previous Works](https://silca.cc/blogs/silca/part-4a-rolling-resistance-the-history-and-previous-works) : Hystérèse et pertes par vibrations.
  - [René Herse Cycles - Tires and Pressure](https://www.renehersecycles.com/tires-and-pressure-new-research-and-what-it-means/) : Importance des essais en conditions réelles.
- **Thermodynamique** :
  - [PsiCling](https://psicling.com/en/) : Loi de Gay-Lussac appliquée aux pneumatiques vélo (gradient de ~0.1 à 0.2 bar par 10°C d'écart).
- **Rendement & comportement du TPU** :
  - [Bicycle Rolling Resistance - Tubolito Tests](https://www.bicyclerollingresistance.com/specials/tubolito) : Résistance au roulement et comportement comparé (TPU vs butyl/latex).
  - [René Herse Cycles - TPU Tubes: How fast are they?](https://www.renehersecycles.com/tpu-tubes-how-fast-are-they/) : Retours d'expérience et tests de rendement en conditions réelles.
  - [AeroCoach (via road.cc)](https://road.cc/content/tech-news/265627-use-latex-inner-tubes-lowest-rolling-resistance-says-aerocoach-test) : Tests comparatifs de perte de puissance (watts).

---

## Utilisation locale

Ouvrez simplement [index.html](index.html) dans n'importe quel navigateur moderne. Aucun serveur ni build n'est nécessaire.
