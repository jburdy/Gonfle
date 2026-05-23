# TL;DR

Le calculateur SILCA calcule la pression cote client en JavaScript. La pression finale est un `CPP` en PSI, multiplie par un coefficient de vitesse, un coefficient de repartition avant/arriere et un coefficient de type de pneu. L'interface affiche les bar en valeur principale.

Source analysee: `https://silca.cc/pages/pro-tire-pressure-calculator`, bloc JavaScript public de la page, recupere le 2026-05-23.

## Entrees

| Entree | Unite / valeurs |
| --- | --- |
| Poids total systeme | kg. Si l'utilisateur saisit des livres: `kg = lbs * 0.453592`. Valide de 34 a 205 kg. |
| Largeur pneu mesuree | mm, options 20 a 65. |
| Diametre roue | BSD en mm: 622 pour 700C/29", 571 pour 650C, 584 pour 650B/27.5", 559 pour 26". |
| Vitesse moyenne | mph, options 12.5, 15.5, 17.5, 19.5, 21.5, 24. |

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
Dans l'application, les vitesses sont stockees en mph et affichees en km/h arrondis. Le choix `Detente` utilise `12.5 mph`, soit environ `20 km/h`.

```text
C_vitesse = 0.97 + ((v_mph - 10) * (1.03 - 0.97) / (33 - 10))
```

Equivalent:

```text
C_vitesse = 0.97 + (v_mph - 10) * 0.06 / 23
```

## Correction Temperature

Le calculateur SILCA public n'a pas de champ dedie pour la temperature. L'application convertit la cible de roulage en pression a regler au gonflage.

Variables:

| Symbole | Definition |
| --- | --- |
| `T_gonflage` | temperature au moment du gonflage, en degres Celsius |
| `T_sortie` | temperature prevue pendant la sortie, en degres Celsius |

Formules pratiques appliquees:

```text
delta_temperature_psi = ((T_sortie - T_gonflage) / 10) * 3
correction_conditions_psi = delta_temperature_psi
pression_a_regler_psi = pression_cible_roulage_psi - correction_conditions_psi
```

Interpretation:

| Situation | Effet applique |
| --- | --- |
| Sortie plus chaude que le gonflage | Gonfler moins, car la pression montera avec la temperature. |
| Sortie plus froide que le gonflage | Gonfler plus, car la pression baissera avec la temperature. |

Controle des sources: Rene Herse souligne que la temperature ambiante est une variable majeure des tests pneus; TRS/Josh Poertner et SILCA expliquent l'importance des conditions reelles, de la surface et de l'impedance; Pirelli presente son outil comme une recommandation physique a affiner; PsiCling documente l'ordre de grandeur thermique par loi de Gay-Lussac.

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
| Haut rendement tubeless/latex | Carcasse tres souple | 1 | 1 |
| Haut rendement TPU leger | Base haut rendement, TPU -10% | 0.90 | 0.90 |
| Standard souple tubeless/latex | Pneu courant de bonne qualite | 0.97 | 0.97 |
| Standard souple TPU | Base standard souple, TPU -10% | 0.873 | 0.873 |
| Standard butyl | Chambre classique | 0.94 | 0.94 |
| Renforce anti-crevaison | Carcasse rigide ou protegee | 0.91 | 0.91 |

Note: les coefficients TPU ne sont pas presents dans les quatre choix SILCA originaux. Ils integrent le rapport local `sources/Rapport-impacte-TPU.md`: le TPU ne change pas la logique de base poids x section x terrain, mais il permet souvent de rouler 5 a 10% plus bas qu'un montage butyl de reference pour retrouver un ressenti equivalent, avec plus de confort et de grip. Le calculateur applique donc un ajustement assume de -10% aux options TPU.

Les recherches consultees indiquent aussi que le TPU est meilleur que le butyl en rendement, mais varie beaucoup selon le modele: Bicycle Rolling Resistance trouve les Tubolito standard proches du butyl leger et les S-Tubo proches du latex; Rene Herse/Bicycle Quarterly trouve ses TPU prototypes indistinguables de latex ultra-fin en test route; AeroCoach, rapporte par road.cc, trouve Tubolito meilleur que butyl mais moins rapide que latex. Le calculateur distingue donc TPU leger/performance (`0.90`) et TPU standard (`0.873`).

Sources consultees pour TPU:

| Source | Point retenu |
| --- | --- |
| Bicycle Rolling Resistance, Tubolito Inner Tube Tests (`https://www.bicyclerollingresistance.com/specials/tubolito`) | TPU standard proche du butyl leger; S-Tubo proche du latex mais pas toujours egal. |
| Rene Herse / Bicycle Quarterly, TPU Tubes: How fast are they? (`https://www.renehersecycles.com/tpu-tubes-how-fast-are-they/`) | TPU teste en conditions route, proche de latex ultra-fin et significativement meilleur que butyl. |
| road.cc rapportant AeroCoach (`https://road.cc/content/tech-news/265627-use-latex-inner-tubes-lowest-rolling-resistance-says-aerocoach-test`) | Tubolito plus rapide que butyl, mais encore derriere latex sur rouleau lisse. |

