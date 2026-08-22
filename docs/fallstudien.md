# Fallstudien mit dem Energie-4-AI-Simulator (P2)

**Stand:** 2026-08-19 · Datenbundle v2.1.0 · Erzeugt mit dem P2-Interface (Browser-Automation
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

## Was sich gegenüber der P1-Fassung geändert hat

Diese Fallstudien ersetzen die Version vom 2026-07-04 vollständig. Zwischen beiden Ständen
liegt die Datenhärtung aus [Issue #4](https://github.com/Tobias-Run/Energie-4-AI/issues/4):
richtungsabhängige NTC-Kapazitäten aus den ENTSO-E-abgeleiteten Ember-Daten, aus
Ember-Spitzenlastdaten **berechnete** statt geschätzte Spitzenlastfaktoren, und die
Aufspaltung der Erzeugung in Erneuerbare/Kernkraft/Fossil.

**Ein zentraler Befund der alten Fassung ist damit hinfällig.** Dort hieß es, unter
Boom-Bedingungen kippten 2045 neben Irland auch Litauen, Estland, Lettland, Luxemburg und
Malta in den Stress-Flag. Mit den berechneten Spitzenlastfaktoren ist das nicht mehr so:

| Land | Spitzenlastfaktor P1 (geschätzt) | P2 (aus Ember berechnet) | Flag 2045 im Boom |
| ---- | -------------------------------- | ------------------------ | ----------------- |
| MT   | 1,50                             | **1,98**                 | P1 ja → P2 nein   |
| LT   | 1,55                             | **1,69**                 | P1 ja → P2 nein   |
| EE   | 1,55                             | **1,62**                 | P1 ja → P2 nein   |
| LV   | 1,55                             | **1,45**                 | P1 ja → P2 nein   |
| LU   | 1,50                             | **1,24**                 | P1 ja → P2 ja     |
| IE   | 1,60                             | **1,66**                 | P1 ja → P2 ja     |

Ein höherer Spitzenlastfaktor bedeutet eine größere Spitzenlast im Nenner und damit einen
kleineren RZ-Anteil an der Spitze — genau die Größe, an der die Flags hängen. Die
baltischen Flags der P1-Fassung waren also **ein Artefakt geschätzter Parameter**, nicht
ein Modellergebnis. Dass ein einzelner, vorher ungesourcter Parameter die halbe
Ergebnistabelle umwirft, ist das stärkste Argument für die Quellenpflicht aus Spec §8.3 —
und der Grund, warum diese Fallstudien jetzt mit Datenversion im Kopf stehen.

---

## Fallstudie 1 — „Compute-Boom trifft Effizienz"

**Frage:** Was passiert, wenn die globale KI-Nachfrage 75 % über dem IEA-Basispfad wächst —
und wie viel davon können zusätzliche Effizienzgewinne der Rechenzentren (bessere Kühlung,
bessere Auslastung, effizientere Chips) wieder einfangen?

| Szenario              | Compute-Wachstum | Zusatz-Effizienz | Permalink                   |
| --------------------- | ---------------- | ---------------- | --------------------------- |
| Zentral (Referenz)    | ×1,00            | 0,0 %/Jahr       | `?y=2045&m=dcShareOfDemand` |
| A1 „Boom"             | ×1,75            | 0,0 %/Jahr       | `?g=1.75&y=2045&…`          |
| A2 „Boom + Effizienz" | ×1,75            | 2,0 %/Jahr       | `?g=1.75&e=0.02&y=2045&…`   |

**Ergebnis (EU-27, aus der UI-Kopfzeile):**

| Kennzahl                | Zentral         | A1 Boom             | A2 Boom + Effizienz |
| ----------------------- | --------------- | ------------------- | ------------------- |
| DC-Nachfrage 2035       | 153 TWh (5,4 %) | 217 TWh (7,4 %)     | 200 TWh (6,9 %)     |
| DC-Nachfrage 2045       | 219 TWh (6,7 %) | **333 TWh (9,9 %)** | **284 TWh (8,5 %)** |
| Stress-Flags 2045       | IE, LU          | IE, LU              | IE, LU              |
| Irland: DC-Anteil 2045  | 30,2 %          | 35,3 %              | 32,7 %              |
| Deutschland: DC-A. 2045 | 6,8 % (40 TWh)  | 8,7 % (51 TWh)      | 7,9 % (46 TWh)      |

**Befunde:**

1. **Der Boom verdreifacht den DC-Anteil an der EU-Stromnachfrage** gegenüber heute
   (~3 % → 9,9 % in 2045) und hebt die Nachfrage um +114 TWh über den Zentralpfad — grob
   der heutige Jahresverbrauch der Niederlande.
2. **2 %/Jahr Zusatz-Effizienz kauft ~49 TWh zurück** (333 → 284 TWh in 2045, −15 %). Der
   Effekt ist real, aber er ist ein Niveaueffekt: die Kurve wird nach unten verschoben, ihre
   Form ändert sich nicht.
3. **Die Flag-Liste bewegt sich in dieser Fallstudie überhaupt nicht.** Irland und Luxemburg
   sind in allen drei Welten geflaggt, und kein weiteres Land kommt hinzu. Effizienz wirkt
   im Modell auf die Menge, nicht auf die Verteilung — wer die Flags bewegen will, braucht
   die Hebel aus Fallstudie 3. _(Die P1-Fassung behauptete hier das Gegenteil; siehe oben.)_
4. **Irland bleibt in jeder Welt geflaggt** (35,3 % DC-Anteil an der Nachfrage in 2045 unter
   Boom, 32,7 % mit Effizienz): Bestandslast dominiert, Effizienz bei _Neuzugängen_ ändert
   daran wenig.

![Zentralszenario 2035](img/cs-A0-central-2035.png)
_Referenz: Zentralszenario 2035 — DC-Anteil an der Stromnachfrage._

![Boom 2045](img/cs-A1-boom-2045.png)
_A1 „Boom" 2045: 333 TWh, 9,9 % — Irland und Luxemburg geflaggt (rot gestrichelt)._

![Boom + Effizienz 2045](img/cs-A2-boomeff-2045.png)
_A2 „Boom + Effizienz" 2045: 284 TWh, 8,5 % — dieselbe Flag-Liste, niedrigeres Niveau._

---

## Fallstudie 2 — „Grids Package unter Boom-Bedingungen: Wer bekommt die Last?"

**Frage:** Die europäische Permitting-Reform („Grids Package", Genehmigung ~9 → ~5 Jahre)
soll den Netzanschluss beschleunigen. Ändert sie, _wie viel_ KI-Last Europa anschließt —
oder _wo_ sie landet? Getestet unter Boom-Bedingungen (×1,75), damit die Anschluss-Pipelines
überhaupt binden.

**Hebel:** B1 = `?g=1.75&y=2030&m=stressIndex` · B2 = zusätzlich `&r=1` (sonst identisch).

| Kennzahl                  | B1 ohne Reform          | B2 mit Reform                |
| ------------------------- | ----------------------- | ---------------------------- |
| EU-27 DC 2030 / 2035      | 146 / 217 TWh           | 146 / 217 TWh _(identisch)_  |
| Irland: DC 2030           | 9,5 TWh (Queue 0,02 GW) | **10,7 TWh (Queue geleert)** |
| Irland: DC 2035           | 13,5 TWh                | 14,8 TWh                     |
| Irland: Stress-Index 2030 | 0,68                    | 0,70                         |
| Schweden: DC 2035         | 17,4 TWh                | 17,3 TWh                     |
| Spanien: DC 2035          | 12,7 TWh                | 12,6 TWh                     |
| Norwegen: DC 2035         | 6,2 TWh                 | 6,1 TWh                      |

**Befunde:**

1. **Die Reform ändert das EU-Total nicht — sie ändert die Landkarte.** Verdrängte Nachfrage
   findet über den Spillover-Mechanismus ohnehin ein Zuhause (Nordics, Iberia). Mit Reform
   **behält der verstopfte Hub die Last**: Irland schließt bis 2030 rund 13 % mehr
   DC-Kapazität an (9,5 → 10,7 TWh) und leert seine Anschluss-Warteschlange; Schweden,
   Spanien und Norwegen geben spiegelbildlich ab, jeweils im Bereich von 0,1 TWh.
2. **Hub-Bindung hat einen Preis:** Irlands Stress-Index steigt mit Reform leicht
   (0,68 → 0,70 in 2030) — schnellere Genehmigung holt Last dorthin zurück, wo das System
   ohnehin am engsten ist.
3. **Die Umverteilung ist klein gegen die Gesamtmenge.** 1,2 TWh Verschiebung bei 146 TWh
   EU-Total sind unter 1 %. Die beiden Karten sind mit bloßem Auge nicht zu unterscheiden;
   der Unterschied steckt in Irlands Queue-Spalte in der Tabellenansicht, nicht im Bild.
4. **Ehrlicher Vorbehalt — inzwischen verschärft:** Der Reform-Effekt bleibt klein, und die
   Ursache ist nicht nur schlechte Datenlage. Beim Härten der Pipeline-Parameter hat sich
   gezeigt, dass **die Anschlussrestriktion im Modell gar nicht binden kann**: Die Pipeline
   wird aus dem eigenen Bedarf eines Landes gespeist und erzeugt mit drei Jahren Verzug
   ungefähr die Kapazität, die nachgefragt wird. Setzt man Dänemarks Anschlusskapazität auf
   null, behält es immer noch 8,63 von 13,40 TWh, und die Warteschlange bleibt exakt null.
   Der Satz „die Reform ändert die Landkarte, nicht das Total" ist deshalb **teilweise ein
   Artefakt** — kein Genehmigungsparameter kann das Total ändern, solange die Pipeline keine
   Kapazität zurückhalten kann. Details in [model-notes.md](model-notes.md), Abschnitt
   „Known defects"; Nachtrag zu
   ([Issue #4](https://github.com/Tobias-Run/Energie-4-AI/issues/4)).

![Boom ohne Reform 2030](img/cs-B1-boom-noreform-2030.png)
_B1: Boom ohne Reform, 2030, Stress-Index — Irlands Warteschlange ist noch gefüllt._

![Boom mit Reform 2030](img/cs-B2-boom-reform-2030.png)
_B2: Boom mit Reform, 2030 — europaweit praktisch identisches Bild (siehe Befund 3)._

---

## Fallstudie 3 — „Wohin mit der Last? Flexibilität und Standortsteuerung"

**Frage:** Fallstudie 1 zeigt, dass Effizienz die Flags nicht bewegt. Was bewegt sie dann?
Getestet werden die drei P2-Hebel, die an der Verteilung ansetzen — alle unter denselben
Boom-Bedingungen (×1,75), Metrik **RZ-Anteil an der Spitzenlast**, weil daran das
Flag-Kriterium hängt (Schwelle 15 %).

| Szenario                   | Hebel              | Permalink                        |
| -------------------------- | ------------------ | -------------------------------- |
| C1 Referenz (Boom)         | —                  | `?g=1.75&y=2045&m=dcShareOfPeak` |
| C2 20 % Lastflexibilität   | `flexibilityShare` | `…&f=0.2`                        |
| C3 Standort nach Erneuerb. | `sitingPolicy`     | `…&s=renewables`                 |
| C4 Standort gedeckelt      | `sitingPolicy`     | `…&s=capped`                     |

**Ergebnis (2045, EU-27):**

| Kennzahl             | C1 Referenz | C2 Flex 20 % | C3 Erneuerbare         | C4 Gedeckelt |
| -------------------- | ----------- | ------------ | ---------------------- | ------------ |
| EU-27 DC-Nachfrage   | 333 TWh     | 333 TWh      | 333 TWh                | 333 TWh      |
| Stress-Flags         | IE, LU      | **LU**       | **IE, LT, EE, LV, LU** | **keine**    |
| Emissionen (Europa)  | 29 Mt       | 29 Mt        | **27 Mt**              | 29 Mt        |
| LU: Anteil an Spitze | 24,8 %      | 19,9 %       | 26,4 %                 | 13,8 %       |
| IE: Anteil an Spitze | 18,1 %      | 14,4 %       | 17,4 %                 | 10,3 %       |
| LV: Anteil an Spitze | 14,2 %      | 11,3 %       | 16,3 %                 | 12,0 %       |

**Befunde:**

1. **Das EU-Total ist gegen alle drei Hebel vollkommen unempfindlich — 333 TWh in jedem
   Szenario.** Die Standortsteuerung verschiebt Last, sie entfernt keine. Wer diese Hebel
   an der Gesamtkurve misst, misst nichts. Das ist kein Schönheitsfehler des Modells,
   sondern seine zentrale Aussage über Standortpolitik.
2. **„Grüne" Standortsteuerung senkt Emissionen und verschärft den lokalen Stress
   gleichzeitig.** C3 lenkt Zubau in Systeme mit hohem Erneuerbaren-Anteil — das sind in
   Europa überwiegend die Nordics und das Baltikum. Ergebnis: Emissionen −2 Mt (−7 %), aber
   die Flag-Liste wächst von zwei auf **fünf** Länder, weil genau diese Systeme kleine
   Spitzenlasten haben. Lettland springt von 14,2 % auf 16,3 % und damit über die Schwelle.
   **Eine Politik, die nur auf den Strommix optimiert, verlagert das Adäquanzproblem in die
   Systeme, die es am wenigsten tragen können.**
3. **Lastflexibilität wirkt direkt auf das Flag-Kriterium.** 20 % nicht-firme DC-Last nimmt
   Irland von der Liste (18,1 % → 14,4 %, knapp unter die Schwelle). Luxemburg bleibt, weil
   es mit 24,8 % zu weit darüber liegt. Der Hebel ist damit wirksam, aber kein Freibrief.
4. **Nur der Deckel räumt alle Flags ab** — er ist zugleich der politisch teuerste Hebel und
   im Modell der grobste: Er ist dem Dubliner und Amsterdamer Moratorium nachgebildet und
   deckelt den DC-Anteil an der Landesnachfrage hart.
5. **Drei Länder liegen im Referenzfall innerhalb von drei Prozentpunkten unter der
   Schwelle** (LV 14,2 %, EE 13,6 %, LT 12,4 % gegen 15 %). Die Flag-Liste ist deshalb keine
   robuste Größe: Sie hängt an einem einzelnen Schwellenwert und an den Spitzenlastfaktoren.
   Wer sie zitiert, sollte den Tornado-Chart danebenlegen.

![Boom, Anteil an der Spitzenlast 2045](img/cs-C1-peakshare-2045.png)
_C1: Referenz. Luxemburg (24,8 %) und Irland (18,1 %) über der 15-%-Schwelle._

![Flexibilität 2045](img/cs-C2-flex-2045.png)
_C2: 20 % Lastflexibilität — Irland fällt unter die Schwelle, Luxemburg bleibt geflaggt._

![Standortsteuerung nach Erneuerbaren 2045](img/cs-C3-renewables-2045.png)
_C3: Standort nach Erneuerbaren — niedrigere Emissionen, aber das Baltikum kommt hinzu._

![Standortdeckel 2045](img/cs-C4-capped-2045.png)
_C4: Gedeckelte Standortwahl — keine Flags mehr._

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
