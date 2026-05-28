import {
  ClipboardList, BarChart3, Eye, Target, Play, TrendingUp, BookOpen, Settings,
  User, GraduationCap, Star, Wrench, MapPin, HelpCircle, FileText,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'

/**
 * NavIcon Map-Layer — Persist-Schema seit #4 (17.05.2026).
 *
 * Canonical-Storage-Form: Lucide-Component-Name als String-Key
 * (z.B. 'ClipboardList', 'Star'). Persisted im favoritenStore.icon und
 * im appNavigation.ts Tab-Tree.
 *
 * Legacy-Form (Pre-#4): Emoji-Strings (📝, ⭐, ...). Wird via `EMOJI_TO_KEY`
 * im favoritenStore-Persist `migrate(v1 → v2)` einmalig konvertiert.
 * Runtime-Fallback in `iconStringToComponent` deckt Emoji-Strings ebenfalls
 * ab (defensiv für nicht-migrierte Persist-Stände, z.B. wenn migrate
 * versagt — siehe `migrate`-Catch im Store).
 *
 * Liegt in einer separaten Datei, weil React-Fast-Refresh nur funktioniert
 * wenn Component-Files ausschliesslich Components exportieren
 * (`only-export-components`-Rule).
 */
export const LUCIDE_KEY_MAP: Record<string, ComponentType<LucideProps>> = {
  ClipboardList,
  BarChart3,
  Eye,
  Target,
  Play,
  TrendingUp,
  BookOpen,
  Settings,
  User,
  GraduationCap,
  Star,
  Wrench,
  MapPin,
  HelpCircle,
  FileText,
}

/** Legacy-Mapping: Pre-#4 Emoji-Strings → Canonical Lucide-Key.
 *  Variant-Selectors (U+FE0F) sind enthalten, weil ältere persistierte
 *  Daten beide Formen haben können (mit/ohne FE0F). */
export const EMOJI_TO_KEY: Record<string, string> = {
  '📝': 'ClipboardList',
  '📊': 'BarChart3',
  '👁️': 'Eye',
  '👁': 'Eye',
  '🎯': 'Target',
  '▶️': 'Play',
  '▶': 'Play',
  '📈': 'TrendingUp',
  '📚': 'BookOpen',
  '⚙️': 'Settings',
  '⚙': 'Settings',
  '👤': 'User',
  '🎓': 'GraduationCap',
  '⭐': 'Star',
  '☆': 'Star',
  '🔧': 'Wrench',
  '📍': 'MapPin',
  '❓': 'HelpCircle',
  '📄': 'FileText',
}

/** Konvertiert einen beliebigen Icon-String (Lucide-Key oder Legacy-Emoji)
 *  in den canonical Lucide-Key. Returnt `null` wenn weder Key noch Emoji
 *  bekannt sind (User-Custom-String). */
export function iconStringToCanonicalKey(s: string): string | null {
  if (s in LUCIDE_KEY_MAP) return s
  if (s in EMOJI_TO_KEY) return EMOJI_TO_KEY[s]
  return null
}

/** Render-Lookup: Icon-String → Lucide-Komponente.
 *  Dual-mode: nimmt sowohl canonical Keys als auch Legacy-Emoji-Strings,
 *  damit nicht-migrierte Persist-Stände noch korrekt rendern. */
export function iconStringToComponent(s: string): ComponentType<LucideProps> | null {
  if (s in LUCIDE_KEY_MAP) return LUCIDE_KEY_MAP[s]
  const key = EMOJI_TO_KEY[s]
  return key ? LUCIDE_KEY_MAP[key] : null
}
