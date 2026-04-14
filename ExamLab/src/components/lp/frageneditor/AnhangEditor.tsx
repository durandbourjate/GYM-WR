// Wrapper um shared AnhangEditor — ergänzt Pruefung-spezifischen AudioRecorder
import SharedAnhangEditor from '@shared/editor/components/AnhangEditor'
import type { AnhangEditorProps as SharedProps } from '@shared/editor/components/AnhangEditor'
import AudioRecorder from '../../AudioRecorder.tsx'

type Props = Omit<SharedProps, 'AudioRecorderComponent'>

export default function AnhangEditor(props: Props) {
  return <SharedAnhangEditor {...props} AudioRecorderComponent={AudioRecorder} />
}
