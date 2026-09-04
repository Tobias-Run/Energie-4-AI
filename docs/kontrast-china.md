# Kontrast China — Ausblick, nicht Modell

> **Was dieses Dokument ist und was nicht.** Ein Ausblick. Keine Zahl auf dieser Seite geht in
> das Modell ein, keine ist ein Kalibrierungsanker, keine erscheint in der Oberfläche. Die
> Quellen hier stehen bewusst **nicht** in [`sources.bib`](sources.bib): diese Datei ist das
> Register für Parameterquellen nach §8.3, und nichts in der Datenschicht ruht auf dem Folgenden.
> Wer das Modell prüft, kann dieses Dokument überspringen.
>
> **Verifikationshinweis.** Die Quellenlage ist hier zweigeteilt, und das Dokument hält beides
> auseinander. Der **Aktionsplan** in Abschnitt „Wechselseitige Befähigung" ist eine amtliche
> Primärquelle, die im Volltext vorlag und vollständig gelesen wurde. Die **beiden Artikel**, die
> den Anstoß gaben, waren dagegen aus der Arbeitsumgebung heraus nicht abrufbar — beide Domains
> sperrt der Egress-Proxy. Ihr Inhalt ist über Websuche rekonstruiert, nicht im Original gelesen;
> die Zahlen zu Investitionen und Netzausbau stammen deshalb aus den jeweils genannten Primär- und
> Sekundärquellen, nicht aus den Artikeln. Wo eine Angabe nur über die Rekonstruktion vorliegt,
> steht es an der Stelle dabei.

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
| Höchstspannungs-Fernleitungen (UHV) | 38 Strecken bis Ende 2024 in Betrieb; **15 weitere** geplant 2026–2030       | keine UHV-Spannungsebene; HVDC-Ausbau eine Klasse darunter (siehe unten)                                               |

**Der Punkt ist nicht das Geld.** Die beiden großen Zahlen liegen beim Marktkurs in ähnlicher
Größenordnung — rund 580 Mrd. USD gegen rund 584 Mrd. EUR —, aber dieser Vergleich ist nicht
wie-für-wie; die Korrektur dafür steht im nächsten Abschnitt. Unabhängig davon gilt: Der
Unterschied ist, dass die eine Zahl ein **Budget** ist und die andere ein **Bedarf**. Was Europa
fehlt, ist in diesem Modell nicht Kapital, sondern Durchsatz: die Genehmigungsdauer, die
Anschlusswarteschlange, die Reihenfolge, in der Projekte bedient werden. Genau dafür gibt es in
den chinesischen Zahlen keine Entsprechung — sie berichten Investition und Kilometer, nicht
Wartezeit.

Das ist auch der Grund, warum sich daraus **kein Regler ableiten lässt**. Ein „China-Modus" wäre
eine Behauptung über Genehmigungsdauern, für die keine der obigen Quellen eine Zahl liefert.

### Der Dollarvergleich ist nicht wie-für-wie

Die 580-Mrd.-Zahl oben entsteht durch Umrechnung zum Marktkurs (rund 6,9 RMB/USD). Das
unterschätzt China systematisch: Bauleistung — Arbeit, Grunderwerb, Tiefbau — hat dort ein
anderes Preisniveau als in Europa, und der Marktkurs bildet das nicht ab.

Die einschlägige Korrektur ist ein **Kaufkraftparitäts-Faktor (PPP)**. Die letzte offizielle
Erhebung — International Comparison Program (ICP) 2021, World Bank/OECD, Ergebnisse 2024
veröffentlicht — beziffert Chinas PPP-Umrechnungsfaktor fürs BIP auf **3,99 RMB je
internationalem Dollar**, rund 62 % des damaligen Marktkurses. Angewandt direkt auf die
RMB-Größen oben (nicht auf die bereits gerundeten USD-Werte):

