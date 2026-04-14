import { useRef, useState, type ReactNode } from 'react'
import { resolveAssetUrl } from '../../utils/ueben/assetUrl'

interface Props {
  src: string
  alt: string
  children?: (bounds: { width: number; height: number }) => ReactNode
}

/** Shared Bild-Wrapper: Lädt Bild, misst Dimensionen, rendert Overlay-Children */
export default function BildContainer({ src, alt, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [bounds, setBounds] = useState<{ width: number; height: number } | null>(null)
  const [fehler, setFehler] = useState(false)

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setBounds({ width: img.clientWidth, height: img.clientHeight })
  }

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      {fehler ? (
        <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 text-sm">
          Bild konnte nicht geladen werden
        </div>
      ) : (
        <>
          <img
            src={resolveAssetUrl(src)}
            alt={alt}
            onLoad={handleLoad}
            onError={() => setFehler(true)}
            className="w-full rounded-xl"
            draggable={false}
          />
          {bounds && children && (
            <div className="absolute inset-0" style={{ width: bounds.width, height: bounds.height }}>
              {children(bounds)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
