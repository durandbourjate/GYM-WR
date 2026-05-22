// ExamLab/src/components/ueben/dashboard/SchwierigkeitIcon.tsx
import { SignalLow, SignalMedium, SignalHigh } from 'lucide-react'

const KARTE: Record<number, { Icon: typeof SignalLow; label: string }> = {
  1: { Icon: SignalLow, label: 'Einfach' },
  2: { Icon: SignalMedium, label: 'Mittel' },
  3: { Icon: SignalHigh, label: 'Schwer' },
}

export function SchwierigkeitIcon({ stufe, className }: { stufe: number; className?: string }) {
  const { Icon, label } = KARTE[stufe] ?? KARTE[2]
  return <Icon className={className ?? 'w-4 h-4'} aria-label={label} />
}