## Pressions Finales

Si les pneus avant et arrière sont identiques (par défaut) :
```text
P_avant_psi = CPP * C_vitesse * C_repartition_avant * C_type_pneu_avant
P_arriere_psi = CPP * C_vitesse * C_repartition_arriere * C_type_pneu_arriere
```

Si les pneus avant et arrière sont différents, la largeur et le type de pneu sont spécifiés pour chaque pneu. Le coefficient de pression de base `CPP` (qui dépend de la largeur `w`) et le coefficient de type de pneu `C_type_pneu` sont alors calculés pour chaque pneu :
```text
CPP_avant = calculateCpp({ width: frontWidth, diameter, k })
CPP_arriere = calculateCpp({ width: rearWidth, diameter, k })

P_avant_psi = CPP_avant * C_vitesse * C_repartition_avant * C_type_pneu_avant
P_arriere_psi = CPP_arriere * C_vitesse * C_repartition_arriere * C_type_pneu_arriere
```

Pour les options TPU, `C_type_pneu` inclut deja l'ajustement de -10% issu du rapport TPU.

Si une correction temperature est active, les valeurs affichees par l'application sont:

```text
P_avant_affiche_psi = P_avant_psi - correction_conditions_psi
P_arriere_affiche_psi = P_arriere_psi - correction_conditions_psi
```

`P_avant_psi` et `P_arriere_psi` restent les cibles en conditions de roulage; les valeurs affichees sont les pressions a regler au gonflage.

Affichage BAR:

```text
BAR_affiche = round((P_psi * 0.0689476) * 10) / 10
```

Affichage PSI:

```text
PSI_affiche = round(P_psi)
```

L'interface met les bar en valeur principale avec une decimale. Les PSI sont affiches en secondaire sans decimale.

## Alerte Hookless

```text
si max(PSI_avant, PSI_arriere, PSI_avant_cible, PSI_arriere_cible) > 70:
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

Le rapport TPU indique que les chambres TPU sont moins sujettes au pincement que le butyl a pression equivalente, mais le risque n'est pas nul. Le calculateur conserve donc les alertes de pincement au lieu de modifier les seuils `PF`.

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

Ces deux valeurs sont affichees arrondies au PSI entier.

## Risques Specifiques TPU Integres Aux Explications

Quand un profil velo utilise une chambre TPU, l'application affiche une alerte de contexte. Les points repris du rapport local sont:

| Risque | Consequence pratique |
| --- | --- |
| Montage delicat | Ne pas pincer la chambre entre pneu et jante; ne pas la gonfler fortement hors du pneu. |
| Reutilisation dans un pneu plus etroit | Eviter de remonter une TPU deja etiree dans une section plus petite. |
| Chaleur avec freins a patins | Eviter les TPU ultralight en longues descentes avec freinage sur jante. |
| Reparation et CO2 | Rustines specifiques; certains fabricants deconseillent l'usage systematique du CO2. |

## Sources Citees

| Source | Utilisation dans l'application |
| --- | --- |
| Rene Herse Cycles, Tires and Pressure: new research and what it means (`https://www.renehersecycles.com/tires-and-pressure-new-research-and-what-it-means/`) | Importance des tests en conditions reelles et de la temperature ambiante. |
| TRS Triathlon, Talking tires with Joshua Poertner (`https://trstriathlon.com/talking-tires-with-joshua-poertner/`) | Relation entre pression, rugosite, impedance et performance; mieux vaut souvent etre un peu trop bas que trop haut. |
| SILCA, Rolling Resistance: The History and Previous Works (`https://silca.cc/blogs/silca/part-4a-rolling-resistance-the-history-and-previous-works`) | Concept de breakpoint pressure, impedance et pertes dues a la surface. |
| Pirelli Pressure Tool (`https://www.pirelli.com/tyres/en-gb/bike/pressure-tool`) | Rappel qu'un outil de pression donne une recommandation physique a affiner selon sensations et securite. |
| PsiCling (`https://psicling.com/en/`) | Ordre de grandeur temperature: environ 0.1 a 0.2 bar par 10 degres Celsius et correction via difference gonflage vers sortie. |
| Bicycle Rolling Resistance, Tubolito Inner Tube Tests (`https://www.bicyclerollingresistance.com/specials/tubolito`) | Positionnement TPU vs latex et butyl. |
| Rene Herse / Bicycle Quarterly, TPU Tubes: How fast are they? (`https://www.renehersecycles.com/tpu-tubes-how-fast-are-they/`) | Donnees route TPU vs butyl/latex. |
| road.cc rapportant AeroCoach (`https://road.cc/content/tech-news/265627-use-latex-inner-tubes-lowest-rolling-resistance-says-aerocoach-test`) | Donnees TPU vs latex/butyl sur rouleau. |
