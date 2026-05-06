# Deployment Workflow — Branching & Release

## Branching-Strategie

### `main` = Production

- `main` ist IMMER stabil und deployed
- Direktes Committen auf `main` ist ab sofort verboten
- Jede Änderung läuft über einen Feature/Fix-Branch

### Branch-Namenskonvention

```
feature/kurze-beschreibung    → Neue Funktionalität
fix/kurze-beschreibung        → Bugfix
refactor/kurze-beschreibung   → Refactoring ohne Funktionsänderung
```

### Workflow pro Änderung

```
1. Branch erstellen:     git checkout -b fix/heartbeat-token
2. Änderungen machen:    (Code + Tests)
3. Lokal prüfen:         npx tsc -b && npx vitest run && npm run build
4. Committen:            git add ... && git commit
5. Browser-Test:         npm run preview → Chrome testen
6. Merge vorbereiten:    git checkout main && git merge fix/heartbeat-token
7. Push + Deploy:        git push
8. Branch aufräumen:     git branch -d fix/heartbeat-token
```

## Deploy-Regeln

### Nie deployen wenn:

- **Aktive Prüfungen laufen** (SuS sind eingeloggt und schreiben)
- **Kurz vor einer Prüfung** (gleicher Tag, ausser Hotfix)
- **Apps Script nicht gleichzeitig deployed werden kann** (Backend/Frontend müssen zusammenpassen)

### Deploy-Fenster

- **Ideal:** Abends (nach 18:00), Wochenende
- **Akzeptabel:** Tagsüber wenn keine Prüfung ansteht
- **Hotfix:** Jederzeit, aber nur der minimale Fix

### Apps Script Deploy

- Vor Deploy: Aktuelle Bereitstellungs-Nr. notieren
- Neue Bereitstellung erstellen (nicht "HEAD" verwenden)
- Verifizieren dass Frontend + Backend zusammenpassen
- Bei Problemen: Alte Bereitstellungs-URL reaktivieren

## Rollback-Strategie

### Git Tags vor grösseren Releases

```bash
git tag v-pruefung-2026-03-31 -m "Stable nach Session 37"
git push --tags
```

### Rollback-Schritte

```bash
# 1. Letzten stabilen Tag finden
git tag -l "v-pruefung-*"

# 2. Zurücksetzen
git checkout v-pruefung-YYYY-MM-DD
# Oder: Revert-Commit erstellen (sicherer)
git revert HEAD

# 3. Push → GitHub Actions deployed automatisch
git push
```

### Apps Script Rollback

1. Google Apps Script Editor öffnen
2. Bereitstellen → Bereitstellungen verwalten
3. Alte Version aktivieren

## Checkliste vor Merge zu main

- [ ] `npx tsc -b` grün
- [ ] `npx vitest run` grün (167+ Tests)
- [ ] `npm run build` erfolgreich
- [ ] `npm run preview` → Browser-Test der betroffenen Pfade
- [ ] Security-Invarianten geprüft (siehe regression-prevention.md)
- [ ] Keine aktiven Prüfungen
- [ ] HANDOFF.md aktualisiert

## Post-Deploy Cache-Probleme

**Problem (S115):** Nach Deploy zeigt Browser gelegentlich kaputte Seiten (ungestyltes HTML, 503-Fehler für JS/CSS-Chunks, "Seite funktioniert nicht"). Ursache: Browser hat alte `index.html` im Memory-/Disk-Cache, diese verweist auf Chunk-Hashes die nach Deploy nicht mehr existieren.

**Erkennung:**
- Network-Tab: 503 oder 404 für `assets/index-<hash>.css` oder `.js`
- Page source zeigt andere Hashes als Server (curl zum Vergleich)
- Styling komplett weg, aber Text sichtbar

**Lösungen (in Reihenfolge):**
1. **Hard Reload** (`Cmd+Shift+R` / `Ctrl+Shift+R`) — reicht in 90% der Fälle
2. **SW-unregister + Cache-Clear** im DevTools (Application → Storage → Clear site data)
3. **Cache-Buster-URL**: `?cb=<timestamp>` anhängen → erzwingt frisches HTML ohne Cache
4. Im Code: SW-unregister-Script bei Chunk-Load-Fehlern (Pattern in `LPStartseite.tsx::lazyMitRetry`)

**Für User-Reports "sieht kaputt aus":** IMMER zuerst Hard-Reload empfehlen, BEVOR Bug-Untersuchung gestartet wird.

## Staging-Deploy-Queue hängt (S118)

**Problem:** Zwei Commits schnell hintereinander pushen führte dazu, dass der erste Deploy-Workflow lief, der zweite aber übersprungen/verschluckt wurde. Staging-Seite blieb auf altem Stand, `last-modified`-Header deutlich veraltet, obwohl GitHub-Actions-Workflow als "success" markiert war.

**Retrigger:** Leerer Commit erzwingt neuen Workflow-Run:
```bash
git commit --allow-empty -m "Trigger staging re-deploy"
git push
```

**Erkennung:** Wenn nach `git push` zur Preview-URL gefetcht wird und sich der Build-Timestamp nicht ändert (innerhalb von ~2 Minuten), wahrscheinlich ist der Workflow in der Queue hängengeblieben. Nicht lange raten — leerer Commit ist billig und löst zuverlässig aus.

## CI-Gates auf BEIDEN Workflow-Hälften — preview vor Bundle-Merge mitziehen (Bundle Q Lehre, 2026-05-06)

**Problem:** Bundle Q (Test-Verzeichnis-Konsolidierung) führte zwei neue CI-Gates ein (`lint:no-tests-dir`, `Run vitest`). Beide Gates laufen sowohl im production-Block (gegen `main`) als auch im staging-Block (gegen `preview`-Checkout). Nach dem Bundle-Q-Merge auf `main` waren die Gates dort grün — aber `origin/preview` stand noch auf Bundle-N+V-Stand (`f3aee7c`), hatte also noch `__tests__/`-Verzeichnisse UND nicht den `.env.local`-Flake-Fix. Resultat: 3 main-Pushes liefen rot, weil der staging-Job an dem alten preview-Tree scheiterte.

**Regel:** Bei einem Bundle, das einen CI-Gate-Step in `deploy.yml` einführt der ALSO im staging-Block läuft (typisch: `if: steps.checkout-preview.outcome == 'success'`-Steps), muss `origin/preview` VOR dem Push auf main entweder:
1. **bereits den gleichen Stand wie main haben** (wenn preview-Branch sowieso strikt hinter main ist), oder
2. **gleichzeitig mit main mitgezogen werden** durch einen FF-Push: `git push origin main:preview`.

**Vor dem Merge prüfen:**
```bash
# Hat preview eigene Commits, die nicht in main sind?
git log origin/preview ^origin/main --oneline
```
- **Leer:** preview ist strikt hinter main → FF `git push origin main:preview` ist sicher.
- **Treffer:** preview hat work-in-progress → manuell mergen oder cherry-picken, nicht force-pushen (Preview-Force-Push-Regel).

**Erkennung:** CI-Annotation „Process completed with exit code 1" auf einem main-Build der eigentlich grün laufen sollte. Erste Diagnose: welcher Step ist es? Wenn ein staging-`if: ...preview...success`-Step ist, dann ist preview out-of-sync.

**Anti-Pattern:** Den staging-Step temporär deaktivieren oder im if-Guard schwächen, um den CI-Build durchzubekommen. Damit verliert man den Gate-Wert auf staging.
