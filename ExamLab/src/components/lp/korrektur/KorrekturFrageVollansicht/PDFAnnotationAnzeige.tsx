import type { Frage, FrageAnhang } from '../../../../types/fragen-storage'
import type { Antwort } from '../../../../types/antworten'
import MediaAnhang from '../../../MediaAnhang.tsx'
import { toAssetUrl } from '../../../../utils/assetUrl'
import { ermittlePdfQuelle } from '@shared/utils/mediaQuelleResolver'
import { mediaQuelleZuIframeSrc } from '@shared/utils/mediaQuelleUrl'

/** PDF-Annotation-Antwort mit PDF-Vorschau */
export default function PDFAnnotationAnzeige({ frage, antwort }: { frage: Frage; antwort: Extract<Antwort, { typ: 'pdf' }> | undefined }) {
  const pdfAnhang = ('anhaenge' in frage ? (frage as { anhaenge?: FrageAnhang[] }).anhaenge : [])?.find(a => a.mimeType === 'application/pdf')
  const pdfQuelle = ermittlePdfQuelle(frage as Parameters<typeof ermittlePdfQuelle>[0])
  const pdfDateiname = pdfQuelle?.dateiname ?? 'Dokument'

  const hatPdf = Boolean(pdfAnhang || pdfQuelle)

  return (
    <div className="mt-2 space-y-2">
      {/* PDF-Vorschau */}
      {hatPdf && (
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">📄 {pdfDateiname}</span>
          {pdfAnhang ? (
            <MediaAnhang anhang={pdfAnhang} />
          ) : pdfQuelle ? (
            <iframe
              src={mediaQuelleZuIframeSrc(pdfQuelle, toAssetUrl)}
              className="w-full rounded border border-slate-200 dark:border-slate-600"
              style={{ height: '400px' }}
              title={pdfDateiname}
            />
          ) : null}
        </div>
      )}
      {/* Annotationsinfo */}
      <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
        <span className="text-sm text-slate-700 dark:text-slate-200">
          {antwort ? `${antwort.annotationen?.length ?? 0} Annotationen (Markierungen, Kommentare, Freihand)` : 'Keine Antwort'}
        </span>
      </div>
    </div>
  )
}
