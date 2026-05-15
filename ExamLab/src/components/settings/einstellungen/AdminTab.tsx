import { useState, useEffect, useCallback } from 'react'
import { useStammdatenStore } from '../../../store/stammdatenStore'
import type { Stammdaten, KursDefinition, FachDefinition, FachschaftDefinition } from '../../../types/stammdaten'
import { SettingsField } from './sharedFelder'
import { InlineKursEditor, InlineTextEditor } from './InlineEditoren'
import CRUDSectionShell from './CRUDSectionShell'
import { useSpeicherStatus } from '../../../hooks/useSpeicherStatus'
import SpeicherButton from './SpeicherButton'
import { migriereTagsZuObjects } from '../../../services/tagsApi'
import { backfillStatusDefault } from '../../../services/maintenanceApi'
import Button from '../../ui/Button'
import BaseDialog from '../../ui/BaseDialog'

export default function AdminTab({ email, stammdaten }: { email: string; stammdaten: Stammdaten }) {
  const { speichereStammdaten: speichereStammdatenAction } = useStammdatenStore()
  const [admins, setAdmins] = useState(stammdaten.admins.join('\n'))
  const [klassen, setKlassen] = useState(stammdaten.klassen.join(', '))
  const [gefaesse, setGefaesse] = useState<string[]>(stammdaten.gefaesse)
  const [kurse, setKurse] = useState<KursDefinition[]>(stammdaten.kurse)
  const [faecher, setFaecher] = useState<FachDefinition[]>(stammdaten.faecher)
  const [fachschaften, setFachschaften] = useState<FachschaftDefinition[]>(stammdaten.fachschaften)
  const { status: speicherStatus, speichern: runSpeichern } = useSpeicherStatus()
  const [bearbeitungsModus, setBearbeitungsModus] = useState(false)

  // Inline-Edit State
  const [neuerKursOffen, setNeuerKursOffen] = useState(false)
  const [neuesFachOffen, setNeuesFachOffen] = useState(false)
  const [neueFachschaftOffen, setNeueFachschaftOffen] = useState(false)
  const [neuesGefaessOffen, setNeuesGefaessOffen] = useState(false)

  // Cluster H — Tag-Migration State (einmalige Wartungs-Aktion)
  const [migrConfirmOpen, setMigrConfirmOpen] = useState(false)
  const [migrLaeuft, setMigrLaeuft] = useState(false)
  const [migrErgebnis, setMigrErgebnis] = useState<{ neueTags: number; fragenAktualisiert: number; dauerMs: number } | null>(null)
  const [migrFehler, setMigrFehler] = useState<string | null>(null)

  // Cluster D Phase 0 — Status-Backfill State (einmalige Wartungs-Aktion)
  const [statusBackfillConfirmOpen, setStatusBackfillConfirmOpen] = useState(false)
  const [statusBackfillLaeuft, setStatusBackfillLaeuft] = useState(false)
  const [statusBackfillErgebnis, setStatusBackfillErgebnis] = useState<{ count: number; defaultWert: 'draft' | 'sammlung'; dauerMs: number } | null>(null)
  const [statusBackfillFehler, setStatusBackfillFehler] = useState<string | null>(null)

  async function handleMigrationStartenOK() {
    setMigrConfirmOpen(false)
    setMigrLaeuft(true)
    setMigrFehler(null)
    try {
      const r = await migriereTagsZuObjects({ email })
      setMigrErgebnis(r)
    } catch (e) {
      setMigrFehler(e instanceof Error ? e.message : String(e))
    } finally {
      setMigrLaeuft(false)
    }
  }

  // Cluster D Phase 0 — Status-Backfill für Frage-Sheets ohne status-Spalte / leere Werte.
  async function handleStatusBackfillStartenOK() {
    setStatusBackfillConfirmOpen(false)
    setStatusBackfillLaeuft(true)
    setStatusBackfillFehler(null)
    try {
      const r = await backfillStatusDefault({ email })
      setStatusBackfillErgebnis(r)
    } catch (e) {
      setStatusBackfillFehler(e instanceof Error ? e.message : String(e))
    } finally {
      setStatusBackfillLaeuft(false)
    }
  }

  useEffect(() => {
    setAdmins(stammdaten.admins.join('\n'))
    setKlassen(stammdaten.klassen.join(', '))
    setGefaesse(stammdaten.gefaesse)
    setKurse(stammdaten.kurse)
    setFaecher(stammdaten.faecher)
    setFachschaften(stammdaten.fachschaften)
  }, [stammdaten])

  const speichern = useCallback(async () => {
    const daten: Partial<Stammdaten> = {
      admins: admins.split('\n').map(s => s.trim().toLowerCase()).filter(Boolean),
      klassen: klassen.split(',').map(s => s.trim()).filter(Boolean),
      gefaesse,
      kurse,
      faecher,
      fachschaften,
    }
    const ok = await runSpeichern(() => speichereStammdatenAction(email, daten))
    if (ok) setBearbeitungsModus(false)
  }, [admins, klassen, gefaesse, kurse, faecher, fachschaften, email, speichereStammdatenAction, runSpeichern])

  const abbrechen = () => {
    setBearbeitungsModus(false)
    setAdmins(stammdaten.admins.join('\n'))
    setKlassen(stammdaten.klassen.join(', '))
    setGefaesse(stammdaten.gefaesse)
    setKurse(stammdaten.kurse)
    setFaecher(stammdaten.faecher)
    setFachschaften(stammdaten.fachschaften)
    setNeuerKursOffen(false)
    setNeuesFachOffen(false)
    setNeueFachschaftOffen(false)
    setNeuesGefaessOffen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Admin-Einstellungen</h3>
        {!bearbeitungsModus && (
          <button onClick={() => setBearbeitungsModus(true)} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
            Bearbeiten
          </button>
        )}
      </div>

      <SettingsField label="Admins (E-Mails, eine pro Zeile)" value={admins} onChange={setAdmins} multiline readonly={!bearbeitungsModus} />
      <SettingsField label="Klassen (kommasepariert)" value={klassen} onChange={setKlassen} readonly={!bearbeitungsModus} hinweis="z.B. 27a, 28bc29fs, 29c, 30s" />
      {/* === GEFÄSSE CRUD === */}
      <CRUDSectionShell
        label="Gefässe"
        count={gefaesse.length}
        bearbeiten={bearbeitungsModus}
        showAddButton={!neuesGefaessOffen}
        addLabel="+ Gefäss"
        onAdd={() => setNeuesGefaessOffen(true)}
        hint="z.B. SF, EF, EWR, GF — werden bei Kursen und im Frageneditor als Auswahl angeboten."
      >
        <div className="flex flex-wrap gap-1.5">
          {gefaesse.map((g, idx) => (
            <span key={g} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded inline-flex items-center gap-1">
              {g}
              {bearbeitungsModus && (
                <button onClick={() => setGefaesse(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 cursor-pointer">✕</button>
              )}
            </span>
          ))}
        </div>
        {neuesGefaessOffen && (
          <InlineTextEditor
            label="Gefäss"
            felder={[
              { name: 'kuerzel', placeholder: 'Kürzel (z.B. SF, EF, EWR, GF)', required: true },
            ]}
            onSpeichern={(werte) => {
              const kuerzel = werte.kuerzel.trim()
              if (kuerzel && !gefaesse.includes(kuerzel)) {
                setGefaesse(prev => [...prev, kuerzel])
              }
              setNeuesGefaessOffen(false)
            }}
            onAbbrechen={() => setNeuesGefaessOffen(false)}
          />
        )}
      </CRUDSectionShell>

      {/* === KURSE CRUD === */}
      <CRUDSectionShell
        label="Kurse"
        count={kurse.length}
        bearbeiten={bearbeitungsModus}
        showAddButton={!neuerKursOffen}
        addLabel="+ Kurs hinzufügen"
        onAdd={() => setNeuerKursOffen(true)}
      >
        <div className="space-y-1">
          {kurse.map((k, idx) => (
            <div key={k.id} className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded">
              <span className="font-medium flex-1">{k.name}</span>
              <span className="text-xs text-slate-400">{k.gefaess} · {k.klassen.join(', ')}</span>
              {bearbeitungsModus && (
                <button onClick={() => setKurse(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs cursor-pointer">✕</button>
              )}
            </div>
          ))}
        </div>
        {neuerKursOffen && (
          <InlineKursEditor
            gefaesse={gefaesse}
            fachschaften={fachschaften}
            onSpeichern={(k) => { setKurse(prev => [...prev, k]); setNeuerKursOffen(false) }}
            onAbbrechen={() => setNeuerKursOffen(false)}
          />
        )}
      </CRUDSectionShell>

      {/* === FACHSCHAFTEN CRUD === */}
      <CRUDSectionShell
        label="Fachschaften"
        count={fachschaften.length}
        bearbeiten={bearbeitungsModus}
        showAddButton={!neueFachschaftOffen}
        addLabel="+ Fachschaft"
        onAdd={() => setNeueFachschaftOffen(true)}
      >
        <div className="space-y-1">
          {fachschaften.map((fs, idx) => (
            <div key={fs.id} className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded">
              <span className="font-medium">{fs.kuerzel}</span>
              <span className="text-slate-500 dark:text-slate-400 flex-1">{fs.name}</span>
              {fs.fachbereichTags && fs.fachbereichTags.map(t => (
                <span key={t.name} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: t.farbe + '20', color: t.farbe }}>{t.name}</span>
              ))}
              {bearbeitungsModus && (
                <button onClick={() => setFachschaften(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs cursor-pointer">✕</button>
              )}
            </div>
          ))}
        </div>
        {neueFachschaftOffen && (
          <InlineTextEditor
            label="Fachschaft"
            felder={[
              { name: 'kuerzel', placeholder: 'Kürzel (z.B. MA)', required: true },
              { name: 'name', placeholder: 'Name (z.B. Mathematik)', required: true },
            ]}
            onSpeichern={(werte) => {
              const id = werte.kuerzel.toLowerCase()
              setFachschaften(prev => [...prev, { id, kuerzel: werte.kuerzel, name: werte.name, faecherIds: [id] }])
              setNeueFachschaftOffen(false)
            }}
            onAbbrechen={() => setNeueFachschaftOffen(false)}
          />
        )}
      </CRUDSectionShell>

      {/* === FÄCHER CRUD === */}
      <CRUDSectionShell
        label="Fächer"
        count={faecher.length}
        bearbeiten={bearbeitungsModus}
        showAddButton={!neuesFachOffen}
        addLabel="+ Fach"
        onAdd={() => setNeuesFachOffen(true)}
      >
        <div className="flex flex-wrap gap-1.5">
          {faecher.map((f, idx) => (
            <span key={f.id} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded inline-flex items-center gap-1">
              {f.kuerzel} — {f.name}
              {bearbeitungsModus && (
                <button onClick={() => setFaecher(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 cursor-pointer">✕</button>
              )}
            </span>
          ))}
        </div>
        {neuesFachOffen && (
          <InlineTextEditor
            label="Fach"
            felder={[
              { name: 'kuerzel', placeholder: 'Kürzel (z.B. PH)', required: true },
              { name: 'name', placeholder: 'Name (z.B. Physik)', required: true },
            ]}
            onSpeichern={(werte) => {
              const id = werte.kuerzel.toLowerCase()
              setFaecher(prev => [...prev, { id, kuerzel: werte.kuerzel, name: werte.name }])
              setNeuesFachOffen(false)
            }}
            onAbbrechen={() => setNeuesFachOffen(false)}
          />
        )}
      </CRUDSectionShell>

      {/* Speichern */}
      {bearbeitungsModus && (
        <div className="flex gap-3 pt-2">
          <SpeicherButton status={speicherStatus} idleLabel="Speichern" onClick={speichern} />
          <button onClick={abbrechen} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
            Abbrechen
          </button>
        </div>
      )}
      {speicherStatus === 'fehler' && (
        <p className="text-sm text-red-600 dark:text-red-400">Fehler beim Speichern. Bitte erneut versuchen.</p>
      )}

      {/* === Cluster H — Tag-Migration (einmalige Wartungs-Aktion) === */}
      <section className="mt-8 p-4 border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-100">⚠ Cluster H — Tag-Migration (einmalig)</h3>
        <p className="text-sm mb-3 text-slate-700 dark:text-slate-300">
          Migriert alle Frage-Tags (string[]) zu Tag-Object-Referenzen (tagIds[]).
          Idempotent — kann nur einmal laufen. Tags-Sheet wird befüllt.
        </p>
        <Button onClick={() => setMigrConfirmOpen(true)} variant="primary" disabled={migrLaeuft} loading={migrLaeuft}>
          {migrLaeuft ? 'Läuft...' : 'Migration starten'}
        </Button>
        {migrErgebnis && (
          <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 rounded">
            ✅ {migrErgebnis.neueTags} Tags erstellt, {migrErgebnis.fragenAktualisiert} Fragen aktualisiert ({migrErgebnis.dauerMs}ms)
          </div>
        )}
        {migrFehler && (
          <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 rounded">
            Fehler: {migrFehler}
          </div>
        )}
      </section>

      <BaseDialog
        open={migrConfirmOpen}
        onClose={() => setMigrConfirmOpen(false)}
        title="Tag-Migration starten?"
        footer={
          <>
            <Button onClick={() => setMigrConfirmOpen(false)} variant="ghost">Abbrechen</Button>
            <Button onClick={handleMigrationStartenOK} variant="primary">Migration starten</Button>
          </>
        }
      >
        <p className="text-slate-700 dark:text-slate-300">Die Migration läuft nur einmal. Wenn das Tags-Sheet bereits befüllt ist, gibt das Backend einen Fehler zurück.</p>
        <p className="mt-2 text-slate-700 dark:text-slate-300">Wirklich starten?</p>
      </BaseDialog>

      {/* === Cluster D Phase 0 — Status-Backfill (einmalige Wartungs-Aktion) === */}
      <section className="mt-8 p-4 border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-100">⚠ Cluster D Phase 0 — Status-Backfill (einmalig)</h3>
        <p className="text-sm mb-3 text-slate-700 dark:text-slate-300">
          Füllt alle Frage-Sheets mit leerer Status-Spalte (Default „sammlung") auf.
          Idempotent — Zeilen mit bereits gesetztem Status („draft" oder „sammlung") bleiben unangetastet.
        </p>
        <Button onClick={() => setStatusBackfillConfirmOpen(true)} variant="primary" disabled={statusBackfillLaeuft} loading={statusBackfillLaeuft}>
          {statusBackfillLaeuft ? 'Läuft...' : 'Status-Backfill starten'}
        </Button>
        {statusBackfillErgebnis && (
          <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 rounded">
            ✅ {statusBackfillErgebnis.count} Fragen mit Default „{statusBackfillErgebnis.defaultWert}" befüllt ({statusBackfillErgebnis.dauerMs}ms)
          </div>
        )}
        {statusBackfillFehler && (
          <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 rounded">
            Fehler: {statusBackfillFehler}
          </div>
        )}
      </section>

      <BaseDialog
        open={statusBackfillConfirmOpen}
        onClose={() => setStatusBackfillConfirmOpen(false)}
        title="Status-Backfill starten?"
        footer={
          <>
            <Button onClick={() => setStatusBackfillConfirmOpen(false)} variant="ghost">Abbrechen</Button>
            <Button onClick={handleStatusBackfillStartenOK} variant="primary">Backfill starten</Button>
          </>
        }
      >
        <p className="text-slate-700 dark:text-slate-300">Alle Fragen ohne expliziten Status bekommen den Default „sammlung". Bestehende „draft"-Marker bleiben unverändert.</p>
        <p className="mt-2 text-slate-700 dark:text-slate-300">Wirklich starten?</p>
      </BaseDialog>
    </div>
  )
}
