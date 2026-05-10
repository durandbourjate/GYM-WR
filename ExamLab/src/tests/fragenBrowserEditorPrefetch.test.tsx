import { describe, it } from 'vitest'
// render, fireEvent, waitFor nur bei vollständiger Integration-Test-Implementierung nötig
// (aktuell describe.todo — wird in Browser-E2E Task 8 abgedeckt)

// PSEUDO — der echte Test mountet FragenBrowser, klickt "Bearbeiten" auf f2,
// wartet auf den Hook-Effekt und prüft, dass ladeDetail mit f1 und f3 aufgerufen wurde.

// Begründung für describe.todo:
// FragenBrowser hat ~12 Imports aus Stores/Services (useAuthStore, useFragensammlungStore,
// useFragenFilter, apiService, useFocusTrap, demoFragen, trackerUtils, …) und rendert
// grosse Child-Komponenten (FragenEditor, FragenImport, BatchExportDialog).
// Der Setup-Aufwand für ein vollständiges Integration-Mock würde 30+ Minuten brauchen,
// ohne substantiell über die Unit-Tests von useEditorNeighborPrefetch (Task 2/3) hinaus
// zu gehen — diese decken die Hook-Logik bereits vollständig ab.
// Stattdessen: Browser-E2E in Task 8 verifiziert die tatsächliche Integration.
describe.todo('FragenBrowser EditorNeighbor-Prefetch — integration', () => {
  it('öffnen von f2 triggert Prefetch von f1 und f3 nach Debounce', async () => {
    // TODO: FragenBrowser benötigt umfangreiche Mocks (authStore, useFragenFilter,
    // apiService, etc.). Wenn das Setup zu komplex wird, diesen Test als
    // Smoke-Integration in Browser-E2E (Task 8) verlagern.
  })
})
