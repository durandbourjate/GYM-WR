# Bundle 4: Layout-Umbau Durchführen — Design Spec

> Datum: 13.04.2026
> Tasks: N15 (Suchfeld + CTA-Position), N16 (CTA-Buttons konsistent)

---

## Zusammenfassung

Zwei Änderungen am LP-Dashboard-Layout:
1. Suchfeld von eigener Zeile in die Tab-Zeile verschieben (rechtsbündig)
2. CTA-Buttons ("+Neue Prüfung", "+Neue Übung", "+Neue Frage") einheitlich als primary-Buttons stylen und "+Neue Prüfung"/"+Neue Übung" in die Filterzeile verschieben

---

## N15: Suchfeld + CTA-Button verschieben

### Vorher (aktuell)

```
Header:  [Logo]  [Favoriten] [Prüfen] [Üben] [Fragensammlung]    [+Neue Prüfung] [⚙] [?] [🌙] [Logout]

Content: [Prüfung durchführen]  [Analyse]
         [🔍 Suche .........................] [Sortieren ▾]
         [Alle] [Aktiv] [Archiviert]  [Fach ▾]
```

### Nachher

```
Header:  [Logo]  [Favoriten] [Prüfen] [Üben] [Fragensammlung]    [⚙] [?] [🌙] [Logout]

Content: [Prüfung durchführen]  [Analyse]                    [🔍 Suche ........]
         [Alle] [Aktiv] [Archiviert]  [Fach ▾] [Sortieren ▾] [+ Neue Prüfung]
```

### Änderungen

| # | Was | Wo |
|---|-----|----|
| 1 | Suchfeld aus eigener Zeile entfernen, in Tab-Zeile einfügen (rechtsbündig, flexible Breite) | LPStartseite.tsx (Prüfen-Block ~Zeile 686, Üben-Block ~Zeile 499) |
| 2 | Sortieren-Dropdown bleibt, wandert in die Filterzeile (vor dem CTA-Button) | LPStartseite.tsx |
| 3 | "+Neue Prüfung" / "+Neue Übung" aus LPHeader `aktionsButtons` entfernen | LPStartseite.tsx (aktionsButtons-Prop nicht mehr übergeben für Prüfen/Üben) |
| 4 | "+Neue Prüfung" / "+Neue Übung" in Filterzeile einfügen (rechtsbündig, nach Sortieren) | LPStartseite.tsx |

**Hinweis:** `aktionsButtons` Prop auf LPHeader bleibt im Interface erhalten — andere Aufrufer (PruefungsComposer, DurchfuehrenDashboard, KorrekturDashboard, Favoriten) nutzen es weiterhin.

### Gilt für beide Modi

- **Prüfen:** Tabs "Prüfung durchführen" / "Analyse" + Suchfeld rechts
- **Üben:** Bestehende Tabs + Suchfeld rechts
- Identisches Layout-Pattern in beiden Fällen
- Suchfeld ist aktuell in LPStartseite.tsx dupliziert (je einmal für Prüfen und Üben) — beide Instanzen verschieben

### Suchfeld-Spezifikation

- Position: Gleiche Zeile wie Tabs, rechtsbündig
- Breite: `max-w-xs` (flexibel, schrumpft auf kleinen Screens)
- Styling: Wie bisher (border, rounded-lg, text-sm)
- Zeile wird `flex items-center justify-between` (Tabs links, Suche rechts)
- **Responsive:** Unter `md`-Breakpoint: Suchfeld wrapped in neue Zeile unter den Tabs

---

## N16: CTA-Buttons konsistent primary

### Betroffene Buttons

| Button | Aktueller Ort | Neuer Ort | Aktueller Style | Neuer Style |
|--------|--------------|-----------|----------------|-------------|
| "+ Neue Prüfung" | LPHeader (aktionsButtons) | Filterzeile Prüfen in LPStartseite.tsx, rechtsbündig | Ghost (text-slate-600, bg transparent) | `Button variant="primary" size="sm"` |
| "+ Neue Übung" | LPHeader (aktionsButtons) | Filterzeile Üben in LPStartseite.tsx, rechtsbündig | Ghost | `Button variant="primary" size="sm"` |
| "+ Neue Frage" | FragenBrowserHeader.tsx | Bleibt am Ort | Ghost (bg-slate-100) | `Button variant="primary" size="sm"` |

### Primary-Style (aus Button.tsx)

- **Light Mode:** `bg-slate-800 text-white hover:bg-slate-700`
- **Dark Mode:** `bg-slate-200 text-slate-800 hover:bg-slate-300`
- Size: `sm` (`px-3 py-1.5 text-xs min-h-[36px]`)

### Inline-Styles ersetzen

Alle drei Buttons sollen die shared `Button`-Komponente verwenden statt inline className-Strings.

### Empty-State Buttons

Die "Neue Prüfung erstellen" / "Neue Übung erstellen" Buttons in den Empty-States (wenn keine Prüfungen/Übungen existieren, ~Zeile 488 und 674 in LPStartseite.tsx) ebenfalls auf `Button variant="primary"` umstellen.

---

## Nicht geändert

- Tab-Bezeichnungen bleiben unverändert
- Workflow-Tabs innerhalb einer Prüfung (Vorbereitung/Lobby/Live/Auswertung) unberührt
- Filter-Buttons (Alle/Aktiv/Archiviert/Fach) unverändert
- Fragensammlung-Layout unverändert (nur Button-Style)
- `aktionsButtons` Prop auf LPHeader bleibt (wird von anderen Aufrufern genutzt)

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| LPStartseite.tsx | Suchfeld in Tab-Zeile verschieben (2x), Sortieren-Dropdown in Filterzeile, CTA-Buttons in Filterzeile, aktionsButtons nicht mehr für Prüfen/Üben übergeben, Empty-State Buttons |
| FragenBrowserHeader.tsx | "+Neue Frage" auf `Button variant="primary" size="sm"` umstellen |

---

## Risiken

- **Gering:** Rein visuelle Änderungen, keine Logik-Änderungen
- **Responsive:** Suchfeld + Tabs auf gleicher Zeile — unter `md` wrapped Suchfeld in neue Zeile
