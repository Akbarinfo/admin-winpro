import { useTranslation } from 'react-i18next'
import { Field } from '@/shared/ui'

type DrawingFileInputProps = {
  id: string
  /** The chosen file and its text, to open in the constructor. */
  onChange: (file: File, json: string) => void
}

/** A drawing file (JSON) for the constructor — the old forms' second «Загрузить файл». */
export function DrawingFileInput({ id, onChange }: DrawingFileInputProps) {
  const { t } = useTranslation()
  return (
    <Field label={t('webcc.json_file')} htmlFor={id}>
      <input
        id={id}
        type="file"
        accept=".json,application/json,text/plain"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) onChange(file, await file.text())
        }}
        className="block w-full text-sm text-muted file:mr-3 file:h-9 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:font-medium file:text-fg hover:file:border-primary"
      />
    </Field>
  )
}
