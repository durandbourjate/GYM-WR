import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'
import { LUCIDE_KEY_MAP } from './NavIcon'
import { FRAGETYP_ICON_MAP } from './FragetypIcon'
import { TYPO } from '../../../styles/typografie'

type IconEntry = { name: string; Icon: ComponentType<LucideProps> }

interface IconGridProps {
  titel: string
  beschreibung: string
  icons: IconEntry[]
  groesse?: 'sm' | 'md' | 'lg'
}

function IconGrid({ titel, beschreibung, icons, groesse = 'md' }: IconGridProps) {
  const sizeCls = groesse === 'sm' ? 'w-4 h-4' : groesse === 'lg' ? 'w-8 h-8' : 'w-6 h-6'
  return (
    <section className="p-6">
      <h2 className={`${TYPO.h1} text-slate-800 dark:text-slate-100 mb-1`}>{titel}</h2>
      <p className={`${TYPO.body} text-slate-600 dark:text-slate-400 mb-4`}>{beschreibung}</p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {icons.map(({ name, Icon }) => (
          <li
            key={name}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <Icon className={`${sizeCls} text-slate-700 dark:text-slate-300`} aria-hidden="true" />
            <code className="text-xs text-slate-600 dark:text-slate-400 text-center break-all">{name}</code>
          </li>
        ))}
      </ul>
    </section>
  )
}

const navIcons: IconEntry[] = Object.entries(LUCIDE_KEY_MAP)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, Icon]) => ({ name, Icon }))

const fragetypIcons: IconEntry[] = Object.entries(FRAGETYP_ICON_MAP)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([typ, Icon]) => ({ name: typ, Icon }))

const meta: Meta<typeof IconGrid> = {
  title: 'Design System/Icons',
  component: IconGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Gepflegte Galerie aller Icons in ExamLab. ' +
          'Quelle: `LUCIDE_KEY_MAP` (Navigation) und `FRAGETYP_ICON_MAP` (Fragetypen). ' +
          'Bei neuem Icon: zuerst in die Map eintragen, dann hier verifizieren.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const NavigationIcons: Story = {
  args: {
    titel: 'Navigation-Icons',
    beschreibung:
      'Quelle: ExamLab/src/components/ui/icons/NavIcon.tsx::LUCIDE_KEY_MAP. ' +
      'Verwendet in appNavigation, FavoritenTab, TabBar.',
    icons: navIcons,
    groesse: 'md',
  },
}

export const FragetypIcons: Story = {
  args: {
    titel: 'Fragetyp-Icons',
    beschreibung:
      'Quelle: ExamLab/src/components/ui/icons/FragetypIcon.tsx::FRAGETYP_ICON_MAP. ' +
      'Pro Fragetyp ein Icon (TS-Compiler erzwingt Vollständigkeit).',
    icons: fragetypIcons,
    groesse: 'md',
  },
}

export const Groesse_SM: Story = {
  name: 'Größe sm (4×4)',
  args: {
    titel: 'Navigation-Icons (sm)',
    beschreibung: 'Standard für Tab-Header und inline-Badges.',
    icons: navIcons,
    groesse: 'sm',
  },
}

export const Groesse_LG: Story = {
  name: 'Größe lg (8×8)',
  args: {
    titel: 'Navigation-Icons (lg)',
    beschreibung: 'Für Favoriten-Karten und Empty-States.',
    icons: navIcons,
    groesse: 'lg',
  },
}
