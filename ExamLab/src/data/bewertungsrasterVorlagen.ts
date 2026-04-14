/**
 * Standard-Bewertungsraster-Vorlagen mit Niveaustufen.
 * 12 Vorlagen: 5 fachübergreifend + 4 WR-spezifisch + 3 andere Fachschaften.
 * Punkte sind Beispiel-Werte — werden beim Laden auf die tatsächlichen
 * Frage-Punkte skaliert (proportional).
 */

import type { Fachbereich, Bewertungskriterium } from '../types/fragen'

// === Vorlagen-Typ ===

export interface BewertungsrasterVorlage {
  id: string
  name: string
  kategorie: 'fachuebergreifend' | Fachbereich
  fachbereiche: Fachbereich[]  // leer = für alle Fächer geeignet
  fragetypen: string[]         // für welche Fragetypen passend
  kriterien: Bewertungskriterium[]
  builtin: true
}

// === Hilfsfunktion: Punkte proportional skalieren ===

export function skaliereVorlage(
  vorlage: BewertungsrasterVorlage,
  zielPunkte: number
): Bewertungskriterium[] {
  const vorlageSumme = vorlage.kriterien.reduce((s, k) => s + k.punkte, 0)
  if (vorlageSumme === 0 || vorlageSumme === zielPunkte) {
    return vorlage.kriterien.map(k => ({ ...k, niveaustufen: k.niveaustufen?.map(n => ({ ...n })) }))
  }
  const faktor = zielPunkte / vorlageSumme
  return vorlage.kriterien.map(k => {
    const neuePunkte = Math.round(k.punkte * faktor * 2) / 2  // 0.5-Schritte
    return {
      ...k,
      punkte: Math.max(0.5, neuePunkte),
      niveaustufen: k.niveaustufen?.map(n => ({
        ...n,
        punkte: Math.max(0, Math.round(n.punkte * faktor * 2) / 2),
      })),
    }
  })
}

// =====================================================================
// FACHÜBERGREIFENDE VORLAGEN (5)
// =====================================================================

const freitextKurz: BewertungsrasterVorlage = {
  id: '__freitext_kurz',
  name: 'Freitext Kurz (Definition)',
  kategorie: 'fachuebergreifend',
  fachbereiche: [],
  fragetypen: ['freitext'],
  builtin: true,
  kriterien: [
    {
      beschreibung: 'Fachliche Korrektheit',
      punkte: 2,
      niveaustufen: [
        { punkte: 2, beschreibung: 'Inhaltlich vollständig und korrekt' },
        { punkte: 1, beschreibung: 'Teilweise korrekt, wesentliche Aspekte vorhanden' },
        { punkte: 0, beschreibung: 'Falsch oder keine inhaltliche Aussage' },
      ],
    },
    {
      beschreibung: 'Präzision der Formulierung',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Fachbegriffe korrekt verwendet, präzise formuliert' },
        { punkte: 0.5, beschreibung: 'Umgangssprache statt Fachsprache, aber verständlich' },
        { punkte: 0, beschreibung: 'Unklar oder unverständlich formuliert' },
      ],
    },
  ],
}

