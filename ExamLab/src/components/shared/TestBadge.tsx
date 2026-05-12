interface Props {
  className?: string
}

export default function TestBadge({ className = '' }: Props) {
  return (
    <span
      className={`bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 text-xs font-medium rounded-full px-2 py-0.5 ${className}`.trim()}
    >
      Test
    </span>
  )
}
