import { useState, useEffect } from 'react'
import { TabBar } from '../ui/TabBar'
import { ResizableSidebar } from '@shared/ui/ResizableSidebar'
import { useAuthStore } from '../../store/authStore'
import { useStammdatenStore } from '../../store/stammdatenStore'
import LernzielTab from './LernzielTab'
import FavoritenTab from './FavoritenTab'
import AdminSettings from '../ueben/admin/AdminSettings'
import KIKalibrierungTab from './kiKalibrierung/KIKalibrierungTab'
import ProblemmeldungenTab from './problemmeldungen/ProblemmeldungenTab'
import FragensammlungTab from './fragensammlung/FragensammlungTab'
import { listeProblemmeldungen } from '../../services/problemmeldungenApi'
import type { Problemmeldung } from '../../types/problemmeldung'
import ProfilTab from './einstellungen/ProfilTab'
import AdminTab from './einstellungen/AdminTab'

import type { EinstellungenTab } from '../../store/lpUIStore'

interface Props {
  onSchliessen: () => void
  initialTab?: EinstellungenTab
}

/**
 * Einstellungen-Panel: ResizableSidebar.
 * - Mein Profil: LP konfiguriert eigene Kurse/Fächer/Gefässe
 * - Admin: Stammdaten verwalten (nur Admins)
 */
export default function EinstellungenPanel({ onSchliessen, initialTab }: Props) {
  const user = useAuthStore(s => s.user)
  const { stammdaten, lpProfil, istAdmin, ladeStammdaten, ladeLPProfil } = useStammdatenStore()
  const admin = istAdmin(user?.email)

  const [tab, setTab] = useState<EinstellungenTab>(initialTab ?? (admin ? 'admin' : 'profil'))

  // Stammdaten + Profil laden (Actions sind stabile Zustand-Referenzen)
  useEffect(() => {
    if (user?.email) {
      ladeStammdaten(user.email)
      ladeLPProfil(user.email)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  // F1 Problemmeldungen: beim Mount laden (für Tab-Badge mit offenem Count)
  const [meldungen, setMeldungen] = useState<Problemmeldung[] | null>(null)
  useEffect(() => {
    if (!user?.email) return
    let abgebrochen = false
    listeProblemmeldungen(user.email)
      .then(data => { if (!abgebrochen) setMeldungen(data) })
      .catch(() => { if (!abgebrochen) setMeldungen([]) })
    return () => { abgebrochen = true }
  }, [user?.email])
  const offeneCount = meldungen ? meldungen.filter(m => !m.erledigt).length : 0

  const tabs: { key: EinstellungenTab; label: string; sichtbar: boolean }[] = [
    { key: 'profil', label: 'Mein Profil', sichtbar: true },
    { key: 'lernziele', label: 'Lernziele', sichtbar: true },
    { key: 'favoriten', label: 'Favoriten', sichtbar: true },
    { key: 'problemmeldungen', label: `Problemmeldungen${offeneCount > 0 ? ` (${offeneCount})` : ''}`, sichtbar: true },
    { key: 'uebungen', label: 'Übungen', sichtbar: true },
    { key: 'fragensammlung', label: 'Fragensammlung', sichtbar: true },
    { key: 'admin', label: 'Admin', sichtbar: admin },
    { key: 'kiKalibrierung', label: 'KI-Kalibrierung', sichtbar: true },
  ]

  const sichtbareTabs = tabs.filter(t => t.sichtbar)

  // Header-Höhe messen, damit Overlay unterhalb des App-Headers beginnt
  const [headerH, setHeaderH] = useState(0)
  useEffect(() => {
    const h = document.querySelector('header')?.getBoundingClientRect()?.height ?? 0
    setHeaderH(h)
  }, [])

  return (
    <ResizableSidebar
      mode="overlay"
      title="Einstellungen"
      onClose={onSchliessen}
      topOffset={headerH}
      storageKey="einstellungen-breite"
    >
      <div className="p-4">
      {/* Tabs */}
      <div className="pb-3">
        <TabBar
          tabs={sichtbareTabs.map(t => ({ id: t.key, label: t.label }))}
          activeTab={tab}
          onTabChange={(id) => setTab(id as EinstellungenTab)}
          size="sm"
        />
      </div>

      <div>
        {tab === 'profil' && user?.email && (
          <ProfilTab email={user.email} stammdaten={stammdaten} profil={lpProfil} />
        )}
        {tab === 'lernziele' && user?.email && (
          <LernzielTab email={user.email} />
        )}
        {tab === 'favoriten' && (
          <FavoritenTab istAdmin={admin} />
        )}
        {tab === 'uebungen' && <AdminSettings />}
        {tab === 'admin' && admin && user?.email && (
          <AdminTab email={user.email} stammdaten={stammdaten} />
        )}
        {tab === 'kiKalibrierung' && user?.email && (
          <KIKalibrierungTab email={user.email} />
        )}
        {tab === 'problemmeldungen' && user?.email && (
          <ProblemmeldungenTab email={user.email} istAdmin={admin} onSchliessen={onSchliessen} />
        )}
        {tab === 'fragensammlung' && user?.email && (
          <FragensammlungTab email={user.email} istAdmin={admin} />
        )}
      </div>
      </div>
    </ResizableSidebar>
  )
}
