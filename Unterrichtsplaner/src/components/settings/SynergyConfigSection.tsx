import { useState } from 'react'
import { useToast } from '@gymhofwil/shared'
import { Section } from './shared'
import { useSynergyConfigStore, useSynergyKonfiguriert } from '../../store/synergyConfigStore'
import { validateSynergyConfig } from '../../utils/synergyConfigValidation'

export function SynergyConfigSection() {
  const toast = useToast()
  const appsScriptUrl = useSynergyConfigStore((s) => s.appsScriptUrl)
  const lpEmail = useSynergyConfigStore((s) => s.lpEmail)
  const setConfig = useSynergyConfigStore((s) => s.setConfig)
  const konfiguriert = useSynergyKonfiguriert()

  const [urlInput, setUrlInput] = useState(appsScriptUrl)
  const [emailInput, setEmailInput] = useState(lpEmail)
  const [urlError, setUrlError] = useState<string | undefined>(undefined)
  const [emailError, setEmailError] = useState<string | undefined>(undefined)

  const handleSave = () => {
    const { urlError: ue, emailError: ee } = validateSynergyConfig(urlInput, emailInput)
    setUrlError(ue)
    setEmailError(ee)
    if (ue || ee) return
    setConfig({ appsScriptUrl: urlInput.trim(), lpEmail: emailInput.trim() })
    toast.success('Synergy-Konfiguration gespeichert')
  }

  return (
    <Section title="🔗 Synergy-Verbindung">
      <div className="space-y-3">
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {konfiguriert
            ? '✓ Konfiguriert — Kurs-Import und Noten-Stand sind aktiv.'
            : 'Nicht konfiguriert. Apps-Script-URL und LP-E-Mail eintragen, um Kurs-Import und Noten-Stand zu aktivieren.'}
        </p>

        <label className="block">
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>Apps-Script-URL</span>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full mt-0.5 px-2 py-1 rounded text-[12px]"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />
          {urlError && <span className="text-[11px] text-red-400">{urlError}</span>}
        </label>

        <label className="block">
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>Lehrperson-E-Mail</span>
          <input
            type="text"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="vorname.name@gymhofwil.ch"
            className="w-full mt-0.5 px-2 py-1 rounded text-[12px]"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />
          {emailError && <span className="text-[11px] text-red-400">{emailError}</span>}
        </label>

        <button
          onClick={handleSave}
          className="px-3 py-1 rounded text-[12px] font-medium cursor-pointer"
          style={{ background: 'var(--text-link)', color: '#fff' }}
        >
          Speichern
        </button>
      </div>
    </Section>
  )
}