const freitextLang: BewertungsrasterVorlage = {
  id: '__freitext_lang',
  name: 'Freitext Lang (Erörterung)',
  kategorie: 'fachuebergreifend',
  fachbereiche: [],
  fragetypen: ['freitext'],
  builtin: true,
  kriterien: [
    {
      beschreibung: 'Argumentation',
      punkte: 2,
      niveaustufen: [
        { punkte: 2, beschreibung: 'Schlüssige Argumentation mit mehreren Belegen/Beispielen' },
        { punkte: 1, beschreibung: 'Nachvollziehbare Argumentation, einzelne Belege' },
        { punkte: 0, beschreibung: 'Keine erkennbare oder widersprüchliche Argumentation' },
      ],
    },
    {
      beschreibung: 'Fachbegriffe und Sachkenntnis',
      punkte: 2,
      niveaustufen: [
        { punkte: 2, beschreibung: 'Fachbegriffe korrekt und angemessen eingesetzt' },
        { punkte: 1, beschreibung: 'Einzelne Fachbegriffe, teilweise unpräzis' },
        { punkte: 0, beschreibung: 'Keine Fachbegriffe oder falsch verwendet' },
      ],
    },
    {
      beschreibung: 'Vollständigkeit',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Alle relevanten Aspekte berücksichtigt' },
        { punkte: 0.5, beschreibung: 'Wichtige Aspekte teilweise abgedeckt' },
        { punkte: 0, beschreibung: 'Wesentliche Aspekte fehlen' },
      ],
    },
    {
      beschreibung: 'Struktur und Darstellung',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Logischer Aufbau, klare Gliederung' },
        { punkte: 0.5, beschreibung: 'Ansatzweise strukturiert' },
        { punkte: 0, beschreibung: 'Unstrukturiert, schwer nachvollziehbar' },
      ],
    },
  ],
}

const analyseFallstudie: BewertungsrasterVorlage = {
  id: '__analyse_fallstudie',
  name: 'Analyse / Fallstudie',
  kategorie: 'fachuebergreifend',
  fachbereiche: [],
  fragetypen: ['freitext'],
  builtin: true,
  kriterien: [
    {
      beschreibung: 'Materialbezug',
      punkte: 2,
      niveaustufen: [
        { punkte: 2, beschreibung: 'Material systematisch ausgewertet, konkrete Bezüge hergestellt' },
        { punkte: 1, beschreibung: 'Material teilweise einbezogen, einzelne Bezüge' },
        { punkte: 0, beschreibung: 'Kein erkennbarer Materialbezug' },
      ],
    },
    {
      beschreibung: 'Fachkonzepte angewendet',
      punkte: 2,
      niveaustufen: [
        { punkte: 2, beschreibung: 'Relevante Modelle/Theorien korrekt auf den Fall angewendet' },
        { punkte: 1, beschreibung: 'Fachkonzepte benannt, Anwendung lückenhaft' },
        { punkte: 0, beschreibung: 'Keine Fachkonzepte erkennbar' },
      ],
    },
    {
      beschreibung: 'Schlussfolgerung',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Begründete Schlussfolgerung, logisch aus Analyse abgeleitet' },
        { punkte: 0.5, beschreibung: 'Schlussfolgerung vorhanden, aber nicht schlüssig begründet' },
        { punkte: 0, beschreibung: 'Keine Schlussfolgerung oder unbegründet' },
      ],
    },
    {
      beschreibung: 'Eigenständigkeit',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Eigene Überlegungen erkennbar, über Reproduktion hinaus' },
        { punkte: 0.5, beschreibung: 'Ansätze eigenständigen Denkens' },
        { punkte: 0, beschreibung: 'Reine Wiedergabe ohne eigene Reflexion' },
      ],
    },
  ],
}

const berechnungErklaerung: BewertungsrasterVorlage = {
  id: '__berechnung_erklaerung',
  name: 'Berechnung mit Erklärung',
  kategorie: 'fachuebergreifend',
  fachbereiche: [],
  fragetypen: ['berechnung', 'freitext'],
  builtin: true,
  kriterien: [
    {
      beschreibung: 'Lösungsweg / Rechenweg',
      punkte: 2,
      niveaustufen: [
        { punkte: 2, beschreibung: 'Rechenweg vollständig und nachvollziehbar dargestellt' },
        { punkte: 1, beschreibung: 'Rechenweg erkennbar, aber lückenhaft oder unklar' },
        { punkte: 0, beschreibung: 'Kein Rechenweg oder unverständlich' },
      ],
    },
    {
      beschreibung: 'Ergebnis korrekt',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Korrektes Endergebnis' },
        { punkte: 0.5, beschreibung: 'Folgefehler bei korrektem Ansatz' },
        { punkte: 0, beschreibung: 'Falsches Ergebnis ohne korrekten Ansatz' },
      ],
    },
    {
      beschreibung: 'Einheit und Rundung',
      punkte: 0.5,
      niveaustufen: [
        { punkte: 0.5, beschreibung: 'Korrekte Einheit und sinnvolle Rundung' },
        { punkte: 0, beschreibung: 'Einheit fehlt oder falsch' },
      ],
    },
    {
      beschreibung: 'Erklärung / Interpretation',
      punkte: 0.5,
      niveaustufen: [
        { punkte: 0.5, beschreibung: 'Ergebnis im Sachkontext interpretiert' },
        { punkte: 0, beschreibung: 'Keine Interpretation' },
      ],
    },
  ],
}

