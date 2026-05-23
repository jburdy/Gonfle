# TL;DR

Le calculateur SILCA calcule la pression cote client en JavaScript. La pression finale est un `CPP` en PSI, multiplie par un coefficient de vitesse, un coefficient de repartition avant/arriere et un coefficient de type de pneu.

Source analysee: `https://silca.cc/pages/pro-tire-pressure-calculator`, bloc JavaScript public de la page, recupere le 2026-05-23.

## Entrees

| Entree | Unite / valeurs |
| --- | --- |
| Poids total systeme | kg. Si l'utilisateur saisit des livres: `kg = lbs * 0.453592`. Valide de 34 a 205 kg. |
| Largeur pneu mesuree | mm, options 20 a 65. |
| Diametre roue | BSD en mm: 622 pour 700C/29", 571 pour 650C, 584 pour 650B/27.5", 559 pour 26". |
| Vitesse moyenne | mph, options 14, 15.5, 17.5, 19.5, 21.5, 24. |

## Coefficient De Surface

`K = 0.5 * (poids_kg - 50) + K1`

| Surface | `K1` |
| --- | ---: |
| New Pavement | 261 |
| Worn Pavement / Some Cracks | 246.5 |
| Category 1 Gravel | 235.5 |
| Poor Pavement / Chipseal | 225 |
| Category 2 Gravel | 212.5 |
| Cobblestone | 199 |
| Category 3 Gravel | 187 |
| Category 4 Gravel | 170 |

## Pression Centrale `CPP`

Variables:

| Symbole | Definition |
| --- | --- |
| `w` | largeur mesuree du pneu en mm |
| `d` | diametre BSD de roue en mm |
| `K` | coefficient de surface corrige par le poids |

Formule exacte du site:

```text
num = (-0.00006*w^3 + 0.0079*w^2 - 0.4102*w + 12.725) * -226.44
denom = ((-0.5*9.81)/(K*(20/w)) + (w + d/2))^2 - (w + d/2)^2
CPP = num / denom
```

`CPP` est la pression de base en PSI avant les corrections vitesse, repartition et type de pneu.

## Coefficient De Vitesse

Le site fait une interpolation lineaire entre `(10 mph, 0.97)` et `(33 mph, 1.03)`.
Dans l'application, les vitesses sont affichees en km/h arrondis sans decimales, mais les valeurs mph d'origine restent utilisees pour le calcul.

```text
C_vitesse = 0.97 + ((v_mph - 10) * (1.03 - 0.97) / (33 - 10))
```

Equivalent:

```text
C_vitesse = 0.97 + (v_mph - 10) * 0.06 / 23
```

## Repartition Du Poids

| Option | Coeff. avant | Coeff. arriere |
| --- | ---: | ---: |
| 50/50 Triathlon/TT/Track Bikes | 1 | 1 |
| 48/52 Road Bikes | 0.985 | 1.01 |
| 47/53 Gravel Bikes | 0.975 | 1.02 |
| 46.5/53.5 Mountain Bikes | 0.97 | 1.03 |

## Type De Pneu

La carcasse du pneu, souvent appelee `casing` en anglais, est la structure textile sous la bande de roulement. Plus elle est souple, moins elle dissipe d'energie en deformation.

| Type de pneu | Lecture pratique | Coeff. avant | Coeff. arriere |
| --- | --- | ---: | ---: |
| Pneu haut rendement tubeless ou chambre latex | Carcasse tres souple, montage rapide | 1 | 1 |
| Pneu haut rendement avec chambre TPU legere | TPU performance, tres proche latex/tubeless mais legerement conservateur | 0.99 | 0.99 |
| Pneu standard souple tubeless ou chambre latex | Pneu correct mais moins souple qu'un pneu course | 0.97 | 0.97 |
| Pneu standard souple avec chambre TPU | TPU standard, generalement meilleur que butyl | 0.965 | 0.965 |
| Pneu standard avec chambre butyl | Chambre classique, rendement plus faible | 0.94 | 0.94 |
| Pneu renforce anti-crevaison | Carcasse rigide ou tres protegee | 0.91 | 0.91 |

