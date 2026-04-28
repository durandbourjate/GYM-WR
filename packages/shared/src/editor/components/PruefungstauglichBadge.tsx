interface Props {
  pruefungstauglich: boolean
  empfohlenLeerFelder: string[]
  onClickLeeresFeld?: (feldName: string) => void
}

export default function PruefungstauglichBadge({
  pruefungstauglich,
  empfohlenLeerFelder,
  onClickLeeresFeld,
}: Props) {
  if (pruefungstauglich) return null

  return (
    <div className="inline-flex flex-col gap-1">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
        Nicht prüfungstauglich
      </span>
      {empfohlenLeerFelder.length > 0 && (
        <ul className="text-xs text-rose-700 dark:text-rose-300 space-y-0.5">
          {empfohlenLeerFelder.map((feld) => (
            <li key={feld}>
              <button
                type="button"
                onClick={() => onClickLeeresFeld?.(feld)}
                className="underline hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer"
              >
                {feld}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