const grafikInterpretation: BewertungsrasterVorlage = {
  id: '__grafik_interpretation',
  name: 'Grafik / Diagramm interpretieren',
  kategorie: 'fachuebergreifend',
  fachbereiche: [],
  fragetypen: ['freitext'],
  builtin: true,
  kriterien: [
    {
      beschreibung: 'Beschreibung der Daten',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Relevante Werte/Trends korrekt abgelesen und beschrieben' },
        { punkte: 0.5, beschreibung: 'Daten teilweise korrekt beschrieben' },
        { punkte: 0, beschreibung: 'Keine oder falsche Datenbeschreibung' },
      ],
    },
    {
      beschreibung: 'Ursachenerklärung',
      punkte: 2,
      niveaustufen: [
        { punkte: 2, beschreibung: 'Ursachen fachlich fundiert und differenziert erklärt' },
        { punkte: 1, beschreibung: 'Ursachen benannt, aber oberflächlich' },
        { punkte: 0, beschreibung: 'Keine Ursachenerklärung' },
      ],
    },
    {
      beschreibung: 'Schluss / Prognose',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Begründete Schlussfolgerung oder Prognose aus den Daten' },
        { punkte: 0.5, beschreibung: 'Ansatz einer Schlussfolgerung ohne klare Begründung' },
        { punkte: 0, beschreibung: 'Keine Schlussfolgerung' },
      ],
    },
  ],
}

// =====================================================================
// WR-SPEZIFISCHE VORLAGEN (4)
// =====================================================================

const rechtsfallanalyse: BewertungsrasterVorlage = {
  id: '__rechtsfallanalyse',
  name: 'Rechtsfallanalyse',
  kategorie: 'Recht',
  fachbereiche: ['Recht'],
  fragetypen: ['freitext'],
  builtin: true,
  kriterien: [
    {
      beschreibung: 'Sachverhalt erfasst',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Relevante Fakten korrekt identifiziert und zusammengefasst' },
        { punkte: 0.5, beschreibung: 'Sachverhalt teilweise erfasst, wesentliche Elemente fehlen' },
        { punkte: 0, beschreibung: 'Sachverhalt nicht oder falsch wiedergegeben' },
      ],
    },
    {
      beschreibung: 'Anwendbare Norm(en)',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Korrekte Rechtsgrundlage(n) mit Artikelangabe genannt' },
        { punkte: 0.5, beschreibung: 'Richtige Rechtsgrundlage, aber ohne Artikelangabe' },
        { punkte: 0, beschreibung: 'Falsche oder keine Rechtsgrundlage' },
      ],
    },
    {
      beschreibung: 'Subsumtion',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Sachverhalt schlüssig unter Norm subsumiert' },
        { punkte: 0.5, beschreibung: 'Subsumtion erkennbar, aber lückenhaft oder unpräzis' },
        { punkte: 0, beschreibung: 'Keine erkennbare Subsumtion' },
      ],
    },
    {
      beschreibung: 'Ergebnis / Rechtsfolge',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Korrekte Rechtsfolge logisch aus Subsumtion abgeleitet' },
        { punkte: 0.5, beschreibung: 'Ergebnis teilweise korrekt oder nicht aus Subsumtion abgeleitet' },
        { punkte: 0, beschreibung: 'Kein oder falsches Ergebnis' },
      ],
    },
  ],
}

