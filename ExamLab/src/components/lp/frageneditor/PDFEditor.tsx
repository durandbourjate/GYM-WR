// Wrapper um shared PDFEditor — ergänzt usePDFRenderer für automatische Seitenzählung
import SharedPDFEditor from '@shared/editor/components/PDFEditor'
import type { PDFEditorProps as SharedProps } from '@shared/editor/components/PDFEditor'
import { usePDFRenderer } from '../../fragetypen/pdf/usePDFRenderer.ts'

type Props = Omit<SharedProps, 'pdfRenderer'>

export default function PDFEditor(props: Props) {
  const pdf = usePDFRenderer()
  return <SharedPDFEditor {...props} pdfRenderer={pdf} />
}
