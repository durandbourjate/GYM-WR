export * from './types/fragen'
export * from './types/auth'

// Editor Infrastructure
export * from './editor/types'
export { EditorProvider, useEditorContext, useEditorConfig, useEditorServices } from './editor/EditorContext'
export * from './editor/editorUtils'
export * from './editor/fragenValidierung'
export * from './editor/fragenFactory'
export * from './editor/zeitbedarf'
export * from './editor/fachUtils'
export * from './editor/kontenrahmen'
export * from './editor/musterloesungGenerierung'
export * from './editor/musterloesungNormalizer'
export { useKIAssistent } from './editor/useKIAssistent'
export type { AktionKey, AktionErgebnis } from './editor/useKIAssistent'
export { useFocusTrap } from './editor/hooks/useFocusTrap'

// UI-Komponenten
export { Abschnitt, Feld } from './editor/components/EditorBausteine'
export { default as FormattierungsToolbar } from './editor/components/FormattierungsToolbar'
export { ResizableSidebar } from './ui/ResizableSidebar'
export { useResizableHandle } from './ui/useResizableHandle'

// Typ-Editoren
export { default as MCEditor } from './editor/typen/MCEditor'
export { default as RichtigFalschEditor } from './editor/typen/RichtigFalschEditor'
export { default as FreitextEditor } from './editor/typen/FreitextEditor'
export { default as LueckentextEditor } from './editor/typen/LueckentextEditor'
export { default as ZuordnungEditor } from './editor/typen/ZuordnungEditor'
export { default as BerechnungEditor } from './editor/typen/BerechnungEditor'
export { default as SortierungEditor } from './editor/typen/SortierungEditor'
export { default as CodeEditor } from './editor/typen/CodeEditor'
export { default as AudioEditor } from './editor/typen/AudioEditor'
export { default as HotspotEditor } from './editor/typen/HotspotEditor'
export { default as BildbeschriftungEditor } from './editor/typen/BildbeschriftungEditor'
export { default as DragDropBildEditor } from './editor/typen/DragDropBildEditor'
export { default as BildUpload } from './editor/components/BildUpload'
export { default as KontenSelect } from './editor/components/KontenSelect'

// FiBu-Editoren
export { default as BuchungssatzEditor } from './editor/typen/BuchungssatzEditor'
export { default as TKontoEditor, TKontoBewertungsoptionen } from './editor/typen/TKontoEditor'
export { default as BilanzEREditor, BilanzERBewertungsoptionen } from './editor/typen/BilanzEREditor'
export { default as KontenbestimmungEditor } from './editor/typen/KontenbestimmungEditor'

// KI-Komponenten
export { InlineAktionButton, ErgebnisAnzeige } from './editor/ki/KIBausteine'
export { KIZuordnungButtons, KIRichtigFalschButtons, KILueckentextButtons, KIBerechnungButtons } from './editor/ki/KITypButtons'
export { KIBuchungssatzButtons, KITKontoButtons, KIKontenbestimmungButtons, KIBilanzERButtons } from './editor/ki/KIFiBuButtons'
export { KIFragetextButtons, KIMusterlosungButtons, KIMusterlosungButton, KIMCOptionenButton } from './editor/ki/KIAssistentPanel'

// Spezial-Editoren
export { default as FormelEditor } from './editor/typen/FormelEditor'
export { default as ZeichnenEditor } from './editor/typen/ZeichnenEditor'
export { default as AufgabengruppeEditor } from './editor/typen/AufgabengruppeEditor'
export { default as BewertungsrasterEditor } from './editor/typen/BewertungsrasterEditor'
export { default as FrageTypAuswahl } from './editor/components/FrageTypAuswahl'

// Sections
export { default as TypEditorDispatcher } from './editor/sections/TypEditorDispatcher'
export { default as FragetextSection } from './editor/sections/FragetextSection'
export { default as MetadataSection } from './editor/sections/MetadataSection'
export { default as MusterloesungSection } from './editor/sections/MusterloesungSection'

// Utils
export { loesungsquoteFarbe, loesungsquoteBgFarbe } from './editor/utils/performanceUtils'