Note: les coefficients TPU ne sont pas presents dans les quatre choix SILCA originaux. Ils sont ajoutes comme approximation transparente. Les recherches consultees indiquent que le TPU est meilleur que le butyl, mais varie beaucoup selon le modele: Bicycle Rolling Resistance trouve les Tubolito standard proches du butyl leger et les S-Tubo proches du latex; Rene Herse/Bicycle Quarterly trouve ses TPU prototypes indistinguables de latex ultra-fin en test route; AeroCoach, rapporte par road.cc, trouve Tubolito meilleur que butyl mais moins rapide que latex. Le calculateur distingue donc TPU leger/performance (`0.99`) et TPU standard (`0.965`).

Sources consultees pour TPU:

| Source | Point retenu |
| --- | --- |
| Bicycle Rolling Resistance, Tubolito Inner Tube Tests (`https://www.bicyclerollingresistance.com/specials/tubolito`) | TPU standard proche du butyl leger; S-Tubo proche du latex mais pas toujours egal. |
| Rene Herse / Bicycle Quarterly, TPU Tubes: How fast are they? (`https://www.renehersecycles.com/tpu-tubes-how-fast-are-they/`) | TPU teste en conditions route, proche de latex ultra-fin et significativement meilleur que butyl. |
| road.cc rapportant AeroCoach (`https://road.cc/content/tech-news/265627-use-latex-inner-tubes-lowest-rolling-resistance-says-aerocoach-test`) | Tubolito plus rapide que butyl, mais encore derriere latex sur rouleau lisse. |

## Pressions Finales

```text
P_avant_psi = CPP * C_vitesse * C_repartition_avant * C_type_pneu_avant
P_arriere_psi = CPP * C_vitesse * C_repartition_arriere * C_type_pneu_arriere
```

Affichage PSI:

```text
PSI_affiche = round(P_psi * 2) / 2
```

Affichage BAR:

```text
BAR_affiche = round((P_psi * 0.0689476) * 20) / 20
```

Le code du site appelle une fonction `round(value, 1)` pour les BAR, mais son implementation arrondit en fait au pas de `0.05 bar`.

## Alerte Hookless

```text
si PSI_avant_affiche > 70 ou PSI_arriere_affiche > 70:
    afficher l'avertissement hookless/tubeless straight side rims
```

Le message du site mentionne une limite de securite jusqu'a 72 PSI.

## Detection Du Risque De Pinch Flat

Variables:

| Symbole | Definition |
| --- | --- |
| `m` | poids total en kg |
| `v` | vitesse en m/s, avec `v = v_mph * 0.44704` |
| `w` | largeur pneu en mm |
| `K` | coefficient de surface corrige par le poids |

Formules:

```text
KE = 0.5 * m * v^2
RE = 0.5 * (0.8*w) * sqrt(K^2 - (0.8*w)^2)
PF = 2*RE - KE
```

Classification:

```text
si -500 <= PF <= 0:
    risque accru de pinch flat
sinon si PF < -500:
    risque extreme de pinch flat
sinon:
    pas de message de risque
```

## Largeur Recommandee Si Risque De Pinch Flat

Le site recommande une largeur minimale arrondie au mm superieur:

```text
Wnum1 = -2.56 * K^2
Wsqrtnum2 = 6.5536 * K^4
Wsqrtnum3 = 6.5536 * (-160000 - 800*m*v^2 - m^2*v^4)
Wnum = Wnum1 + sqrt(Wsqrtnum2 + Wsqrtnum3)
Wdenom = 3.2768
w_recommande = sqrt(-Wnum / Wdenom)
w_recommande_affiche = ceil(w_recommande)
```

## Pressions Non Optimales Si Le Pneu Plus Large Est Impossible

Le site calcule aussi une pression alternative pour reduire le risque de pinch flat si la largeur recommandee n'est pas possible.

```text
PNewNum = sqrt(((25*m^2*v^4 + 20000*m*v^2 + 400000) / (64*w^2)) + 0.64*w^2)
ratio = PNewNum / K
P_avant_non_optimale = ratio * P_avant_psi
P_arriere_non_optimale = ratio * P_arriere_psi
```

Ces deux valeurs sont affichees arrondies au `0.5 PSI`.