|                                        | Marktkurs (~6,9 RMB/USD) | PPP (3,99 RMB/int.$, ICP 2021) |
| -------------------------------------- | ------------------------ | ------------------------------ |
| Fünfjahresplan 2026–2030 (4 Bio. RMB)  | ≈ 580 Mrd. USD           | ≈ **1,0 Bio. int.$**           |
| Jahresinvestition 2025 (>650 Mrd. RMB) | ≈ 89 Mrd. USD            | ≈ **163 Mrd. int.$**           |
| Jahresinvestition 2024 (600 Mrd. RMB)  | —                        | ≈ **150 Mrd. int.$**           |

Die Richtung ist eindeutig: **die PPP-korrigierte Zahl ist fast doppelt so groß** wie die
marktkursbasierte, deutlich über der europäischen 584-Mrd.-Bedarfszahl statt in „derselben
Größenordnung". Der Marktkurs-Vergleich oben untertreibt China.

_Diese 3,99 stammen aus der Websuche, nicht aus einem direkten Abruf von imf.org,
worldbank.org oder stats.gov.cn — alle drei sperrt der Egress-Proxy dieser Umgebung. Mehrere
unabhängige Treffer (World-Bank-Länderseite zum Indikator `PA.NUS.PPP`, chinesisches
Statistikamt) nennen übereinstimmend denselben Wert für 2021; das ist der Wert, der hier steht._

Zwei Einschränkungen gehören dazu, nicht als Fußnote, sondern weil sie die Zahl einordnen:

- **PPP ist eine Obergrenze der Korrektur, nicht die Korrektur selbst.** Hochspannungsanlagen,
  Umrichterstationen und Leittechnik sind handelbare Güter zu Weltmarktpreisen; nur der
  Arbeits- und Tiefbauanteil profitiert vom niedrigeren inländischen Preisniveau. Der tatsächliche
  physische Mehrwert liegt zwischen der Markt- und der PPP-Zahl — näher an welchem Ende hängt vom
  Lohn-/Materialanteil der Netzinvestition ab, den keine der hier zitierten Quellen aufschlüsselt.
- **Der ICP-Faktor stammt von 2021, die Investitionszahlen von 2024–2026.** Die nächste
  ICP-Erhebungsrunde ist noch nicht veröffentlicht; die Verzerrung durch die Zeitlücke ist
  ungemessen, aber gegenüber dem Markt/PPP-Unterschied selbst voraussichtlich klein.

**Das ändert die Schlussfolgerung des Abschnitts nicht — es verstärkt sie.** Der Punkt war und
bleibt Durchsatz, nicht Kapital: Die PPP-Korrektur vergrößert Chinas physischen Bau-Output
gegenüber Europas Bedarfszahl, ohne an der Aussage zu rühren, dass die chinesischen Zahlen
Investition und Kilometer berichten, nie Wartezeit. Ein größerer Kapitaleinsatz macht den
fehlenden Durchsatzvergleich nicht überflüssig — er unterstreicht, dass Geld hier ohnehin nicht
die bindende Größe ist.

## Warum Europa keine UHV-Leitungen hat

Die Zeile oben ist erklärungsbedürftig, weil sie leicht als Rückstand gelesen wird. Europa baut
sehr wohl Gleichstrom-Fernleitungen — nur eine Spannungsklasse tiefer und in anderem Zuschnitt:

|           | Changji–Guquan (China, seit 2019) | SuedLink (Deutschland, im Bau)   |
| --------- | --------------------------------- | -------------------------------- |
| Spannung  | ± 1.100 kV                        | ± 525 kV                         |
| Länge     | 3.324 km                          | rund 700–750 km                  |
| Kapazität | 12 GW                             | 4 GW (2 × 2 GW)                  |
| Bauweise  | Freileitung                       | **Erdkabel**                     |
| Kosten    | nicht belastbar erhoben           | rund 10 Mrd. EUR (Kabelverträge) |

Dass Europa in dieser Klasse nichts baut, hat überwiegend **strukturelle, nicht politische**
Gründe:

