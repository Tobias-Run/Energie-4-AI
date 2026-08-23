# Kontrast China — Ausblick, nicht Modell

> **Was dieses Dokument ist und was nicht.** Ein Ausblick. Keine Zahl auf dieser Seite geht in
> das Modell ein, keine ist ein Kalibrierungsanker, keine erscheint in der Oberfläche. Die
> Quellen hier stehen bewusst **nicht** in [`sources.bib`](sources.bib): diese Datei ist das
> Register für Parameterquellen nach §8.3, und nichts in der Datenschicht ruht auf dem Folgenden.
> Wer das Modell prüft, kann dieses Dokument überspringen.
>
> **Verifikationshinweis.** Die beiden Artikel, die den Anstoß gaben, waren aus der
> Arbeitsumgebung heraus nicht abrufbar — beide Domains sperrt der Egress-Proxy. Ihr Inhalt ist
> über Websuche rekonstruiert, nicht im Original gelesen. Die Zahlen unten stammen deshalb aus
> den jeweils genannten Primär- und Sekundärquellen, nicht aus den beiden Artikeln. Wo eine
> Angabe nur über die Rekonstruktion vorliegt, steht es dabei.

## Warum das überhaupt hierher gehört

Das zentrale europäische Ergebnis dieses Modells ist, dass der bindende Engpass der
**Netzanschluss** ist, nicht die Erzeugung. Alles, was in den Szenarien etwas bewegt, bewegt es
dort: `pipelineTightness`, neun Jahre Genehmigungsdauer im Ausgangszustand, die Verzögerungskette
angekündigt → genehmigt → gebaut, die Warteschlangen in Dänemark, Irland, Italien und den
Niederlanden.

Das Modell hat für diesen Befund **keinen Vergleichspunkt**. China taucht nur auf der
Nachfrageseite auf (`data/v1/regional-benchmarks.json`: 100 → 232 → 296 TWh, IEA-verankert), auf
der Netzseite überhaupt nicht. Damit sieht Europas Neun-Jahres-Genehmigung im Werkzeug aus wie ein
Naturgesetz statt wie ein Politikergebnis. Der Kontrast unten korrigiert diesen Eindruck — ohne
zu behaupten, das Modell könne ihn rechnen.

## Die Größenordnungen

|                                     | China (State Grid)                                                           | Europa (EU)                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Netzinvestition, Fünfjahreszeitraum | **4 Bio. RMB ≈ 580 Mrd. USD** geplant 2026–2030, +40 % gegenüber dem Vorplan | **584 Mrd. EUR** _Bedarf_ bis 2030 (REPowerEU/Aktionsplan); im Grids Package inzwischen **1,2 Bio. EUR** für 2024–2040 |
| Jahresinvestition                   | > 650 Mrd. RMB ≈ 89 Mrd. USD (2025), nach 600 Mrd. (2024)                    | —                                                                                                                      |
| Höchstspannungs-Fernleitungen (UHV) | 38 Strecken bis Ende 2024 in Betrieb; **15 weitere** geplant 2026–2030       | kein vergleichbares Programm                                                                                           |

**Der Punkt ist nicht das Geld.** Die beiden großen Zahlen liegen in derselben Größenordnung —
rund 580 Mrd. USD gegen rund 584 Mrd. EUR. Der Unterschied ist, dass die eine ein **Budget** ist
und die andere ein **Bedarf**. Was Europa fehlt, ist in diesem Modell nicht Kapital, sondern
Durchsatz: die Genehmigungsdauer, die Anschlusswarteschlange, die Reihenfolge, in der Projekte
bedient werden. Genau dafür gibt es in den chinesischen Zahlen keine Entsprechung — sie berichten
Investition und Kilometer, nicht Wartezeit.

Das ist auch der Grund, warum sich daraus **kein Regler ableiten lässt**. Ein „China-Modus" wäre
eine Behauptung über Genehmigungsdauern, für die keine der obigen Quellen eine Zahl liefert.

## Die Roboterflotte

Der Anlass für dieses Dokument war ein Bericht über den Betrieb, nicht über den Ausbau: State Grid
budgetiert für 2026 rund **6,8 Mrd. RMB (≈ 1 Mrd. USD) für etwa 8.500 Roboter**, davon rund 5.000
vierbeinige Geräte, dazu humanoide und zweiarmige Radroboter für Arbeiten an
Hochspannungsleitungen. Genannte Erwartungen aus der Planung: über 90 % weniger
Personenexposition in Hochrisikolagen, rund 80 % weniger Sicherheitsvorfälle; ein 2025 an
spannungsführenden Leitungen erprobter Zweiarmroboter soll Arbeiten, die zuvor drei bis vier
Personen brauchten, mit ein bis zwei Personen am Boden erledigen (≈ 40 % Effizienzgewinn).

