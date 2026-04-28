const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL
const MIGRATION_EMAIL = process.env.MIGRATION_EMAIL

if (!APPS_SCRIPT_URL || !MIGRATION_EMAIL) {
  console.error('FEHLER: APPS_SCRIPT_URL und MIGRATION_EMAIL env-Variablen setzen.')
  process.exit(1)
}

export async function ladeAlleFragen() {
  const r = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'holeAlleFragenFuerMigration', email: MIGRATION_EMAIL }),
    redirect: 'follow',
  })
  if (!r.ok) throw new Error(`Apps-Script HTTP ${r.status}`)
  const json = await r.json()
  if (json.error) throw new Error(`Apps-Script: ${json.error}`)
  if (!Array.isArray(json.data)) throw new Error('Response data ist kein Array')
  return json.data
}