1. **Entfernung.** Die Mehrkosten der UHV-Technik amortisieren sich erst über sehr lange Strecken.
   Chinas Erzeugungsbasen in Xinjiang, der Inneren Mongolei und Sichuan liegen 2.000–3.000 km von
   den Lastzentren an der Ostküste. Europas längste plausible Korridore — Nordsee nach
   Süddeutschland, Iberien nach Mitteleuropa — liegen bei 1.000–1.500 km, meist darunter. Auf
   diesen Distanzen genügt ± 525 kV.
2. **Netztopologie.** Europa hat ein **vermaschtes** 400-kV-Netz, gewachsen zwischen vielen
   mittelgroßen Lastzentren, die historisch nahe an ihrer Erzeugung lagen. China hat **radiale**
   Punkt-zu-Punkt-Korridore von wenigen Riesenerzeugern zu wenigen Megastädten. Ein Maschennetz
   braucht Verstärkung und Kuppelkapazität, keine Überlagerungsebene. Genau deshalb ist die
   NTC-Matrix dieses Modells die richtige Abstraktion für Europa — und wäre für China die falsche.
3. **Zahl der Entscheider.** State Grid ist ein staatlicher Betreiber mit nationalem
   Planungsmandat. Europa hat rund 40 Übertragungsnetzbetreiber in über 30 Rechtsräumen; eine
   grenzüberschreitende Leitung braucht Kostenaufteilungsvereinbarungen und Genehmigungen in jedem
   davon. Eine Strecke über acht Provinzen eines Unternehmens ist nicht dasselbe wie eine über acht
   Regulierungsregime.
4. **Akzeptanz.** SuedLink ist der klarste Beleg: Die Trasse wurde weitgehend **unterirdisch**
   ausgeführt, was Kosten und Bauzeit erheblich erhöht hat. Europa zahlt einen hohen Aufpreis
   genau dafür, die Masten zu vermeiden, die China frei stellt. Das ist derselbe Widerstand, den
   der Genehmigungsregler dieses Modells mit neun Jahren abbildet.
5. **Andere Erzeugungsgeografie.** Europas Erneuerbare sind verteilt — Wind über viele Länder,
   Solar im Süden — und der Kontinent ist klein genug, dass Marktkopplung plus mäßige
   Kuppelkapazität den größten Teil des Ausgleichseffekts hebt.

**Und hier schließt sich der Kreis zum Modell.** Die Tornado-Analyse ergibt, dass `ntcUtilization`
den EU-Gesamtwert um **exakt 0,000** bewegt: Auf EU-Ebene verschiebt das Übertragungsnetz Last, es
entfernt sie nicht. Das ist keine Merkwürdigkeit des Modells, sondern dieselbe Aussage von der
anderen Seite — Europas Engpass sind die letzten Kilometer und die Genehmigung, nicht die 3.000
Kilometer dazwischen. Europa hat keine UHV-Leitungen, weil es Chinas Entfernungsproblem nicht hat.
Es hat ein Anschlussproblem, und dafür hilft keine Spannungsebene.

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

## Der Aktionsplan „Wechselseitige Befähigung von KI und Energie" (April 2026)

Anders als das Material oben ist dies eine **Primärquelle, vollständig gelesen**: 《关于促进人工智能与
能源双向赋能的行动方案》, gemeinsam erlassen von Entwicklungs- und Reformkommission (NDRC),
Energiebehörde (NEA), Industrieministerium (MIIT) und Datenbehörde, Aktenzeichen 国能发科技〔2026〕34号,
datiert 8. April 2026, veröffentlicht am 9. Mai 2026. Er setzt die Staatsratsvorgabe „KI+" (国发〔2025〕11号)
für den Energiesektor um.

**双向赋能 — „wechselseitige Befähigung" — steht im Titel.** Energie trägt die KI (Abschnitte 2–4),
und die KI soll den Energiesektor umbauen (Abschnitte 5–7). Beide Richtungen sind erklärtes Programm.

