/** Generiert eine SEB-Konfigurationsdatei (XML/plist) für eine Prüfung */
import { DEFAULT_SCHUL_CONFIG } from '../types/schulConfig'

const BASE_URL = 'https://durandbourjate.github.io/GYM-WR-DUY/Pruefung/'

export function generiereSebConfig(pruefungId: string, _pruefungTitel: string, schulName?: string): string {
  const schule = schulName ?? DEFAULT_SCHUL_CONFIG.schulName
  const startURL = `${BASE_URL}?id=${encodeURIComponent(pruefungId)}`

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- SEB-Konfiguration: ${schule} — automatisch generiert -->

    <!-- === GENERAL === -->
    <key>startURL</key>
    <string>${startURL}</string>

    <key>browserWindowTitleSuffix</key>
    <string>${schule} — Prüfung</string>

    <key>browserViewMode</key>
    <integer>1</integer>

    <key>allowWindowClose</key>
    <false/>

    <!-- === BROWSER === -->
    <key>enableBrowserWindowNavigation</key>
    <false/>

    <key>browserWindowAllowReload</key>
    <true/>

    <!-- 0=block, 1=same window, 2=new window -->
    <key>newBrowserWindowByLinkPolicy</key>
    <integer>1</integer>

    <key>newBrowserWindowByScriptPolicy</key>
    <integer>2</integer>

    <key>newBrowserWindowByLinkBlockForeign</key>
    <false/>

    <key>enableJavaScript</key>
    <true/>

    <key>enablePlugIns</key>
    <false/>

    <!-- === USER INTERFACE === -->
    <key>showTaskBar</key>
    <false/>

    <key>showTime</key>
    <true/>

    <key>showReloadButton</key>
    <false/>

    <key>enableURLFilter</key>
    <true/>

    <!-- === SICHERHEIT === -->
    <key>enableRightMouse</key>
    <false/>

    <key>enableAltTab</key>
    <false/>

    <key>enableScreenCapture</key>
    <false/>

    <key>enableClipboard</key>
    <false/>

    <key>enableSpellChecking</key>
    <false/>

    <key>enableDictation</key>
    <false/>

    <key>enableTouchExit</key>
    <false/>

    <key>allowVirtualMachine</key>
    <false/>

    <key>allowSiri</key>
    <false/>

    <key>allowDisplayMirroring</key>
    <false/>

    <!-- === URL-FILTER === -->
    <key>URLFilterEnable</key>
    <true/>

    <key>URLFilterEnableContentFilter</key>
    <true/>

    <key>URLFilterRules</key>
    <array>
        <dict>
            <key>action</key>
            <integer>1</integer>
            <key>active</key>
            <true/>
            <key>expression</key>
            <string>durandbourjate.github.io/*</string>
            <key>regex</key>
            <false/>
        </dict>
        <dict>
            <key>action</key>
            <integer>1</integer>
            <key>active</key>
            <true/>
            <key>expression</key>
            <string>accounts.google.com/*</string>
            <key>regex</key>
            <false/>
        </dict>
        <dict>
            <key>action</key>
            <integer>1</integer>
            <key>active</key>
            <true/>
            <key>expression</key>
            <string>*.googleapis.com/*</string>
            <key>regex</key>
            <false/>
        </dict>
        <dict>
            <key>action</key>
            <integer>1</integer>
            <key>active</key>
            <true/>
            <key>expression</key>
            <string>script.google.com/*</string>
            <key>regex</key>
            <false/>
        </dict>
        <dict>
            <key>action</key>
            <integer>1</integer>
            <key>active</key>
            <true/>
            <key>expression</key>
            <string>*.gstatic.com/*</string>
            <key>regex</key>
            <false/>
        </dict>
        <dict>
            <key>action</key>
            <integer>1</integer>
            <key>active</key>
            <true/>
            <key>expression</key>
            <string>*.google.com/*</string>
            <key>regex</key>
            <false/>
        </dict>
        <dict>
            <key>action</key>
            <integer>1</integer>
            <key>active</key>
            <true/>
            <key>expression</key>
            <string>fonts.googleapis.com/*</string>
            <key>regex</key>
            <false/>
        </dict>
        <dict>
            <key>action</key>
            <integer>1</integer>
            <key>active</key>
            <true/>
            <key>expression</key>
            <string>fonts.gstatic.com/*</string>
            <key>regex</key>
            <false/>
        </dict>
        <dict>
            <key>action</key>
            <integer>1</integer>
            <key>active</key>
            <true/>
            <key>expression</key>
            <string>ssl.gstatic.com/*</string>
            <key>regex</key>
            <false/>
        </dict>
        <dict>
            <key>action</key>
            <integer>1</integer>
            <key>active</key>
            <true/>
            <key>expression</key>
            <string>lh3.googleusercontent.com/*</string>
            <key>regex</key>
            <false/>
        </dict>
        <dict>
            <key>action</key>
            <integer>1</integer>
            <key>active</key>
            <true/>
            <key>expression</key>
            <string>*.googleusercontent.com/*</string>
            <key>regex</key>
            <false/>
        </dict>
        <dict>
            <key>action</key>
            <integer>0</integer>
            <key>active</key>
            <true/>
            <key>expression</key>
            <string>*</string>
            <key>regex</key>
            <false/>
        </dict>
    </array>

    <!-- === BEENDEN === -->
    <key>hashedQuitPassword</key>
    <string></string>

    <key>quitURL</key>
    <string></string>

    <key>allowQuit</key>
    <true/>

    <key>quitURLConfirm</key>
    <true/>

    <!-- === NETZWERK === -->
    <key>pinEmbeddedCertificates</key>
    <false/>

    <key>proxySettingsPolicy</key>
    <integer>0</integer>

    <!-- === ZUSÄTZLICHE EINSTELLUNGEN === -->
    <key>sendBrowserExamKey</key>
    <true/>

    <key>createNewDesktop</key>
    <true/>

    <key>enableLogging</key>
    <true/>

    <key>logLevel</key>
    <integer>1</integer>

</dict>
</plist>
`
}

/** Löst den Download einer .seb-Datei aus */
export function downloadSebDatei(pruefungId: string, pruefungTitel: string): void {
  const xml = generiereSebConfig(pruefungId, pruefungTitel)
  const blob = new Blob([xml], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)

  // Dateiname: Sonderzeichen entfernen, Leerzeichen durch Unterstrich
  const saubererTitel = pruefungTitel
    .replace(/[^a-zA-Z0-9äöüÄÖÜéèêàâ\s-]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60)

  const dateiname = `Pruefung_${saubererTitel}.seb`

  const a = document.createElement('a')
  a.href = url
  a.download = dateiname
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
