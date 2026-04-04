interface Konto { nr: string; name: string; kategorie?: string }

interface Props {
  konten: Konto[]
  value: string
  onChange: (nr: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function KontenSelect({ konten, value, onChange, disabled, placeholder = 'Konto wählen...' }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm min-h-[44px] w-full
        ${!value ? 'text-gray-400' : ''}
        ${disabled ? 'opacity-60 cursor-default' : 'cursor-pointer'}
      `}
    >
      <option value="">{placeholder}</option>
      {konten.map((k) => (
        <option key={k.nr} value={k.nr}>
          {k.nr} {k.name}
        </option>
      ))}
    </select>
  )
}