_Diese Angaben stammen aus der Rekonstruktion des Telepolis-Artikels über Websuche und aus
englischsprachiger Berichterstattung über dieselbe Beschaffung. Sie sind nicht gegen ein
Originaldokument von State Grid geprüft, und es sind Planungserwartungen, keine gemessenen
Ergebnisse._

Für dieses Modell ist daran eines relevant und eines nicht. **Nicht relevant:** die Robotik
selbst; Wartung ist keine Größe, die hier vorkommt. **Relevant:** dass Instandhaltungskapazität
überhaupt als Engpass behandelt wird. Europas Netzausbau hängt auch an Fachkräften, und dieses
Modell bildet das mit keinem Parameter ab — `pipelineTightness` fasst Genehmigung, Baukapazität
und Personal zu einer Zahl zusammen. Der chinesische Ansatz macht sichtbar, dass das eine
Vereinfachung ist, keine Vollständigkeit.

## Was daraus folgen könnte — und was ausdrücklich nicht

Möglich, wenn jemand die Primärquellen beibringt:

- eine gesourcte Zeile in den Grenzen des Modells, die Europas Neun-Jahres-Genehmigung
  international einordnet
- langfristig eine vierte Benchmark-Reihe auf der **Angebots**seite, mit eigenem Datenbündel und
  eigenen Ankern (offen als Issue #33)

Nicht möglich und nicht beabsichtigt:

- ein Szenario „Europa baut wie China". Dafür bräuchte es Genehmigungsdauern, die keine der hier
  zitierten Quellen nennt.
- irgendeine Zahl aus diesem Dokument in `data/`. Der Punkt des Kalibrierungs-Gates ist, dass
  Anker aus Quellen kommen, die das Modell widerlegen können — Pressematerial und
  Investitionsankündigungen leisten das nicht.

## Quellen

Anstoß (vom Projekteigner beigesteuert, **aus dieser Umgebung nicht abrufbar**):

- Uwe Kerkow, „Energieversorgung: Wie China sein Netz mit einer Roboterarmee umkrempelt",
  Telepolis, Mai 2026 —
  <https://www.telepolis.de/article/Energieversorgung-Wie-China-sein-Netz-mit-einer-Roboterarmee-umkrempelt-11304369.html>
- „Jetzt zieht China der Welt auch noch beim Stromnetz davon", Focus, Januar 2026 (Videobeitrag)
  —
  <https://www.focus.de/earth/jetzt-zieht-china-der-welt-auch-noch-beim-stromnetz-davon_0908335a-fe60-4de6-9a5d-f874f4e3dcb7.html>

Belege für die Zahlen oben:

- State Grid, 15. Fünfjahresplan, 4 Bio. RMB für 2026–2030 —
  <https://www.enerdata.net/publications/daily-energy-news/china-plans-us574bn-grid-upgrade-2030-40-last-five-year-plan.html>
  und <https://www.arcweb.com/blog/state-grids-plan-invest-rmb-4-trillion-during-chinas-15th-five-year-plan-period>
- Rekordinvestition 2025 (> 650 Mrd. RMB) —
  <https://gmk.center/en/news/chinas-state-grid-operator-plans-89-billion-in-investments-for-2025/>
- 15 neue UHV-Strecken bis 2030 —
  <https://www.enerdata.net/publications/daily-energy-news/china-plans-15-new-ultra-high-voltage-transmission-lines-2030.html>
- Europäischer Netzinvestitionsbedarf, 584 Mrd. EUR bis 2030 bzw. 1,2 Bio. EUR bis 2040 —
  <https://strategicenergy.eu/europe-grids-2030-rgi-new-package/>
- Roboterbeschaffung 2026 —
  <https://interestingengineering.com/ai-robotics/china-8500-robots-power-grid>

Das European Grids Package selbst ist als `ec2025gridspackage` in [`sources.bib`](sources.bib)
geführt und parametrisiert den Genehmigungsregler; es ist die einzige hier berührte Quelle, die
tatsächlich ins Modell eingeht.
