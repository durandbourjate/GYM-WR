import { TYPO } from '../../styles/typografie'

interface Props {
  titel: string
}

export function PageTitle({ titel }: Props) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
      <h1 className={TYPO.display}>{titel}</h1>
    </div>
  )
}
