# Fallstudien mit dem Energie-4-AI-Simulator (P2)

**Stand:** 2026-09-03 · Datenbundle v2.4.0 · Erzeugt mit dem P2-Interface (Browser-Automation
via Playwright, Chromium headless). Alle Zahlen wurden **aus der Benutzeroberfläche
abgelesen** (Kopfzeile, Karte, Tabellenansicht), nicht aus dem Modellcode extrahiert — sie
sind über die Permalinks unter jeder Fallstudie exakt reproduzierbar.

> ⚠️ **Einordnung (Modellgrenzen):** Jahresenergiebilanzen auf einem vereinfachten
> NTC-Netz — kein Lastfluss, keine untertägige Auflösung; Länderauflösung (Hubs sind
> Metadaten); ein Teil der Länderparameter ist als `expert-guess` markiert
> ([Issue #4](https://github.com/Tobias-Run/Energie-4-AI/issues/4)). Die Szenarien sind
> **Explorationswerkzeuge, keine Prognosen.** Quellen je Parameter: `sources.bib` via
> Assumptions-Drawer; Datennutzung: [DISCLAIMER.md](DISCLAIMER.md).

---

## Vier Korrekturen, die frühere Befunde umgeworfen haben

Diese Fallstudien ersetzen die P1-Fassung vom 2026-07-04 und die erste P2-Fassung vollständig.
Drei Eingriffe haben Ergebnisse verändert, die vorher veröffentlicht waren — der dritte kam aus
einem externen Review ([Issue #7](https://github.com/Tobias-Run/Energie-4-AI/issues/7)).

**1. Berechnete statt geschätzte Spitzenlastfaktoren.** Die P1-Fassung behauptete, ein
Compute-Boom kippe 2045 neben Irland auch Litauen, Estland, Lettland und Malta in den
Stress-Flag. Diese Flags kamen aus geschätzten Spitzenlastfaktoren. Mit aus Ember-Daten
**berechneten** Faktoren (MT 1,50 → 1,98; LT 1,55 → 1,69; EE 1,55 → 1,62; LU 1,50 → 1,24)
verschwanden sie. Ein höherer Faktor bedeutet eine größere Spitzenlast im Nenner und damit
einen kleineren RZ-Anteil an der Spitze — genau die Größe, an der das Flag-Kriterium hängt.

> **Nachtrag (Korrektur 4):** „berechnet" hieß hier: aus einem **Interkonnektor-Datensatz**
> abgeleitet, nicht aus Lastdaten. Diese Faktoren sind inzwischen durch gemessene ersetzt, und
> Litauen ist im Boom-Fall **zurück** in der Flag-Liste. Der Absatz bleibt als Beleg dafür
> stehen, wie weit ein Befund tragen kann, dessen Parameter nie gemessen wurde.

**2. Die Anschlussrestriktion band gar nicht.** Beim Härten der Pipeline-Parameter zeigte
sich, dass die verfügbare Anschlusskapazität als Ländersockel **plus** dem Ausstoß einer
Verzögerungskette berechnet wurde — und diese Kette wird aus dem eigenen Bedarf desselben
Landes gespeist. Angebot war also eine verzögerte Funktion der Nachfrage: Setzte man
Dänemarks Anschlusskapazität auf **null**, behielt es immer noch 8,63 von 13,40 TWh, und die
Warteschlange blieb exakt null. Ein nationales Moratorium — genau das, was Energinet im März
2026 verhängt hat — war bei keinem Parameterwert abbildbar.

Die Länderkapazität begrenzt jetzt den **Zufluss** der Pipeline statt ihn zu ergänzen. Damit
bindet die Restriktion, es entstehen echte Warteschlangen, und die Genehmigungsdauer bleibt
unterhalb der Obergrenze wirksam. Details in [model-notes.md](model-notes.md).

**Was sich dadurch geändert hat:** Irland ist **nicht mehr geflaggt**. Seine eigene
Anschlussgrenze deckelt es bei 19,6 % der Landesnachfrage und 12,5 % der Spitzenlast, unter
der 15-%-Schwelle. Luxemburg ist im Zentralszenario das einzige geflaggte Land. Und Effizienz
bewegt die Flag-Liste jetzt sehr wohl — in der ersten P2-Fassung tat sie es nicht.

**3. Die Pipeline hatte keine Mindestvorlaufzeit.** Ein externes Review fand, dass
`stepPipeline` den Jahreszufluss zum Bestand addierte, _bevor_ die Abflüsse gerechnet wurden.
Folge: 3,7 % einer heute angekündigten Anschlusskapazität waren im selben Jahr fertig, und die
Initialisierung überschoss ihren eigenen stationären Zustand um 37,04 %. Beides ist behoben —
die Abflüsse werden jetzt auf den Beständen zu Jahresbeginn gerechnet. Ein einmaliges Vorhaben
liefert nun **zwei Jahre lang nichts**, bevor Zubau einsetzt.

Die Zahlen unten haben sich dadurch um Zehntel verschoben; die Aussagen nicht. Sichtbar wird die
Korrektur vor allem in Fallstudie 2: Die Warteschlangen sind jetzt um ein Vielfaches größer und
damit erstmals als Indikator brauchbar ([Issue #29](https://github.com/Tobias-Run/Energie-4-AI/issues/29)).

**4. Der Spitzenlastfaktor war aus der falschen Quelle.** `peakFactor` ist der Nenner des
Kriteriums, das die gesamte Flag-Liste bestimmt — und er hing an `ember2026interconnection`,
einem Datensatz über **Interkonnektor-Kapazitäten**, nicht über Last. Großbritannien war reine
Schätzung. Jetzt abgeleitet aus ENTSO-Es veröffentlichten **Stundenlastreihen 2019–2025**
(frei, ohne Zugangstoken), Zähler und Nenner aus derselben Reihe:
[`scripts/derive-peak-factors.mjs`](../scripts/derive-peak-factors.mjs).

Das Jahresmaximum war unbrauchbar — Dänemark 2020 hat als höchste Stunde 9.618 MW gegenüber
5.811 MW in der zweithöchsten, ein Datenfehler. Verwendet wird deshalb das 99,9-%-Perzentil,
und als Wert der Median über die nutzbaren Jahre.

**Die alten Werte lagen systematisch zu hoch:** 24 von 29 fielen, am stärksten Slowenien
(1,99 → 1,47), die Niederlande (1,86 → 1,43) und Dänemark (1,83 → 1,45). Luxemburg ging in die
Gegenrichtung (1,24 → 1,42).

**Was sich dadurch geändert hat:** Luxemburgs Spitzenanteil fällt 2045 von 18,4 auf **16,5 %**,
Irlands steigt von 11,1 auf **12,5 %**. Im Boom-Fall ist **Litauen zurück** in der Flag-Liste —
zum vierten Mal überquert es die 15-%-Schwelle. Der Standortdeckel (C4) räumt jetzt **alle**
Flags. Und 20 % Lastflexibilität genügen wieder, um Luxemburg zu lösen, wo zuvor 30 % nötig
waren. Zwei dieser Aussagen widerrufen frühere Korrekturen dieses Projekts.

**Der Trend beantwortet die zweite Hälfte der Frage — und ist jetzt angewendet.** Das
Verhältnis Spitze zu Mittel **steigt in 33 von 38 Ländern**, im Median um +0,0115 pro Jahr. Auf
21 Jahre sind das rund +0,24 — mehr als die soeben vorgenommene Korrektur. `peakFactor` bis 2045
konstant zu halten war damit **nicht** vertretbar, und die Richtung war bekannt; `peakFactorAt`
in `stressAdequacy.ts` schreibt den gemessenen Trend jetzt linear ab 2024 fort (nach unten
begrenzt bei 1 — Spitze kann per Definition nicht unter Mittel liegen).

> **Nachtrag (Korrektur 5):** Das ist eine echte Modelländerung, keine Parameterkorrektur, und
> Issue #39 verlangte ausdrücklich eine Abwägung, bevor sie umgesetzt wird: Der Trend bildet nur
> die Elektrifizierungsseite zweier gegenläufiger realer Effekte ab (steigende Grundlast-Spitze,
> gemessen, angewendet) — nicht die Gegenseite (wachsender, nahezu flacher RZ-Anteil senkt die
> Spitzigkeit des Gesamtsystems, real, aber unbelegt). Allein angewendet reicht das, um das
> einzige Zentralszenario-Flag 2045 vollständig zu räumen: Luxemburgs Spitzenanteil fällt von
> 16,5 % auf **14,5 %**, unter die 15-%-Schwelle — das Zentralszenario flaggt jetzt **kein**
> Land mehr. Irland rückt gleichzeitig näher an die Linie heran, von 12,5 % auf **14,2 %**, ohne
> sie zu erreichen. Der Boom-Fall behält drei Flags (EE, LV, LU) statt vier — Litauen fällt ein
> fünftes Mal unter die Schwelle. Das ist die im Text vorhergesagte "opposing pull"-Warnung in
> Zahlen: eine einseitige Korrektur, die nur in eine Richtung wirken kann, hat genau das getan.

---

## Fallstudie 1 — „Compute-Boom trifft Effizienz"

**Frage:** Was passiert, wenn die globale KI-Nachfrage 75 % über dem IEA-Basispfad wächst —
und wie viel davon können zusätzliche Effizienzgewinne der Rechenzentren wieder einfangen?

| Szenario              | Compute-Wachstum | Zusatz-Effizienz | Permalink                   |
| --------------------- | ---------------- | ---------------- | --------------------------- |
| Zentral (Referenz)    | ×1,00            | 0,0 %/Jahr       | `?y=2045&m=dcShareOfDemand` |
| A1 „Boom"             | ×1,75            | 0,0 %/Jahr       | `?g=1.75&y=2045&…`          |
| A2 „Boom + Effizienz" | ×1,75            | 2,0 %/Jahr       | `?g=1.75&e=0.02&y=2045&…`   |

**Ergebnis (EU-27, aus der UI-Kopfzeile):**

| Kennzahl                 | Zentral          | A1 Boom             | A2 Boom + Effizienz |
| ------------------------ | ---------------- | ------------------- | ------------------- |
| DC-Nachfrage 2035        | 152 TWh (5,3 %)  | 217 TWh (7,4 %)     | 198 TWh (6,8 %)     |
| DC-Nachfrage 2045        | 218 TWh (6,7 %)  | **336 TWh (9,9 %)** | **283 TWh (8,5 %)** |
| Stress-Flags 2045        | **keine**        | **EE, LV, LU**      | **LU**              |
| Irland: DC 2045          | 8,6 TWh (19,6 %) | 8,6 TWh (19,6 %)    | 8,6 TWh (19,6 %)    |
| Luxemburg: Anteil Spitze | 14,5 %           | 22,5 %              | 19,5 %              |
| Deutschland: DC 2045     | 40,5 TWh (7,0 %) | 53,8 TWh (9,1 %)    | 47,9 TWh (8,2 %)    |

**Befunde:**

1. **Der Boom hebt den DC-Anteil an der EU-Stromnachfrage auf 9,9 %** und die Nachfrage um
   +118 TWh über den Zentralpfad — grob der heutige Jahresverbrauch der Niederlande.
2. **2 %/Jahr Zusatz-Effizienz kauft ~53 TWh zurück** (335 → 283 TWh, −16 %) und **räumt
   Estland und Lettland von der Flag-Liste** — von drei geflaggten Ländern bleibt eines
   (Luxemburg). Anders als in der ersten P2-Fassung wirkt Effizienz damit nicht nur auf die
   Menge, sondern auch auf die Ränder — weil die gedeckelten Hubs Last in kleine Systeme
   abdrängen, wo Mengenreduktion über Schwellen entscheidet. Dass hier zwei statt eines Landes
   fallen, liegt an der Korrektur des Spitzenlast-Nenners (Issue #30, B1); dass es zwei und
   nicht mehr sind, liegt am gemessenen Spitzenlast-Trend (#39), der Litauen schon im
   Referenzfall unter die Schwelle gedrückt hat, bevor Effizienz überhaupt greift.

   _Zur Lesart:_ Der Hebel wirkt seit
   [Issue #27](https://github.com/Tobias-Run/Energie-4-AI/issues/27) auf den **globalen**
   Zuwachs. Vorher multiplizierte er allein die europäischen Zubauten, womit „Effizienz"
   rechnerisch dasselbe war wie „Europa bekommt weniger Compute" — dieselben Chips liefen
   woanders, mit derselben Effizienz. Die europäischen Zahlen sind dadurch unverändert
   geblieben; verändert hat sich, dass jetzt auch die Weltnachfrage sinkt (2 594 → 2 171 TWh
   in 2045) und Europas Anteil daran stabil bleibt.

3. **Irland ist gegen den Boom vollständig unempfindlich: 8,6 TWh in allen drei Szenarien.**
   Seine Anschlussgrenze bindet in jedem Fall zuerst. Das ist die sichtbarste Folge der
   Pipeline-Korrektur — und es ist die Aussage, die das Modell über ein Land mit Moratorium
   überhaupt erst treffen kann.
4. **Luxemburg trägt den Boom stattdessen:** 14,5 % → 22,5 % der Spitzenlast. Klein,
   importabhängig, ohne Anschlussbeschränkung im Modell — es nimmt auf, was Irland abweist. Im
   Zentralszenario reicht das inzwischen nicht mehr für ein Flag (siehe Nachtrag zu Korrektur 5,
   oben); im Boom-Fall schon.

![Zentralszenario 2035](img/cs-A0-central-2035.png)
_Referenz: Zentralszenario 2035 — DC-Anteil an der Stromnachfrage._

![Boom 2045](img/cs-A1-boom-2045.png)
_A1 „Boom" 2045: 335 TWh, 9,9 % — Estland, Lettland und Luxemburg geflaggt._

![Boom + Effizienz 2045](img/cs-A2-boomeff-2045.png)
_A2 „Boom + Effizienz" 2045: 283 TWh, 8,5 % — Lettland fällt wieder heraus._

---

## Fallstudie 2 — „Grids Package unter Boom-Bedingungen: Wer bekommt die Last?"

**Frage:** Die europäische Permitting-Reform („Grids Package", Genehmigung ~9 → ~5 Jahre)
soll den Netzanschluss beschleunigen. Ändert sie, _wie viel_ KI-Last Europa anschließt —
oder _wo_ sie landet?

**Hebel:** B1 = `?g=1.75&y=2030&m=stressIndex` · B2 = zusätzlich `&r=1` (sonst identisch).

| Kennzahl                | B1 ohne Reform       | B2 mit Reform            |
| ----------------------- | -------------------- | ------------------------ |
| EU-27 DC 2030 / 2035    | 144 / 217 TWh        | 144 / 216 TWh            |
| **Irland** DC 2030      | 7,1 TWh (Q 0,063 GW) | **7,3 TWh** (Q 0,057 GW) |
| **Niederlande** DC 2030 | 10,5 TWh (Q 0,050)   | **11,7 TWh** (Q 0,020)   |
| **Dänemark** DC 2030    | 3,0 TWh (Q 0,028)    | **3,4 TWh** (Q 0,019)    |
| Schweden DC 2030        | 10,8 TWh             | 10,7 TWh                 |
| Spanien DC 2030         | 9,2 TWh              | 8,9 TWh                  |
| Norwegen DC 2030        | 4,8 TWh              | 4,5 TWh                  |

**Befunde:**

1. **Die Reform ändert das EU-Total nicht — sie ändert die Landkarte.** 144 TWh mit und ohne.
   Verdrängte Nachfrage findet über den Spillover-Mechanismus ohnehin ein Zuhause.
2. **Sie wirkt jetzt messbar dort, wo es klemmt.** Die drei Länder mit belegter
   Anschlussbeschränkung gewinnen spürbar: Niederlande **+11,4 %**, Dänemark **+13,3 %**,
   Irland +2,8 %. Schweden, Spanien und Norwegen geben spiegelbildlich ab. In der ersten
   P2-Fassung war dieser Effekt gar nicht darstellbar, weil die Restriktion nicht band; seit
   der Überarbeitung der Vorlaufzeit ([#28](https://github.com/Tobias-Run/Energie-4-AI/issues/28))
   ist er zusätzlich deutlicher, weil die Reform jetzt eine Kante verschiebt statt eine Kurve
   zu verschmieren.
3. **Die Warteschlangen schrumpfen, verschwinden aber nicht.** Die Niederlande gehen von
   0,050 auf 0,020 GW zurück (−60 %) — schnellere Genehmigung räumt einen großen Teil des
   Rückstaus ab, die physische Anschlusskapazität bleibt aber die Obergrenze. Das ist der inhaltliche Kern:
   **Genehmigungsreform beschleunigt, sie erweitert nicht.**
4. **Ehrlicher Vorbehalt:** `baseConnectableGwPerYear` ist weiterhin `expert-guess` und seit
   der Korrektur der bindende Parameter. Über eine Bandbreite von ×0,5 bis ×2 bleiben
   EU-Total (222 → 219 TWh) und Flag-Liste (`LU`) stabil, Irlands Einzelwert schwankt aber
   zwischen 7,5 und 10,6 TWh. Länderaussagen aus dieser Fallstudie tragen diese Unsicherheit mit.

![Boom ohne Reform 2030](img/cs-B1-boom-noreform-2030.png)
_B1: Boom ohne Reform, 2030, Stress-Index._

![Boom mit Reform 2030](img/cs-B2-boom-reform-2030.png)
_B2: Boom mit Reform, 2030, Stress-Index._

**Korrektur gegenüber der vorigen Fassung.** Dort stand, ein zweites Bild für B2 erübrige sich,
weil die beiden Karten bei dieser Metrik **byte-identisch** seien — und das war damals gemessen
richtig. Seit der Überarbeitung der Vorlaufzeit
([#28](https://github.com/Tobias-Run/Energie-4-AI/issues/28)) stimmt es nicht mehr: Die
Prüfsummen unterscheiden sich, weil die Reform jetzt genug Last nach NL, DK und IE verschiebt,
um deren Stress-Index sichtbar zu bewegen. Der Unterschied bleibt klein — die Reform verschiebt
Anschlusszeitpunkte und Warteschlangen, nicht die Gesamtmenge —, aber er ist nicht mehr null.
Deshalb steht das Bild jetzt hier.

---

## Fallstudie 3 — „Wohin mit der Last? Flexibilität und Standortsteuerung"

**Frage:** Was bewegt die Flag-Liste? Getestet werden die drei P2-Hebel, die an der
Verteilung ansetzen — alle unter Boom-Bedingungen (×1,75), Metrik **RZ-Anteil an der
Spitzenlast**, weil daran das Flag-Kriterium hängt (Schwelle 15 %).

| Szenario                   | Hebel              | Permalink                        |
| -------------------------- | ------------------ | -------------------------------- |
| C1 Referenz (Boom)         | —                  | `?g=1.75&y=2045&m=dcShareOfPeak` |
| C2 20 % Lastflexibilität   | `flexibilityShare` | `…&f=0.2`                        |
| C3 Standort nach Erneuerb. | `sitingPolicy`     | `…&s=renewables`                 |
| C4 Standort gedeckelt      | `sitingPolicy`     | `…&s=capped`                     |

**Ergebnis (2045, EU-27):**

| Kennzahl             | C1 Referenz | C2 Flex 20 % | C3 Erneuerbare     | C4 Gedeckelt |
| -------------------- | ----------- | ------------ | ------------------ | ------------ |
| EU-27 DC-Nachfrage   | 335 TWh     | 335 TWh      | 335 TWh            | 335 TWh      |
| Stress-Flags         | EE, LV, LU  | **LU**       | **LT, EE, LV, LU** | **keine**    |
| Emissionen (Europa)  | 30 Mt       | 30 Mt        | **28 Mt**          | 30 Mt        |
| LU: Anteil an Spitze | 22,5 %      | 19,2 %       | 23,4 %             | 12,1 %       |
| LV: Anteil an Spitze | 15,0 %      | 12,8 %       | 16,6 %             | 12,0 %       |
| EE: Anteil an Spitze | 15,4 %      | 12,8 %       | 17,7 %             | 11,0 %       |
| LT: Anteil an Spitze | 12,7 %      | 10,4 %       | 15,1 %             | 9,4 %        |

> **Diese Tabelle wurde inzwischen dreimal an einem Tag neu gerechnet** — nach der Korrektur des
> Spitzenlast-Nenners ([#30](https://github.com/Tobias-Run/Energie-4-AI/issues/30), B1), nach der
> Überarbeitung der Vorlaufzeit ([#28](https://github.com/Tobias-Run/Energie-4-AI/issues/28)) und
> nach Anwendung des gemessenen Spitzenlast-Trends ([#39](https://github.com/Tobias-Run/Energie-4-AI/issues/39),
> diese Fassung). Litauen war dabei mehrfach auf beiden Seiten der 15-%-Schwelle. Die Befunde
> unten stehen korrigiert statt still ersetzt; welcher Befund dabei gefallen ist, ist jeweils
> vermerkt.

**Befunde:**

1. **Das EU-Total ist gegen alle drei Hebel unempfindlich — 335 TWh in jedem Fall.** Die
   Standortsteuerung verschiebt Last, sie entfernt keine. Wer diese Hebel an der Gesamtkurve
   misst, misst nichts. _(Unverändert durch alle drei Korrekturen.)_
2. **„Grüne" Standortsteuerung senkt Emissionen und flaggt jetzt ein Land mehr als die
   Referenz, nicht mehr gleich viele.** C3 lenkt Zubau in Systeme mit hohem
   Erneuerbaren-Anteil — in Europa überwiegend Nordics und Baltikum. Emissionen −2 Mt (−7 %),
   aber die Flag-Liste wächst von drei (Referenz) auf vier: Litauen, das der gemessene
   Spitzenlast-Trend (#39) gerade erst unter die Schwelle gedrückt hat, steht unter dieser
   Standortpolitik wieder darüber, 12,7 % → **15,1 %**. Estland verschärft sich ebenso,
   15,4 % → **17,7 %**. **Eine Politik, die nur auf den Strommix optimiert, verlagert das
   Adäquanzproblem in die Systeme, die es am wenigsten tragen können — deutlich genug, um ein
   Land zurück über die Schwelle zu drücken, die eine andere Korrektur gerade geräumt hatte.**
3. **Lastflexibilität wirkt direkt auf das Flag-Kriterium.** 20 % nicht-firme DC-Last nimmt
   **Estland und Lettland** von der Referenz-Liste; von drei geflaggten Ländern bleibt eines.
   Luxemburg bleibt mit 19,2 % zu weit über der Schwelle. Wirksam, aber kein Freibrief.
4. **Der Deckel räumt alle Flags ab — und diese Aussage wurde hier schon zweimal gedreht.**
   Die P1-Fassung behauptete es, die Korrektur des Spitzenlast-Nenners (#30, B1) widerlegte es
   (Luxemburg bei 15,4 %, knapp darüber), und mit gemessenen Spitzenlastfaktoren (#39) stimmte
   es wieder. Mit dem Trend obendrauf (#39, diese Fassung) fällt Luxemburg unter C4 noch
   weiter, auf **12,1 %** — mit deutlicherem Abstand zur Schwelle als je zuvor. Beide früheren
   Widerrufe waren zum Zeitpunkt der Messung korrekt. Was sie verbindet, ist ein Parameter, der
   nie gemessen worden war.
5. **Die Flag-Liste hängt an einem einzelnen Schwellenwert, und das ist hier inzwischen
   fünfmal vorgeführt worden.** Litauens Weg über die 15-%-Linie: darunter (P1) → darüber
   (#30 B1) → darunter (#28) → darüber (#39, gemessene Faktoren, 16,4 %) → **darunter** (#39,
   Trend angewendet, jetzt 12,7 % in der Referenz — aber weiterhin darüber unter „grüner"
   Standortsteuerung, Befund 2). Vier Modellkorrekturen und eine Datenkorrektur, von denen keine
   die Mengen nennenswert bewegt hat. Wer die Flag-Liste zitiert, sollte den Tornado-Chart
   danebenlegen — sie ist eine Schwellenaussage, keine robuste Größe.

![Boom, Anteil an der Spitzenlast 2045](img/cs-C1-peakshare-2045.png)
_C1: Referenz. Luxemburg (22,5 %), Estland (15,4 %) und Lettland (15,0 %) über der 15-%-Schwelle; Litauen (12,7 %) inzwischen darunter._

![Flexibilität 2045](img/cs-C2-flex-2045.png)
_C2: 20 % Lastflexibilität — Estland und Lettland fallen unter die Schwelle, Luxemburg bleibt geflaggt._

![Standortsteuerung nach Erneuerbaren 2045](img/cs-C3-renewables-2045.png)
_C3: Standort nach Erneuerbaren — niedrigere Emissionen, aber das Baltikum rückt tiefer über die Schwelle, Litauen eingeschlossen._

![Standortdeckel 2045](img/cs-C4-capped-2045.png)
_C4: Gedeckelte Standortwahl — keine Flags mehr; Luxemburg fällt auf 12,1 %._

---

## Reproduktion

```bash
npm install && npm run build && npm -w @energie4ai/web exec vite preview --port 4173
```

Dann die Permalinks aus den Tabellen an `http://localhost:4173/` anhängen, z. B.
`http://localhost:4173/?g=1.75&s=renewables&y=2045&m=dcShareOfPeak`. Die Screenshots dieses
Dokuments wurden genau so erzeugt (Chromium headless, Ausschnitt Kartenbereich).

Deterministisch: gleiche Hebel ⇒ exakt gleiche Zahlen (Seed-Reproduzierbarkeit, Spec §7).
Ein vollständiger 20-Jahres-Lauf kostet clientseitig 2–6 ms.