const vwlModellanalyse: BewertungsrasterVorlage = {
  id: '__vwl_modellanalyse',
  name: 'VWL-Modellanalyse',
  kategorie: 'VWL',
  fachbereiche: ['VWL'],
  fragetypen: ['freitext'],
  builtin: true,
  kriterien: [
    {
      beschreibung: 'Modellverständnis',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Modell korrekt beschrieben, Annahmen und Grenzen benannt' },
        { punkte: 0.5, beschreibung: 'Modell im Grundsatz verstanden, Annahmen unklar' },
        { punkte: 0, beschreibung: 'Modell nicht verstanden oder verwechselt' },
      ],
    },
    {
      beschreibung: 'Grafische Darstellung',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Korrekte Achsenbeschriftung, Kurven und Verschiebungen' },
        { punkte: 0.5, beschreibung: 'Grafik im Ansatz korrekt, Fehler bei Beschriftung oder Verschiebung' },
        { punkte: 0, beschreibung: 'Keine oder falsche Grafik' },
      ],
    },
    {
      beschreibung: 'Wirkungskette',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Kausalkette vollständig: Ursache → Modellmechanismus → Wirkung' },
        { punkte: 0.5, beschreibung: 'Wirkungskette angedeutet, aber Lücken in der Kausalität' },
        { punkte: 0, beschreibung: 'Keine Wirkungskette erkennbar' },
      ],
    },
    {
      beschreibung: 'Bewertung / Transfer',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Modell kritisch auf Realität übertragen, Grenzen reflektiert' },
        { punkte: 0.5, beschreibung: 'Ansatz einer Bewertung ohne vertiefte Reflexion' },
        { punkte: 0, beschreibung: 'Keine Bewertung oder Transfer' },
      ],
    },
  ],
}

const bwlEntscheidung: BewertungsrasterVorlage = {
  id: '__bwl_entscheidung',
  name: 'BWL Entscheidungsaufgabe',
  kategorie: 'BWL',
  fachbereiche: ['BWL'],
  fragetypen: ['freitext'],
  builtin: true,
  kriterien: [
    {
      beschreibung: 'Entscheidungskriterien identifiziert',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Relevante Kriterien systematisch aufgelistet und gewichtet' },
        { punkte: 0.5, beschreibung: 'Einige Kriterien benannt, aber unvollständig oder ungewichtet' },
        { punkte: 0, beschreibung: 'Keine Kriterien identifiziert' },
      ],
    },
    {
      beschreibung: 'Alternativen verglichen',
      punkte: 2,
      niveaustufen: [
        { punkte: 2, beschreibung: 'Alternativen systematisch verglichen, Vor-/Nachteile pro Kriterium' },
        { punkte: 1, beschreibung: 'Vergleich vorhanden, aber nicht systematisch oder unvollständig' },
        { punkte: 0, beschreibung: 'Kein Vergleich der Alternativen' },
      ],
    },
    {
      beschreibung: 'Begründete Empfehlung',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Klare Empfehlung mit Bezug auf die Analyse' },
        { punkte: 0.5, beschreibung: 'Empfehlung vorhanden, aber schwach begründet' },
        { punkte: 0, beschreibung: 'Keine Empfehlung oder ohne Bezug zur Analyse' },
      ],
    },
  ],
}

