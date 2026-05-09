import { Titel, Untertitel, Text } from './layoutHelpers'

export default function HilfeZusammenarbeit() {
  return (
    <div>
      <Titel>Zusammenarbeit & Sharing</Titel>
      <Text>
        Fragen und Prüfungen können mit anderen Lehrpersonen geteilt werden. Das Rechte-System folgt dem Google-Docs-Modell mit drei Rollen.
      </Text>

      <Untertitel>Rollen</Untertitel>
      <ul className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed list-disc pl-5 space-y-1">
        <li><strong>Inhaber</strong> — Ersteller der Frage/Prüfung. Kann alles: bearbeiten, löschen, Berechtigungen vergeben.</li>
        <li><strong>Bearbeiter</strong> — Darf die Frage/Prüfung bearbeiten, aber nicht löschen oder Rechte vergeben.</li>
        <li><strong>Betrachter</strong> — Darf die Frage/Prüfung sehen und als Kopie übernehmen, aber nicht ändern.</li>
      </ul>

      <Untertitel>Sichtbarkeit</Untertitel>
      <Text>
        Im Berechtigungs-Editor können Sie die Sichtbarkeit schnell einstellen:
      </Text>
      <ul className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed list-disc pl-5 space-y-1">
        <li><strong>Privat</strong> — Nur für Sie sichtbar (Standard).</li>
        <li><strong>Fachschaft</strong> — Alle LP Ihrer Fachschaft sehen die Frage als Betrachter.</li>
        <li><strong>Schule</strong> — Alle LP am Gymnasium Hofwil sehen die Frage als Betrachter.</li>
      </ul>
      <Text>
        Zusätzlich können Sie einzelne LP als Bearbeiter oder Betrachter hinzufügen.
      </Text>

      <Untertitel>Fragen duplizieren</Untertitel>
      <Text>
        Geteilte Fragen können mit dem Kopier-Button als eigene Kopie übernommen werden. Die Kopie gehört Ihnen und ist zunächst privat. Änderungen an der Kopie beeinflussen das Original nicht.
      </Text>

      <Untertitel>Prüfungen teilen</Untertitel>
      <Text>
        In der Vorbereitungsphase einer Prüfung finden Sie den Abschnitt &laquo;Prüfung teilen&raquo;. Dort können Sie die Prüfung für Kolleginnen und Kollegen freigeben oder die Sichtbarkeit auf Fachschaft/Schule erweitern.
      </Text>

      <Untertitel>Rechte-Badges</Untertitel>
      <Text>
        In der Fragensammlung zeigen farbige Badges Ihre Rolle bei geteilten Fragen an: <strong>Bearbeiter</strong> (blau) oder <strong>Betrachter</strong> (grau). Eigene Fragen (Inhaber) haben keinen Badge.
      </Text>
    </div>
  )
}
