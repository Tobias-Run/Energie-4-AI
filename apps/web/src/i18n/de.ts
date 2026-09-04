import type { en } from './en.js';

/**
 * German locale. Typed against the English reference, so a missing key fails the build.
 *
 * Translation principle for this file: the caveats are load-bearing. Where English hedges
 * ("a lower bound", "not a forecast", "an optimistic reading"), German hedges just as hard —
 * shortening a qualifier to make a sentence flow would change what the tool claims. Technical
 * terms that the German energy-policy literature uses in English (NTC, PUE, Monte Carlo,
 * Permitting, Demand Response) are left in English rather than invented anew.
 */
export const de: typeof en = {
  app: {
    title: 'Energie-4-AI',
    byline: 'GridSim — KI-Rechenzentren und die europäische Stromversorgung, 2026–2045',
    language: 'Sprache',
    mapMetric: 'Kartenmetrik',
    summary: 'EU-27 in {year}: RZ {twh} TWh · {share}% der Nachfrage · {flags}',
    noFlags: 'keine Stress-Flags',
    runtime: 'Der komplette 20-Jahres-Lauf rechnet in {ms} ms, vollständig in Ihrem Browser.',
    limitsTitle: 'Modellgrenzen (bitte lesen):',
    limits:
      'Jahresenergiebilanzen auf einem vereinfachten NTC-Netz — kein Lastfluss, keine untertägige Auflösung; Länderauflösung (Hubs sind reine Kartenannotationen); viele Länderparameter sind als expert-guess markierte Näherungen. Die Szenarien sind Explorationswerkzeuge, keine Prognosen. Jede Zahl ist quellenverfolgt — öffnen Sie den Annahmen-Bereich. Externe Daten werden als zitierte Fakten für wissenschaftliche Forschung und Bildung genutzt (Zitatrecht) — siehe docs/DISCLAIMER.md.',
    skipToContent: 'Zum Hauptinhalt springen',
  },
  levers: {
    title: 'Szenario-Hebel',
    reset: 'Auf Zentralszenario zurücksetzen',
    computeGrowth: 'Wachstum der Rechenlast',
    computeGrowthNote: 'Multiplikator auf den globalen IEA-Basispfad (Standard ×1,00).',
    efficiency: 'Zusätzliche Effizienzgewinne',
    efficiencyNote:
      'Verbesserung der Energie pro Rechenleistung über den Basispfad hinaus (Standard 0,0 %/Jahr).',
    permitting: 'Permitting-Reform („Grids Package")',
    permittingNote:
      'Netzgenehmigung ~9 Jahre → ~5 Jahre (Standard aus = heutiger Ausgangszustand).',
    siting: 'Standortpolitik',
    sitingMarket: 'Marktgetrieben',
    sitingMarketNote: 'Zubau folgt allein bestehenden Clustern und dem Strompreis.',
    sitingRenewables: 'An Erneuerbare gekoppelt',
    sitingRenewablesNote:
      'Zusätzlich zu Systemen mit hohem Erneuerbaren-Anteil gelenkt. Maßgeblich ist der Erzeugungsmix, nicht die CO₂-Intensität — das kernkraftlastige Frankreich verliert deshalb Anteile, obwohl es emissionsarm ist.',
    sitingCapped: 'Gedeckelte Hubs',
    sitingCappedNote:
      'Ein Land nimmt keine neuen Anschlüsse mehr an, sobald die RZ-Last {cap} % seiner nationalen Nachfrage überschreitet — die Moratorien von Dublin und Amsterdam, keine EU-Quote. Bestandslast bleibt bestehen.',
    flexibility: 'Flexible Anschlussvereinbarungen',
    flexibilityNote:
      'Anteil der RZ-Last, der sich abregeln lässt. Eine Zusage, zwei Folgen: Diese Last zählt nicht mehr zur Spitzenlast, und sie kommt {saved} Jahre früher ans Netz — denn die Bereitschaft zur Abregelung ist genau das, was den früheren Anschluss erkauft. Das Modell unterstellt, dass genau dann abgeregelt wird, wenn es nötig ist — ENTSO-E nennt für den zitierten Fall 40–70 h/Jahr, das hier ist also die optimistische Lesart, weshalb der Bereich bei 50 % endet.',
    capture: 'Europas Anteil am globalen Zubau ab 2030',
    captureFollowsData: 'folgt den Daten',
    captureNote:
      'Das Modell unterstellt, dass Europa vor 2030 {pre} % des globalen RZ-Wachstums auf sich zieht (IEA) und danach nur noch {post} % (Ember) — ein Rückgang um 24 %, den es bislang ohne Widerspruchsmöglichkeit behauptet hat, obwohl dieser Parameter zu den größten Treibern des gesamten 2045er-Korridors zählt. Der Rückgang kann stimmen; er ist eine Projektion, keine Konstante. ENTSO-E verweist darauf, dass der EU Cloud and AI Development Act die europäische Rechenzentrumskapazität in fünf bis sieben Jahren verdreifachen soll — das zieht in die Gegenrichtung. Der Bereich ist die publizierte Unsicherheitsspanne. Unberührt folgt der Regler den Daten und bleibt im Monte-Carlo-Modus unsicher; wer ihn bewegt, hat einen Wert behauptet.',
    priceSensitivity: 'Preissensitivität der Standortwahl',
    priceSensitivityNote:
      'Wie stark der Strompreis steuert, wo Last landet. Bei ×0 ignoriert die Standortwahl den Preis und folgt bestehenden Clustern; hohe Werte ziehen Last in günstige Systeme (Nordics, Iberien).',
  },
  metrics: {
    dcShareOfDemand: 'RZ-Anteil an der Stromnachfrage',
    dcShareOfDemandNote:
      'Rechenzentrumsenergie geteilt durch die gesamte nationale Nachfrage (RZ + exogene Grundlast). Das Grundlastwachstum folgt einem TYNDP-artigen Pfad, das RZ-Wachstum dem IEA-verankerten Capture-Modell.',
    dcEnergyTwh: 'RZ-Stromnachfrage',
    dcEnergyTwhNote:
      'Jährlicher Stromverbrauch der Rechenzentren. Neue Kapazität wird über die Gravitation des Bestands und den relativen Strompreis verteilt, begrenzt durch die Netzanschluss-Pipelines.',
    stressIndex: 'Netz-Stressindex',
    stressIndexNote:
      'Jahresnachfrage geteilt durch alle verfügbaren Ressourcen (Erneuerbare + Kernkraft + Bestands-Firmerzeugung + Gaskapazität + NTC-Importfähigkeit). Die Importfähigkeit ist richtungsabhängig und wächst entlang belegter Stützjahre 2024/2030/2040. Ein grober Adäquanz-Näherungswert — kein Lastfluss, keine untertägige Auflösung.',
    dcShareOfPeak: 'RZ-Anteil an der Spitzenlast',
    dcShareOfPeakNote:
      'Firme (Inferenz-)Rechenzentrumslast als Anteil der nationalen Spitzenlast. Dies ist das Kriterium, das die Stress-Flags am Ende des Horizonts tatsächlich auslöst — im Zentralszenario überschreitet es niemand, aber Luxemburg (14,5 %) und Irland (14,2 %) liegen am nächsten an der Schwelle, während ihre Adäquanzquoten unauffällig bleiben. Unter stärkeren Wachstumsannahmen ist dies, wo die Flags erscheinen. Der Flexibilitätshebel wirkt direkt darauf.',
    renewablesShare: 'Anteil Erneuerbarer an der Erzeugung',
    renewablesShareNote:
      'Erneuerbare (inkl. Wasserkraft und Bioenergie) geteilt durch die gesamte heimische Erzeugung. Erzeugungsseitige Rechnung: Importe werden keiner Mix-Kategorie zugeordnet (NTC-Modell ohne Flussverfolgung) — ziehen Sie den Netto-Importanteil daneben heran.',
    fossilShare: 'Fossiler Anteil an der Erzeugung',
    fossilShareNote:
      'Gaseinsatz plus Bestands-Firmerzeugung (Kohle, Braunkohle, Öl) geteilt durch die gesamte heimische Erzeugung. Erzeugungsseitig; Importe nicht zugeordnet.',
    netImportShare: 'Netto-Importanteil an der Nachfrage',
    netImportShareNote:
      'Anteil der nationalen Nachfrage, der nicht durch heimische Erzeugung gedeckt ist. Wird neben dem Erzeugungsmix gezeigt, weil ein erzeugungsseitiger Mix bei starken Importeuren (z. B. Luxemburg) wenig aussagt.',
    emissionsMt: 'Näherungswert Emissionen Stromsektor',
    emissionsMtNote:
      'Als Residuallast eingesetztes Gas × 0,37 Mt/TWh plus Bestands-Firmerzeugung × 0,85 Mt/TWh. Dies sind Direktverbrennungsfaktoren, verankert auf IPCC AR5; sie liegen konstruktionsbedingt unter den Lebenszyklus-Medianen, da vorgelagerte Methanemissionen, Brennstofftransport und Anlagenbau nicht erfasst sind — der Wert ist damit eine Untergrenze.',
  },
  map: {
    label: 'Europakarte, {metric} in {year}',
    stressFlag: 'Stress-Flag',
    stressFlagTooltip: 'Stress-Flag (RZ-Anteil an der Spitzenlast oder Adäquanzschwelle)',
    notShown:
      '{list} simuliert, aber in dieser Kartenauflösung nicht dargestellt — siehe Tabellenansicht.',
    clusters: 'Rechenzentrums-Cluster',
    clusterLocations: 'Standorte der Rechenzentrums-Cluster',
    markerSize: 'Markergröße = Größenklasse des Internetknotens',
    driverPeering: 'vernetzungsgetrieben',
    driverPower: 'stromgetrieben',
    driverBoth: 'beides',
    exchange: 'Internetknoten',
    noExchange: 'Kein Internetknoten an diesem Standort',
    peakTraffic: 'Spitzenverkehr {tbps} Tbit/s (Stand {asOf})',
    sizeClassOnly: 'Größenklasse {sizeClass} — kein aktueller veröffentlichter Wert verifiziert',
    clusterDriver: 'Treiber des Clusters',
    driverPeeringLong: 'Netzvernetzung',
    driverPowerLong: 'Strom und Kühlklima',
    driverBothLong: 'Vernetzung und Strom',
    countryLevelNote: 'Länderebene — das Modell löst einzelne Hubs nicht auf',
    markerLabel: 'Rechenzentrums-Cluster {name}, {exchange}, {driver}',
    markerExchange: 'Internetknoten {ixp}',
    markerNoExchange: 'kein Internetknoten',
    queue: 'Warteschlange',
    imports: 'Importe',
  },
  charts: {
    demandTitle: 'EU-27 Stromnachfrage der Rechenzentren (TWh)',
    clickToJump: 'Klicken Sie ins Diagramm, um zu einem Jahr zu springen.',
    mixTitle: 'EU-27 Erzeugungsmix (TWh, erzeugungsseitig)',
    mixRenewables: 'Erneuerbare',
    mixNuclear: 'Kernkraft',
    mixFossil: 'Fossil',
    mixImportsNote: 'Importe nicht zugeordnet (keine Flussverfolgung)',
    mixLabel: 'EU-27 Erzeugungsmix nach Kategorie im Zeitverlauf',
    benchmarkTitle: 'Vergleich des RZ-Nachfragewachstums (Index, 2024 = 100)',
    benchmarkEu: 'EU-27 (Modell)',
    benchmarkUs: 'USA',
    benchmarkCn: 'China',
    benchmarkRow: 'Übrige Welt',
    benchmarkLabel:
      'Wachstum der Rechenzentrumsnachfrage: EU-27-Modellergebnis gegenüber veröffentlichten Projektionen für USA, China und übrige Welt, indexiert auf 2024',
    benchmarkNote:
      'USA/China/übrige Welt: IEA-Basisfall-Stützpunkte (USA durch LBNL/EPRI bestätigt); die veröffentlichten Projektionen enden {horizon} — die Linien brechen dort ab, es wird nicht extrapoliert. Die regionale Aufteilung für 2035 ist expert-guess innerhalb des globalen IEA-Rahmens.',
    corridorTitle: 'EU-27 RZ-Nachfrage — Unsicherheitskorridor (TWh)',
    corridorBand: 'p10–p90 über {runs} Läufe',
    corridorMedian: 'Median der Stichprobe',
    corridorCentral: 'Zentrallauf',
    corridorLabel:
      'Unsicherheitskorridor der EU-27 RZ-Nachfrage, 10. bis 90. Perzentil über {runs} Monte-Carlo-Läufe',
    corridorHover: '{year}: {p10}–{p90} TWh (Median {p50}, zentral {central})',
  },
  tornado: {
    title: 'Parameter-Sensitivität in {year}',
    measuredOn: 'Gemessen an',
    label: 'Parameter-Sensitivität für {target} in {year}, nach Spannweite sortiert',
    central: 'zentral: {value} {unit}',
    none: 'Kein Parameter im Bandbreitensatz bewegt diese Kennzahl.',
    note: 'Jeder Balken umspannt {target}, wenn allein dieser Parameter an seine Bandbreitengrenzen geschoben wird und alle übrigen zentral bleiben — die Balken sind damit vergleichbar, erfassen aber keine Wechselwirkungen. Der Korridor darüber, der alle Parameter gemeinsam sampelt, tut das. Ein ? markiert einen Parameter, dessen Bandbreite eine Expertenschätzung statt einer veröffentlichten Angabe ist.',
    countNote:
      'Diese Kennzahl zählt ganze Regionen, ihre Auflösung beträgt also eine Region — gleich lange Balken bedeuten „verschiebt die Zahl um eins", nicht „gleich wichtig".',
    inert:
      'Ohne Wirkung auf diese Kennzahl ({count}): {list}. Das ist eine Aussage über diese Kennzahl, nicht über den Parameter — wechseln Sie oben das Maß, um zu sehen, wo sie wirken.',
    thresholdHeading: 'Definitorische Schwellenwerte (keine physikalische Unsicherheit)',
    thresholdNote:
      'Diese Balken sagen: die Wahl der Schwelle ist offen — nicht, dass der Wert in der Welt unsicher ist. Eine andere Art von Nicht-Wissen, deshalb getrennt statt in das Band oben gemischt.',
    targetDemand: 'EU-27 Rechenzentrumsnachfrage',
    targetFlags: 'Anzahl der Regionen mit Stress-Flag',
    targetEmissions: 'Emissionen des europäischen Stromsektors',
  },
  uncertainty: {
    title: 'Unsicherheit',
    toggle: 'Monte-Carlo-Modus (200 Läufe)',
    off: 'Ersetzt die einzelne Nachfragelinie durch einen p10–p90-Korridor und zeigt, welche Parameter ihn treiben. Dauert etwa eine halbe Sekunde.',
    sampled:
      '{runs} Läufe über {params} quellenverfolgte Parameter-Bandbreiten in {ms} ms gesampelt. Seed {seed} — derselbe Seed reproduziert diesen Korridor exakt.',
    flagTitle: 'Stress-Flag in {year}',
    ofRuns: 'der Läufe',
    noFlags: 'In keinem Lauf wurde eine Region geflaggt.',
    frequencyNote:
      'Eine Häufigkeit, keine Prognose: Sie sagt, wie oft das Flag über die gesampelten Bandbreiten hinweg auslöst — nicht, wie wahrscheinlich das Ergebnis in der Welt ist.',
  },
  compare: {
    title: 'Szenarien vergleichen — EU-27 RZ-Nachfrage (TWh)',
    emptyTitle: 'Szenarien vergleichen',
    empty:
      'Heften Sie die aktuelle Hebelstellung an, um bis zu drei Szenarien nebeneinander zu vergleichen.',
    pinFirst: '+ Aktuelles Szenario anheften',
    pin: '+ Aktuelles anheften',
    maxReached: 'Maximal 3',
    remove: '{label} entfernen',
    label: 'Vergleich von {count} angehefteten Szenarien, EU-27 Rechenzentrumsnachfrage',
    colScenario: 'Szenario',
    colLevers: 'Hebel',
    colDemand: 'EU-RZ {year}',
    colSaturated: 'Am stärksten gesättigt',
    colFlags: 'Flags',
    scenarioName: 'Szenario {letter}',
    centralScenario: 'Zentralszenario',
    overlapNote:
      'Diese Szenarien enden innerhalb von 1 % voneinander, die Linien liegen daher fast exakt übereinander. Das ist das Ergebnis, kein Darstellungsfehler: Standortpolitik und Permitting verteilen Last um, statt zu verändern, wie viel davon in Europa ankommt. Der Unterschied steckt in den beiden rechten Spalten.',
    note: 'Angeheftete Szenarien sind deterministische Zentralläufe. Unsicherheitskorridore bleiben beim aktiven Szenario — drei übereinandergelegte Bänder sind unlesbar, und drei Monte-Carlo-Ziehungen würden bei jeder Hebelbewegung rund zwei Sekunden kosten.',
    unpinned: 'Die aktuelle Einstellung ({levers}) ist noch nicht angeheftet.',
  },
  share: {
    title: 'Teilen & Export',
    copyLink: 'Link kopieren',
    copied: '✓ Kopiert',
    csv: 'Lauf als CSV',
    mapSvg: 'Karte SVG',
    mapPng: 'Karte PNG',
    note: 'Der Link trägt das vollständige Szenario — dieses Werkzeug speichert nichts auf Ihrem Gerät. Die CSV führt Hebel und Datenbundle-Version im Kopf, sodass sich eine heruntergeladene Tabelle auf den Lauf zurückführen lässt, der sie erzeugt hat.',
  },
  story: {
    title: 'Story-Modus',
    intro:
      'Geführte Szenarien. Jedes stellt die Hebel für Sie ein und endet damit, zu benennen, was das Modell nicht sagen kann.',
    back: '← Zurück',
    next: 'Weiter →',
    exit: 'Story verlassen',
    progress: '{title} — {step}/{total}',
  },
  drawer: {
    summary: 'Annahmen hinter diesen Zahlen',
    sources: 'Quellen:',
    footer:
      'Quellen-IDs verweisen auf docs/sources.bib; expert-guess markiert Parameter ohne veröffentlichte Quelle (§8.3). Externe Daten sind zitierte Fakten für wissenschaftliche Forschung und Bildung — vollständige Erklärung. Modellstruktur: Modellnotizen.',
    calibrationTitle: 'Kalibrierungs-Gate V1',
    calibrationStatusFailing: 'NICHT BESTANDEN — {missed} von {total} unabhängigen Ankern verfehlt',
    calibrationStatusPassing: 'bestanden — {total} von {total} unabhängigen Ankern erreicht',
    calibrationIntro:
      'Das Modell wird an veröffentlichten Ankerwerten mit ±10 % gemessen. Anker, die es durch die eigene Konstruktion reproduziert — das globale Niveau 2030 und der EU-Anteil wurden auf sie angepasst —, dienen nur noch als Regressionsschutz und zählen für dieses Urteil nicht mit.',
    calibrationMissedLabel: 'Anker, die das Modell nicht reproduziert',
    calibrationSpread:
      'Veröffentlichte Schätzungen für Europas RZ-Strombedarf 2030: 109 TWh (IEA), mindestens 134 TWh (ENTSO-E) und 168 TWh (Ember/ICIS). Dieses Modell folgt ENTSO-E und liefert {model} TWh. Die Spannweite von 54 % zwischen den Quellen ist größer als die Wirkung jedes Reglers in diesem Panel.',
    rowCapturePre: 'EU-Anteil am globalen RZ-Zubau (vor 2030)',
    rowCapturePost: 'EU-Anteil am globalen RZ-Zubau (ab 2030)',
    rowSaturation: 'Globale Bedarfsobergrenze bei dieser Wachstumseinstellung',
    rowPue: 'Durchschnittlicher PUE 2024 → Untergrenze (nur Umrechnung — treibt keine Nachfrage)',
    rowItUtilization:
      'Mittlere IT-Auslastung (dieselbe Umrechnung; der Kapazitätsanker misst eine andere Größe — Issue #34)',
    rowFirm: 'Firmer Anteil der RZ-Last (nur Spitzenlast-Kriterium)',
    rowConnectionFactor:
      'Anschluss-Lastfaktor (Vertragskapazität eines Landes, nicht das Spitzenkriterium)',
    rowPermitting: 'Genehmigungsdauer (Ausgangszustand / Reform)',
    rowFlexConnection: 'Zeitgewinn durch flexible Anschlussvereinbarung',
    rowNtc: 'Mittlere NTC-Auslastung',
    rowCongestion: 'Engpasskosten-Ausgangswert (EU, 2024)',
    rowGas: 'Emissionsfaktor Gas',
    rowMix: 'Bilanzierung des Erzeugungsmix',
    rowMixValue: 'erzeugungsseitig; Importe nicht zugeordnet',
    rowBenchmark: 'Benchmark-Stützpunkte USA/CN/übrige Welt 2024/2030',
    rowBenchmarkValue: 'IEA-Basisfall',
    rowBenchmarkCorroboration: 'Bestätigung des USA-Benchmarks',
    rowBenchmark2035: 'Benchmark-Stützpunkte 2035 (regionale Aufteilung)',
    rowBenchmark2035Value: 'innerhalb des globalen IEA-Rahmens',
  },
  table: {
    summary: 'Tabellenansicht ({year}, alle Länder)',
    country: 'Land',
    dcTwh: 'RZ (TWh)',
    share: 'Anteil',
    stress: 'Stress',
    queue: 'Warteschlange (GW)',
  },
  time: {
    year: 'Jahr',
    play: 'Abspielen',
    pause: 'Pause',
    playLabel: 'Jahre animieren',
    sliderLabel: 'Jahr, {min} bis {max}',
  },
};
