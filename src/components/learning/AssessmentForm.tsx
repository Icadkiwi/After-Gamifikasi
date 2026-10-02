import { useState } from 'react'
import type { Answer, AssessmentDefinition, AssessmentResult } from '../../learning/assessment/types'
import { Button } from '../ui/button'

export function AssessmentForm({ assessment, onSubmit, onBack }: {
  assessment: AssessmentDefinition
  onSubmit: (answers: Answer[], requestId: string) => AssessmentResult
  onBack: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [error, setError] = useState('')
  const [requestId] = useState(() => crypto.randomUUID())
  return (
    <section className="space-y-4">
      <Button variant="outline" onClick={onBack}>Kembali ke jalur belajar</Button>
      <h3 className="text-xl font-semibold">{assessment.title}</h3>
      <p className="text-sm text-muted-foreground">Soal demonstrasi. Skor mengikuti kunci dan bobot soal; belum merupakan instrumen literasi keuangan tervalidasi.</p>
      <form className="space-y-5" onSubmit={(event) => {
        event.preventDefault()
        if (result) return
        setError('')
        try { setResult(onSubmit(Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })), requestId)) }
        catch (cause) { setError(cause instanceof Error ? cause.message : 'Jawaban belum dapat diproses.') }
      }}>
        {assessment.questions.map((question, index) => (
          <fieldset key={question.id} disabled={Boolean(result)} className="rounded-lg border border-border p-4">
            <legend className="px-1 font-semibold">{index + 1}. {question.prompt}</legend>
            <div className="grid gap-2">
              {question.options.map((option) => (
                <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-md bg-muted p-3">
                  <input className="mt-1" type="radio" name={question.id} value={option.id} checked={answers[question.id] === option.id} required onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {result && <p className="mt-3 text-sm" role="status">{result.evidence.find((item) => item.questionId === question.id)?.correct ? 'Tepat. ' : 'Perlu ditinjau. '}{result.evidence.find((item) => item.questionId === question.id)?.feedback}</p>}
          </fieldset>
        ))}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {result ? <div aria-live="polite" className="rounded-lg bg-accent p-4"><p className="font-semibold">Skor: {result.score}/100</p><p className="mt-1">{result.purpose === 'initial' ? 'Profil awal tersimpan. Lanjutkan ke rekomendasi materi.' : result.score >= 80 ? result.purpose === 'practice' ? 'Latihan lulus. Lanjutkan asesmen ulang untuk menyelesaikan tantangan.' : 'Asesmen ulang lulus. Progres dan hadiah penyelesaian diperbarui.' : 'Pelajari umpan balik, baca kembali materi, lalu coba lagi.'}</p><Button className="mt-3" onClick={onBack} type="button">Lihat progres belajar</Button></div> : <Button type="submit">Kirim jawaban</Button>}
      </form>
    </section>
  )
}
