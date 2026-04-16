import AdminThemensteuerung from './AdminThemensteuerung'
// AdminAuftraege entfernt (Bundle 8) — Aufträge werden in LearningView verwaltet.
// AdminUebersicht entfernt (Bundle 13 I) — Inhalt verschoben in Einstellungen→Mitglieder.
// AdminKindDetail + AdminThemaDetail entfernt (S115 C) — keine Entry-Points mehr.
// AdminFragenbank entfernt — Fragenbank ist über LPHeader erreichbar

interface AdminDashboardProps {
  onZuUeben?: () => void
  onFachKlick?: () => void
}

export default function AdminDashboard({ onZuUeben: _onZuUeben, onFachKlick: _onFachKlick }: AdminDashboardProps) {
  return (
    <main className="max-w-7xl mx-auto p-6">
      <AdminThemensteuerung />
    </main>
  )
}
