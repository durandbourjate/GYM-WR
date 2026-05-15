/**
 * TagEditModal — Umbenennen + Farbe ändern für einen einzelnen Tag
 * (Cluster H Phase 2 C4a). Jede LP darf das (kein Admin-Gate).
 *
 * Speichert via `aktualisiereTag` und schreibt das Ergebnis via `upsertLokal`
 * in den Tags-Store zurück (kein Re-Lade-Roundtrip nötig).
 */
import { useState } from 'react'
import { TAG_FARBEN, type Tag, type TagFarbe } from '@shared/types/tag'
import { aktualisiereTag } from '../../../../services/tagsApi'
import { useTagsStore } from '../../../../store/tagsStore'
import { useToastStore } from '../../../../store/toastStore'
import BaseDialog from '../../../ui/BaseDialog'
import Button from '../../../ui/Button'
import { TagFarbeChip } from './TagFarbeChip'

interface Props {
  email: string
  tag: Tag
  onClose: () => void
}

export function TagEditModal({ email, tag, onClose }: Props) {
  const upsertLokal = useTagsStore((s) => s.upsertLokal)
  const toastAdd = useToastStore((s) => s.add)

  const [name, setName] = useState(tag.name)
  const [farbe, setFarbe] = useState<TagFarbe>(tag.farbe)
  const [speichert, setSpeichert] = useState(false)

  const trimmed = name.trim()
  const geaendert = trimmed !== tag.name || farbe !== tag.farbe
  const valide = trimmed.length > 0

  const onSpeichern = async () => {
    if (!valide || !geaendert || speichert) return
    setSpeichert(true)
    try {
      const aktualisiert = await aktualisiereTag({
        email,
        id: tag.id,
        ...(trimmed !== tag.name ? { name: trimmed } : {}),
        ...(farbe !== tag.farbe ? { farbe } : {}),
      })
      upsertLokal(aktualisiert)
      toastAdd('success', `Tag „${aktualisiert.name}" gespeichert.`)
      onClose()
    } catch (e) {
      toastAdd('error', `Speichern fehlgeschlagen: ${String(e)}`)
    } finally {
      setSpeichert(false)
    }
  }

  return (
    <BaseDialog
      open
      onClose={onClose}
      title="Tag bearbeiten"
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={speichert}>Abbrechen</Button>
          <Button
            variant="primary"
            onClick={() => void onSpeichern()}
            disabled={!valide || !geaendert}
            loading={speichert}
          >
            Speichern
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full px-3 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600
                       bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                       placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {!valide && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-300">Name darf nicht leer sein.</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
            Farbe
          </label>
          <div className="flex flex-wrap gap-2">
            {TAG_FARBEN.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFarbe(f)}
                aria-label={`Farbe ${f}${f === farbe ? ' (gewählt)' : ''}`}
                className={`rounded-full transition ${f === farbe
                  ? 'ring-2 ring-violet-500 dark:ring-violet-400'
                  : 'hover:opacity-80'}`}
              >
                <TagFarbeChip farbe={f} label={trimmed || tag.name || 'Beispiel'} size="sm" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </BaseDialog>
  )
}
