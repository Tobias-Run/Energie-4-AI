# Fallstudien mit dem Energie-4-AI-Simulator (P2)

**Stand:** 2026-08-22 · Datenbundle v2.2.0 · Erzeugt mit dem P2-Interface (Browser-Automation
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

## Drei Korrekturen, die frühere Befunde umgeworfen haben

Diese Fallstudien ersetzen die P1-Fassung vom 2026-07-04 und die erste P2-Fassung vollständig.
Drei Eingriffe haben Ergebnisse verändert, die vorher veröffentlicht waren — der dritte kam aus
einem externen Review ([Issue #7](https://github.com/Tobias-Run/Energie-4-AI/issues/7)).

**1. Berechnete statt geschätzte Spitzenlastfaktoren.** Die P1-Fassung behauptete, ein
Compute-Boom kippe 2045 neben Irland auch Litauen, Estland, Lettland und Malta in den
Stress-Flag. Diese Flags kamen aus geschätzten Spitzenlastfaktoren. Mit aus Ember-Daten
**berechneten** Faktoren (MT 1,50 → 1,98; LT 1,55 → 1,69; EE 1,55 → 1,62; LU 1,50 → 1,24)
verschwanden sie. Ein höherer Faktor bedeutet eine größere Spitzenlast im Nenner und damit
einen kleineren RZ-Anteil an der Spitze — genau die Größe, an der das Flag-Kriterium hängt.

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
Anschlussgrenze deckelt es bei 19,6 % der Landesnachfrage und 11,1 % der Spitzenlast, unter
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
| Stress-Flags 2045        | LU               | **EE, LV, LU**      | **LU**              |
| Irland: DC 2045          | 8,6 TWh (19,6 %) | 8,6 TWh (19,6 %)    | 8,6 TWh (19,6 %)    |
| Luxemburg: Anteil Spitze | 18,4 %           | 27,7 %              | 24,3 %              |
| Deutschland: DC 2045     | 40,5 TWh (7,0 %) | 53,8 TWh (9,1 %)    | 47,9 TWh (8,2 %)    |

**Befunde:**

1. **Der Boom hebt den DC-Anteil an der EU-Stromnachfrage auf 9,9 %** und die Nachfrage um
   +118 TWh über den Zentralpfad — grob der heutige Jahresverbrauch der Niederlande.
2. **2 %/Jahr Zusatz-Effizienz kauft ~53 TWh zurück** (335 → 283 TWh, −16 %) und **räumt
   Estland und Lettland von der Flag-Liste** — von drei geflaggten Ländern bleibt eines. Anders als in der ersten P2-Fassung wirkt Effizienz damit nicht nur auf die Menge,
   sondern auch auf die Ränder — weil die gedeckelten Hubs Last in kleine Systeme abdrängen,
   wo Mengenreduktion über Schwellen entscheidet. Dass hier drei statt eines Landes fallen,
   liegt an der Korrektur des Spitzenlast-Nenners (Issue #30, B1): Die baltischen Systeme
   lagen vorher knapp unter der 15-%-Linie, weil ihr RZ-Anteil an der Spitze systematisch zu
   klein gerechnet wurde.

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
4. **Luxemburg trägt den Boom stattdessen:** 18,4 % → 27,7 % der Spitzenlast. Klein,
   importabhängig, ohne Anschlussbeschränkung im Modell — es nimmt auf, was Irland abweist.

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
| Stress-Flags         | EE, LV, LU  | **LU**       | **LT, EE, LV, LU** | **LU**       |
| Emissionen (Europa)  | 30 Mt       | 30 Mt        | **28 Mt**          | 30 Mt        |
| LU: Anteil an Spitze | 27,7 %      | 23,5 %       | 28,8 %             | 15,4 %       |
| LV: Anteil an Spitze | 16,5 %      | 13,6 %       | 18,2 %             | 13,2 %       |
| EE: Anteil an Spitze | 16,6 %      | 13,8 %       | 19,1 %             | 11,9 %       |
| LT: Anteil an Spitze | 15,0 %      | 12,4 %       | 17,8 %             | 11,2 %       |

> **Diese Tabelle wurde zweimal an einem Tag neu gerechnet** — nach der Korrektur des
> Spitzenlast-Nenners ([#30](https://github.com/Tobias-Run/Energie-4-AI/issues/30), B1) und nach
> der Überarbeitung der Vorlaufzeit ([#28](https://github.com/Tobias-Run/Energie-4-AI/issues/28)).
> Litauen war dabei zweimal auf beiden Seiten der 15-%-Schwelle. Die Befunde unten stehen
> korrigiert statt still ersetzt; welcher Befund dabei gefallen ist, ist jeweils vermerkt.

**Befunde:**

1. **Das EU-Total ist gegen alle drei Hebel unempfindlich — 335 TWh in jedem Fall.** Die
   Standortsteuerung verschiebt Last, sie entfernt keine. Wer diese Hebel an der Gesamtkurve
   misst, misst nichts. _(Unverändert durch beide Korrekturen.)_
2. **„Grüne" Standortsteuerung senkt Emissionen und verschärft den lokalen Stress
   gleichzeitig.** C3 lenkt Zubau in Systeme mit hohem Erneuerbaren-Anteil — in Europa
   überwiegend Nordics und Baltikum. Emissionen −2 Mt (−7 %), Flag-Liste von drei auf **vier**
   Länder, und die Überschreitung wird tiefer: Estland 16,6 % → **19,1 %**, Litauen 15,0 % →
   **17,8 %**. **Eine Politik, die nur auf den Strommix optimiert, verlagert das
   Adäquanzproblem in die Systeme, die es am wenigsten tragen können.**
3. **Lastflexibilität wirkt direkt auf das Flag-Kriterium.** 20 % nicht-firme DC-Last nimmt
   **Estland und Lettland** von der Liste; von drei geflaggten Ländern bleibt eines. Luxemburg
   bleibt mit 23,5 % zu weit über der Schwelle. Wirksam, aber kein Freibrief.
4. **Korrektur: Der Deckel räumt _nicht_ alle Flags ab.** Eine frühere Fassung behauptete das.
   Gemessen bleibt Luxemburg unter C4 bei **15,4 %** — über der 15-%-Schwelle statt darunter.
   Der politisch teuerste Hebel des Modells löst das Problem nicht vollständig, er bringt es an
   die Grenze.
5. **Die Flag-Liste hängt an einem einzelnen Schwellenwert, und das ist hier zweimal
   vorgeführt worden.** Litauen liegt im Referenzfall bei 15,0 %, Luxemburg unter C4 bei
   15,4 %; beide entscheiden sich an der ersten Nachkommastelle. Zwei Modellkorrekturen, von
   denen keine die Mengen nennenswert bewegt hat, haben Litauen zweimal über und unter die
   Linie geschoben. Wer die Flag-Liste zitiert, sollte den Tornado-Chart danebenlegen — sie ist
   eine Schwellenaussage, keine robuste Größe.

![Boom, Anteil an der Spitzenlast 2045](img/cs-C1-peakshare-2045.png)
_C1: Referenz. Luxemburg (27,7 %), Estland (16,6 %) und Lettland (16,5 %) über der 15-%-Schwelle; Litauen knapp darunter bei 15,0 %._

![Flexibilität 2045](img/cs-C2-flex-2045.png)
_C2: 20 % Lastflexibilität — Estland und Lettland fallen unter die Schwelle, Luxemburg bleibt geflaggt._

![Standortsteuerung nach Erneuerbaren 2045](img/cs-C3-renewables-2045.png)
_C3: Standort nach Erneuerbaren — niedrigere Emissionen, aber das Baltikum rückt tiefer über die Schwelle._

![Standortdeckel 2045](img/cs-C4-capped-2045.png)
_C4: Gedeckelte Standortwahl — nur noch Luxemburg, und das knapp bei 15,4 %._

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