Zielmarken: bis **2027** ein „sicheres, grünes, wirtschaftliches" Energieversorgungssystem für die
KI-Entwicklung im Aufbau, Interaktionsfähigkeit zwischen sauberer Erzeugung und Rechenanlagen deutlich
verbessert; bis **2030** sollen die saubere Versorgung der Rechenanlagen und die energiespezifische
KI-Technik „Weltspitzenniveau" erreichen.

### Vier Stellen, an denen der Plan unsere Regler direkt berührt

| Unser Modell                                                                    | Was der Plan vorsieht                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sitingPolicy: 'renewables'` — Zubau neigt sich zu Systemen mit hohem EE-Anteil | Abschnitt 2 (一): Große Neue-Energie-Basen und die nationalen Rechenknoten werden **gemeinsam geplant**; Rechenanlagen sollen sich „in neuenergiereichen Regionen geordnet sammeln", ausdrücklich um „Neue Energie **vor Ort** aufzunehmen". Das ist unser Regler als tatsächliches Planungsinstrument — und die Begründung ist nicht Klimarhetorik, sondern **Abregelungsvermeidung**.                                            |
| `flexibilityShare` — angemeldete Last zählt nicht mehr zur Spitze               | Abschnitt 3 (七): **Klassifizierung der Anlagen nach Aufgabentyp**, Direktleitungsprivilegien nur für Anlagen „mit flexibler Regelfähigkeit". Abschnitt 4 (八): Preissignale steuern **netz- und regionenübergreifende Rechenlast-Verschiebung**; Anlagen sollen „als laststeitige flexibel regelbare Ressource am Netzbetrieb teilnehmen". (九): Zugang zu Regelenergie- und Demand-Response-Märkten, mehrjährige Grünstrom-PPAs. |
| **nicht modelliert** (Eigenerzeugung, Issue #3)                                 | Abschnitt 2 (二): **Kernkraft und Wasserstoff per Direktleitung** für Rechenanlagen; netzbildende Speicher (构网型储能) zur aktiven Stützung des Systems. Abschnitt 3 (四): Notstrom weg vom Dieselaggregat.                                                                                                                                                                                                                       |
| `pue2024` → `pueFloor`, `extraEfficiencyRate`                                   | Abschnitt 3 (六): PUE, EE-Anteil, Grünstromquote und **Abwärmenutzung** werden **Prüfkriterien der Genehmigung** für Neu- und Ausbauten. Das ist Effizienz als Zulassungsbedingung, nicht als technischer Trend — eine Unterscheidung, die unser Effizienzregler nicht trifft.                                                                                                                                                     |

Das ist der schärfste Gegensatz zum ENTSO-E-Befund. ENTSO-E beschreibt die Aufteilung der
Verantwortung im Colocation-Modell — der Betreiber kontrolliert die Anlage, nicht die Workloads der
Mieter — als **strukturelle Flexibilitätsbarriere**, und stellt fest, dass Lastverschiebung dort
„gegenwärtig nicht üblich" ist. Der chinesische Plan greift genau diese Barriere mit drei
Instrumenten an: Klassifizierung nach Aufgabentyp, Preissignal und Marktzugang. Europa hofft auf
Flexibilität; hier wird sie bepreist.

### Und jetzt die Einschränkung, die zählt

Die Rückrichtung — **wie der Energiesektor von KI profitiert** — ist im Plan ausführlich, aber
**vollständig qualitativ**. Der Sonderkasten in Abschnitt 5 listet einen langen Szenarienkatalog:
Prognose für Wind- und Solarleistung, intelligente Dispatch-Entscheidung für integrierte
Wasser-Wind-Solar-Großbasen, **automatische Erzeugung von Netzausbauplänen**, Zustandsbewertung und
Fehlerdiagnose von Hochspannungs- und HGÜ-Betriebsmitteln, Katastrophenfrühwarnung für wichtige
Übertragungskorridore, Simulation und Bewertung von **Strommarktregeln**, virtuelle Kraftwerke,
Fahrzeug-Netz-Interaktion, grüner Wasserstoff, bis hin zur Steuerung von Fusionsanlagen.

**In diesem gesamten Teil steht keine einzige quantifizierte Zielgröße.** Keine TWh, kein
Prozentsatz Effizienzgewinn, kein vermiedener Kapazitätsausbau. Die einzige Zahl im ganzen Dokument
neben den Jahreszahlen ist „**mehr als fünf** branchenspezifische Großmodelle" in Netz, Erzeugung,
Kohle und Öl/Gas (Abschnitt 7, 十七).

Für dieses Modell heißt das: Der Plan **behauptet** die wechselseitige Befähigung und benennt sehr
konkret, **wo** sie stattfinden soll — aber nicht, **wie viel** sie bringt. Er kann deshalb keinen
einzigen Parameter setzen. Wer aus „KI spart Energie im Netzbetrieb" eine Zahl im Modell machen
wollte, müsste sie erfinden; genau das verbietet die Ankerdisziplin aus #25.

Was er dagegen leistet: Er zeigt, dass drei Dinge, die unser Modell als **Regler**, als **Grenze**
oder gar nicht führt — Standortsteuerung, bepreiste Flexibilität, Eigenerzeugung hinter dem
Zählpunkt — anderswo geltendes Recht mit Ressortzuständigkeit, Finanzierungskanälen (REITs, grüne
Anleihen) und Monitoringpflicht sind.

## Was daraus folgen könnte — und was ausdrücklich nicht

Möglich, wenn jemand die Primärquellen beibringt:

- eine gesourcte Zeile in den Grenzen des Modells, die Europas Neun-Jahres-Genehmigung
  international einordnet
- langfristig eine vierte Benchmark-Reihe auf der **Angebots**seite, mit eigenem Datenbündel und
  eigenen Ankern (offen als Issue #33)

Nicht möglich und nicht beabsichtigt:

- ein Szenario „Europa baut wie China". Dafür bräuchte es Genehmigungsdauern, die keine der hier
  zitierten Quellen nennt.
- eine Zahl für den Nutzen von KI im Energiesystem. Der Aktionsplan benennt die Anwendungsfelder
  vollständig und den Ertrag mit keiner einzigen Größe.
- ein Regler „KI entlastet das Netz", auch nicht auf Basis der IEA-Zahlen. **Begründet nicht durch
  Vorsicht, sondern durch Messung** — siehe unten.
- irgendeine Zahl aus diesem Dokument in `data/`. Der Punkt des Kalibrierungs-Gates ist, dass
  Anker aus Quellen kommen, die das Modell widerlegen können — Pressematerial und
  Investitionsankündigungen leisten das nicht.

### Die Gegenrichtung ist bei der IEA beziffert — und trotzdem kein Regler

Anders als der chinesische Aktionsplan quantifiziert die IEA in _Energy and AI_ (2025) den Nutzen:
bis zu **175 GW zusätzliche Übertragungskapazität in bestehenden Leitungen** ohne Neubau, 30–50 %
kürzere Ausfalldauern durch KI-gestützte Fehlerortung, rund 1.400 Mt CO₂ weniger im Jahr 2035 im
Fall breiter Anwendung. Das ist dieselbe Publikation, die schon als `iea2025energyai` in
[`sources.bib`](sources.bib) steht. Es wäre also nicht einmal eine neue Quelle nötig.

Der Grund, es trotzdem nicht zu bauen, ist ein gemessener. Der IEA-Effekt ist im Kern eine
**höhere Auslastung vorhandener Leitungen** — und das ist in diesem Modell exakt der Parameter
`ntcUtilization`. Verdreifacht man ihn von 0,30 auf 0,90, ergibt sich im Jahr 2045:

| Größe                   | u = 0,30    | u = 0,90        |
| ----------------------- | ----------- | --------------- |
| EU-27 RZ-Bedarf         | 217,938 TWh | **217,938 TWh** |
| Emissionen Europa       | 25,69 Mt    | **25,69 Mt**    |
| Anschluss-Warteschlange | 0,007 GW    | **0,007 GW**    |
| Ausgelöste Flags        | LU          | **LU**          |
| höchster Stressindex    | PL 0,7499   | PL 0,6887       |

**Nichts bewegt sich außer dem länderscharfen Stressindex** (Polen −8 %). Der Grund ist derselbe,
aus dem Europa keine UHV-Leitungen hat: Übertragung **verschiebt** in diesem Modell Last, sie
entfernt sie nicht. Die Belastung durch KI landet dort, wo der Engpass bindet — beim Anschluss
neuer Last in einzelnen Ländern. Die Entlastung durch KI landet dort, wo er nicht bindet — bei der
Ausnutzung bestehender Korridore. **Die beiden Effekte gleichen sich nicht aus; sie treffen sich
nicht einmal.**

Ein Regler, der einen bezifferten Nutzen einbaut und dann null anzeigt, würde die Aussage eher
verdunkeln als schärfen. Die Aussage selbst — dass Last und Entlastung an verschiedenen Stellen des
Systems angreifen — ist der Befund und steht hier.

## Quellen

Anstoß (vom Projekteigner beigesteuert, **aus dieser Umgebung nicht abrufbar**):

- Uwe Kerkow, „Energieversorgung: Wie China sein Netz mit einer Roboterarmee umkrempelt",
  Telepolis, Mai 2026 —
  <https://www.telepolis.de/article/Energieversorgung-Wie-China-sein-Netz-mit-einer-Roboterarmee-umkrempelt-11304369.html>
- „Jetzt zieht China der Welt auch noch beim Stromnetz davon", Focus, Januar 2026 (Videobeitrag)
  —
  <https://www.focus.de/earth/jetzt-zieht-china-der-welt-auch-noch-beim-stromnetz-davon_0908335a-fe60-4de6-9a5d-f874f4e3dcb7.html>

Primärquelle, vollständig gelesen:

- 国家发展改革委、国家能源局、工业和信息化部、国家数据局，《关于促进人工智能与能源双向赋能的行动方案》
  (Aktionsplan zur Förderung der wechselseitigen Befähigung von künstlicher Intelligenz und
  Energie), 国能发科技〔2026〕34号, 8. April 2026, veröffentlicht 9. Mai 2026 —
  <https://ciecc.ec.com.cn/swyj/zcfg/2026/5/e52e63bed54d45e8abf1457.html>

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
- Changji–Guquan, ± 1.100 kV, 3.324 km, 12 GW —
  <https://www.nsenergybusiness.com/projects/changji-guquan-uhvdc-transmission-project/>
- SuedLink, ± 525 kV, rund 700 km, 4 GW, Erdkabel —
  <https://www.nsenergybusiness.com/projects/suedlink-hvdc-power-transmission-project/> und
  <https://www.enerdata.net/publications/daily-energy-news/germany-begins-construction-700-km-suedlink-transmission-project.html>
- Roboterbeschaffung 2026 —
  <https://interestingengineering.com/ai-robotics/china-8500-robots-power-grid>
- PPP-Umrechnungsfaktor China, ICP-Runde 2021 (3,99 RMB/int.$) —
  <https://data.worldbank.org/indicator/PA.NUS.PPP?locations=CN> und die Einordnung durch das
  chinesische Statistikamt (rund 62 % des Marktkurses 2021) —
  <https://www.stats.gov.cn/english/PressRelease/202406/t20240603_1954216.html>

Das European Grids Package selbst ist als `ec2025gridspackage` in [`sources.bib`](sources.bib)
geführt und parametrisiert den Genehmigungsregler; es ist die einzige hier berührte Quelle, die
tatsächlich ins Modell eingeht.
