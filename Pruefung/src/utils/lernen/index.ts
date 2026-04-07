/**
 * Üben-spezifische Utilities.
 * Barrel-Export für alle LP-Utils.
 */

// Anrede-System (Sie/Du)
export { t } from './anrede'
export type { AnredeKey } from './anrede'

// Asset-URL-Auflösung (Pool-Bilder etc.)
export { resolveAssetUrl } from './assetUrl'

// Block-Builder (Fragen-Blöcke nach Mastery sortiert)
export { erstelleBlock } from './blockBuilder'
export type { BlockOptions } from './blockBuilder'

// Empfehlungen (Lücken + Festigung + Aufträge)
export { berechneEmpfehlungen } from './empfehlungen'

// Fragetext-Extraktion
export { getFragetext, bereinigePlatzhalter } from './fragetext'

// Gamification (Sterne, Streaks, Feedback-Texte)
export { berechneSterne, berechneStreak, sterneText, zufaelligesLob, zufaelligerTrost } from './gamification'

// IndexedDB (Offline-Cache)
export { db } from './indexedDB'

// Korrektur (Übungskorrektur für alle Fragetypen)
export { pruefeAntwort } from './korrektur'

// Mastery-Berechnung
export { berechneMastery, aktualisiereFortschritt, lernzielStatus, istDauerbaustelle } from './mastery'

// Offline-Queue
export { enqueue, getQueue, clearQueue, removeFromQueue } from './offlineQueue'

// Deterministisches Mischen
export { seededShuffle } from './shuffle'

// Fachbereich-Farben (DOM-Manipulation)
export { setzeFachFarben, getFachFarbe } from './fachFarben'
