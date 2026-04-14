// Build-Datum wird von Vite zur Build-Zeit injiziert (vite.config.ts define)
// Typ-Deklaration in vite-env.d.ts
export const APP_VERSION = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'dev'