const fibuBegruendung: BewertungsrasterVorlage = {
  id: '__fibu_begruendung',
  name: 'Buchhalterische Begründung',
  kategorie: 'BWL',
  fachbereiche: ['BWL'],
  fragetypen: ['freitext'],
  builtin: true,
  kriterien: [
    {
      beschreibung: 'Konto-Wahl begründet',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Konten korrekt benannt und Wahl fachlich begründet' },
        { punkte: 0.5, beschreibung: 'Konten genannt, Begründung fehlt oder ist falsch' },
        { punkte: 0, beschreibung: 'Falsche Konten oder keine Angabe' },
      ],
    },
    {
      beschreibung: 'Soll/Haben korrekt',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Soll/Haben-Logik korrekt erklärt (Zunahme/Abnahme)' },
        { punkte: 0.5, beschreibung: 'Soll/Haben teilweise korrekt' },
        { punkte: 0, beschreibung: 'Soll/Haben falsch oder nicht erklärt' },
      ],
    },
    {
      beschreibung: 'Buchungslogik erklärt',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Geschäftsvorfall korrekt in Buchungslogik übersetzt' },
        { punkte: 0.5, beschreibung: 'Ansatz erkennbar, aber Logik lückenhaft' },
        { punkte: 0, beschreibung: 'Keine nachvollziehbare Buchungslogik' },
      ],
    },
  ],
}

// =====================================================================
// ANDERE FACHSCHAFTEN (3)
// =====================================================================

const textproduktion: BewertungsrasterVorlage = {
  id: '__textproduktion',
  name: 'Textproduktion (Sprachen)',
  kategorie: 'Allgemein',
  fachbereiche: ['Allgemein'],
  fragetypen: ['freitext'],
  builtin: true,
  kriterien: [
    {
      beschreibung: 'Inhalt und Aufgabenbezug',
      punkte: 2,
      niveaustufen: [
        { punkte: 2, beschreibung: 'Alle Inhaltspunkte abgedeckt, aufgabenkonform' },
        { punkte: 1, beschreibung: 'Inhaltspunkte teilweise abgedeckt' },
        { punkte: 0, beschreibung: 'Thema verfehlt oder kaum inhaltliche Aussagen' },
      ],
    },
    {
      beschreibung: 'Sprache und Ausdruck',
      punkte: 2,
      niveaustufen: [
        { punkte: 2, beschreibung: 'Differenzierter Wortschatz, wenige Fehler, flüssig lesbar' },
        { punkte: 1, beschreibung: 'Verständlich, einfacher Wortschatz, einige Fehler' },
        { punkte: 0, beschreibung: 'Viele Fehler, schwer verständlich' },
      ],
    },
    {
      beschreibung: 'Textaufbau',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Klare Gliederung (Einleitung, Hauptteil, Schluss), logische Abfolge' },
        { punkte: 0.5, beschreibung: 'Ansatzweise gegliedert' },
        { punkte: 0, beschreibung: 'Keine erkennbare Struktur' },
      ],
    },
    {
      beschreibung: 'Formalia',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Textsorte eingehalten, Umfang angemessen, Register passend' },
        { punkte: 0.5, beschreibung: 'Textsorte teilweise eingehalten' },
        { punkte: 0, beschreibung: 'Textsorte nicht eingehalten oder viel zu kurz/lang' },
      ],
    },
  ],
}

