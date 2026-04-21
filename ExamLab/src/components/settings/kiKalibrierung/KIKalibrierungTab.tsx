import { useState } from 'react'
import { TabBar } from '../../ui/TabBar'
import BeispieleListe from './BeispieleListe'
import StatistikKarten from './StatistikKarten'
import KalibrierungsEinstellungen from './EinstellungenPanel'

type Sub = 'beispiele' | 'statistik' | 'einstellungen'

const TABS: { id: Sub; label: string }[] = [
  { id: 'beispiele', label: 'Beispiele' },
  { id: 'statistik', label: 'Statistik' },
  { id: 'einstellungen', label: 'Einstellungen' },
]

export default function KIKalibrierungTab({ email }: { email: string }) {
  const [sub, setSub] = useState<Sub>('statistik')
  return (
    <div className="space-y-4">
      <TabBar tabs={TABS} activeTab={sub} onTabChange={(id) => setSub(id as Sub)} size="sm" />
      {sub === 'beispiele' && <BeispieleListe email={email} />}
      {sub === 'statistik' && <StatistikKarten email={email} />}
      {sub === 'einstellungen' && <KalibrierungsEinstellungen email={email} />}
    </div>
  )
}