const quellenanalyse: BewertungsrasterVorlage = {
  id: '__quellenanalyse',
  name: 'Quellenanalyse (Geschichte)',
  kategorie: 'Allgemein',
  fachbereiche: ['Allgemein'],
  fragetypen: ['freitext'],
  builtin: true,
  kriterien: [
    {
      beschreibung: 'Einordnung der Quelle',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Autor, Entstehungszeit, Quellengattung und Adressat korrekt bestimmt' },
        { punkte: 0.5, beschreibung: 'Teilweise korrekte Einordnung' },
        { punkte: 0, beschreibung: 'Keine oder falsche Einordnung' },
      ],
    },
    {
      beschreibung: 'Inhaltsanalyse',
      punkte: 2,
      niveaustufen: [
        { punkte: 2, beschreibung: 'Zentrale Aussagen korrekt herausgearbeitet, Intention erkannt' },
        { punkte: 1, beschreibung: 'Inhalt teilweise erfasst, Intention unklar' },
        { punkte: 0, beschreibung: 'Inhalt nicht erfasst' },
      ],
    },
    {
      beschreibung: 'Historischer Kontext',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Quelle in historischen Zusammenhang eingebettet, Bezüge hergestellt' },
        { punkte: 0.5, beschreibung: 'Kontextwissen vorhanden, aber nicht mit Quelle verknüpft' },
        { punkte: 0, beschreibung: 'Kein historischer Kontext' },
      ],
    },
    {
      beschreibung: 'Kritische Bewertung',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Quellenkritik: Perspektivität, Zuverlässigkeit, Erkenntnisgewinn reflektiert' },
        { punkte: 0.5, beschreibung: 'Ansatz einer Bewertung' },
        { punkte: 0, beschreibung: 'Keine kritische Reflexion' },
      ],
    },
  ],
}

const experiment: BewertungsrasterVorlage = {
  id: '__experiment',
  name: 'Experimentbeschreibung (MINT)',
  kategorie: 'Allgemein',
  fachbereiche: ['Allgemein'],
  fragetypen: ['freitext'],
  builtin: true,
  kriterien: [
    {
      beschreibung: 'Hypothese',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Klare, überprüfbare Hypothese mit Begründung formuliert' },
        { punkte: 0.5, beschreibung: 'Hypothese vorhanden, aber vage oder nicht überprüfbar' },
        { punkte: 0, beschreibung: 'Keine Hypothese' },
      ],
    },
    {
      beschreibung: 'Methode / Versuchsaufbau',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Versuchsaufbau reproduzierbar beschrieben, Variablen kontrolliert' },
        { punkte: 0.5, beschreibung: 'Methode erkennbar, aber lückenhaft' },
        { punkte: 0, beschreibung: 'Keine Methodenbeschreibung' },
      ],
    },
    {
      beschreibung: 'Beobachtung / Messwerte',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Beobachtungen präzis dokumentiert, Messwerte mit Einheiten' },
        { punkte: 0.5, beschreibung: 'Beobachtungen vorhanden, aber unpräzis oder unvollständig' },
        { punkte: 0, beschreibung: 'Keine Beobachtungen dokumentiert' },
      ],
    },
    {
      beschreibung: 'Interpretation / Schlussfolgerung',
      punkte: 1,
      niveaustufen: [
        { punkte: 1, beschreibung: 'Ergebnisse korrekt interpretiert, Bezug zur Hypothese hergestellt' },
        { punkte: 0.5, beschreibung: 'Ansatz einer Interpretation' },
        { punkte: 0, beschreibung: 'Keine Interpretation oder Bezug zur Hypothese' },
      ],
    },
  ],
}

// =====================================================================
// EXPORT
// =====================================================================

export const STANDARD_VORLAGEN: BewertungsrasterVorlage[] = [
  // Fachübergreifend
  freitextKurz,
  freitextLang,
  analyseFallstudie,
  berechnungErklaerung,
  grafikInterpretation,
  // WR-spezifisch
  rechtsfallanalyse,
  vwlModellanalyse,
  bwlEntscheidung,
  fibuBegruendung,
  // Andere Fachschaften
  textproduktion,
  quellenanalyse,
  experiment,
]

/**
 * Filtert Vorlagen nach Fachbereich.
 * Gibt fachübergreifende + fachspezifische Vorlagen zurück.
 */
export function filtereVorlagenNachFachbereich(
  fachbereich?: Fachbereich
): BewertungsrasterVorlage[] {
  if (!fachbereich) return STANDARD_VORLAGEN
  return STANDARD_VORLAGEN.filter(
    v => v.fachbereiche.length === 0 || v.fachbereiche.includes(fachbereich)
  )
}
