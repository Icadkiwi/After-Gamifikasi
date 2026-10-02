import { useEffect, useState } from 'react'
import { competencies, masteryLabels } from '../../learning/competencies/competencies'
import { assessments, learningChallenges, learningModules } from '../../learning/modules/catalog'
import { summarizeLearning } from '../../learning/progress/profile'
import { useLearningProgress } from '../../learning/progress/useLearningProgress'
import { learningService } from '../../services/learning/defaultLearningService'
import { useGamification } from '../../gamification/rewards/useGamification'
import { useAchievements } from '../../gamification/achievements/useAchievements'
import { useCityProgress } from '../../game/useCityProgress'
import { learningCityUnlocks } from '../../game/city/learningUnlocks'
import { DailyRewardLimitCard } from '../gamification/DailyRewardLimitCard'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { AssessmentForm } from './AssessmentForm'

type Tab = 'overview' | 'path' | 'history'
type Activity = { assessmentId: string; challengeId?: string; purpose: 'initial' | 'practice' | 'reassessment' }

export function LearningDashboard({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { profile, error: loadError } = useLearningProgress(userId)
  const gamification = useGamification(userId)
  const achievements = useAchievements(userId)
  const city = useCityProgress(userId)
  const [tab, setTab] = useState<Tab>('overview')
  const [activity, setActivity] = useState<Activity | null>(null)
  const [readModuleId, setReadModuleId] = useState<string | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      try { learningService.reconcile(userId) }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Hadiah belum dapat diselaraskan.') }
    })
    return () => { active = false }
  }, [userId])
  const progress = profile ? summarizeLearning(profile) : null
  const recommendation = profile ? learningService.recommend(userId) : null
  const currentAssessment = assessments.find((item) => item.id === activity?.assessmentId)
  const reading = learningModules.find((item) => item.id === readModuleId)
  const buttonTab = (id: Tab, label: string) => <Button key={id} variant={tab === id ? 'default' : 'outline'} aria-pressed={tab === id} onClick={() => { setTab(id); setActivity(null); setReadModuleId(null); setError('') }}>{label}</Button>

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="z-[1000] flex h-[90dvh] max-w-[calc(100%-1rem)] flex-col overflow-hidden sm:max-w-5xl" showCloseButton={false}>
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between gap-3"><DialogTitle>Dasbor Pembelajaran</DialogTitle><Button variant="outline" onClick={onClose}>Kembali ke kota</Button></div>
          <DialogDescription>Belajar literasi keuangan, ukur pemahaman, dan kembangkan kotamu.</DialogDescription>
        </DialogHeader>
        <div className="flex shrink-0 flex-wrap gap-2" aria-label="Bagian pembelajaran">{buttonTab('overview', 'Ringkasan')}{buttonTab('path', 'Jalur Belajar')}{buttonTab('history', 'Riwayat Belajar')}</div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm">Mode demonstrasi: penilaian dan rekomendasi berbasis aturan. Dua materi contoh tersedia; materi dan soal belum ditinjau ahli. AI/RAG belum aktif.</p>
          {(error || loadError) && <p role="alert" className="text-destructive">{error || loadError}</p>}
          {profile && progress && (
            <>
              {activity && currentAssessment ? (
                <AssessmentForm key={currentAssessment.id} assessment={currentAssessment} onBack={() => { setActivity(null); setTab('path') }} onSubmit={(answers, requestId) => {
                  if (activity.purpose === 'initial') return learningService.assess(userId, currentAssessment.id, answers, requestId)
                  if (!activity.challengeId) throw new Error('Tantangan belum dipilih.')
                  return learningService.practice(userId, activity.challengeId, activity.purpose, answers, requestId).evaluation
                }} />
              ) : reading ? (
                <section className="space-y-4">
                  <Button variant="outline" onClick={() => setReadModuleId(null)}>Kembali ke jalur belajar</Button>
                  <h3 className="text-xl font-semibold">{reading.title}</h3>
                  <ul className="list-inside list-disc text-muted-foreground">{reading.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
                  {reading.sections.map((section) => <article key={section.title} className="rounded-lg border border-border p-4"><h4 className="font-semibold">{section.title}</h4><p className="mt-2 leading-7">{section.content}</p></article>)}
                  <p className="text-sm text-muted-foreground">Materi demonstrasi internal; belum memiliki sumber kurasi terverifikasi. Membaca materi belum menaikkan skor penguasaan.</p>
                  <Button onClick={() => { try { learningService.readModule(userId, reading.id); setReadModuleId(null); setTab('path') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal menyimpan progres.') } }}>Sudah membaca, lanjutkan latihan</Button>
                </section>
              ) : tab === 'overview' ? (
                <>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Summary label="Skor kompetensi terukur" value={profile.overallScore === null ? 'Belum diukur' : `${profile.overallScore}/100`} />
                    <Summary label="Level pemain / EXP" value={`${gamification?.stats.level ?? 1} / ${gamification?.stats.exp ?? 0}`} />
                    <Summary label="Materi dikuasai" value={`${progress.completedLessons}/${learningModules.length}`} />
                    <Summary label="Tantangan selesai" value={`${progress.completedChallenges}/${learningChallenges.length}`} />
                  </div>
                  <p className="text-sm text-muted-foreground">Cakupan asesmen: {progress.assessedCompetencies} dari {competencies.length} kompetensi. Skor hanya merangkum kompetensi yang telah diukur.</p>
                  <section className="rounded-lg bg-accent p-4"><h3 className="font-semibold">Langkah berikutnya</h3><p className="mt-2">{recommendation?.explanation}</p><p className="mt-2 text-sm text-muted-foreground">{recommendation?.reason}</p><Button className="mt-3" onClick={() => profile.lastAssessmentId ? setTab('path') : setActivity({ assessmentId: 'initial-v1', purpose: 'initial' })}>{profile.lastAssessmentId ? 'Buka jalur belajar' : 'Mulai asesmen awal'}</Button></section>
                  <section><h3 className="mb-3 font-semibold">Penguasaan Kompetensi</h3><div className="grid gap-3 sm:grid-cols-2">{competencies.map((competency) => {
                    const record = profile.competencies[competency.id]
                    return <article key={competency.id} className="rounded-lg border border-border p-3"><div className="flex justify-between gap-2"><h4 className="font-medium">{competency.name}</h4><span>{record?.score === null || record?.score === undefined ? '—' : `${record.score}%`}</span></div><p className="mt-1 text-sm text-muted-foreground">{masteryLabels[record?.masteryLevel ?? 'unassessed']}</p><progress className="mt-2 h-2 w-full accent-emerald-500" max={100} value={record?.score ?? 0} aria-label={`Penguasaan ${competency.name}`} /></article>
                  })}</div></section>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Summary label="Pencapaian" value={`${achievements.unlockedCount}/${achievements.totalCount}`} /><Summary label="Level kota" value={String(city.cityLevel)} /><Summary label="Bangunan" value={String(city.buildingCount)} /><Summary label="Koin pasif / jam" value={String(city.passiveIncomePerHour)} /></div>
                  <section className="rounded-lg border border-border p-4"><h3 className="font-semibold">Fitur Kota dari Pembelajaran</h3>{learningCityUnlocks.map((unlock) => <p key={unlock.shopKey} className="mt-2 text-sm">{unlock.shopKey === 'coffee_shop' ? 'Kedai Kopi' : 'Kantor Polisi'}: {profile.completedChallenges.includes(unlock.challengeId) ? 'Terbuka di toko; pembelian memakai koin.' : unlock.label}</p>)}</section>
                  {gamification && <DailyRewardLimitCard dailyLimit={gamification.dailyLimit} />}
                </>
              ) : tab === 'path' ? (
                <section className="space-y-4">
                  {!profile.lastAssessmentId && <Button onClick={() => setActivity({ assessmentId: 'initial-v1', purpose: 'initial' })}>Mulai asesmen awal</Button>}
                  {learningModules.map((module) => {
                    const challenge = learningChallenges.find((item) => item.moduleId === module.id)
                    const locked = !profile.lastAssessmentId || !module.prerequisiteModuleIds.every((id) => profile.completedModules.includes(id))
                    const hasRead = profile.readModules.includes(module.id)
                    const latestPractice = profile.practiceResults.filter((item) => item.challengeId === challenge?.id && item.evaluation.purpose === 'practice').at(-1)
                    const cityLocked = city.cityLevel < (challenge?.requiredCityLevel ?? 1)
                    return <article key={module.id} className="space-y-3 rounded-lg border border-border p-4">
                      <h3 className="font-semibold">{module.title}{profile.completedModules.includes(module.id) ? ' — Dikuasai' : ''}</h3>
                      <p className="text-sm text-muted-foreground">{challenge?.scenario}</p>
                      {locked && <p className="text-sm">Selesaikan asesmen awal dan materi prasyarat untuk membuka materi ini.</p>}
                      {cityLocked && <p className="text-sm">Tantangan memerlukan kota level {challenge?.requiredCityLevel}. Gunakan hadiah belajar untuk meningkatkan Bank.</p>}
                      <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={locked} onClick={() => setReadModuleId(module.id)}>Baca materi</Button><Button disabled={locked || !hasRead || !challenge || cityLocked} onClick={() => challenge && setActivity({ assessmentId: challenge.practiceAssessmentId, challengeId: challenge.id, purpose: 'practice' })}>Latihan skenario</Button><Button variant="secondary" disabled={locked || !latestPractice?.passed || !challenge || cityLocked} onClick={() => challenge && setActivity({ assessmentId: challenge.reassessmentId, challengeId: challenge.id, purpose: 'reassessment' })}>Asesmen ulang</Button></div>
                      <p className="text-xs text-muted-foreground">Lulus asesmen ulang menyelesaikan materi dan tantangan. Hadiah utama hanya sekali per tantangan, dibatasi kapasitas Bank dan batas Berlian. Pengulangan tetap tersedia untuk belajar.</p>
                    </article>
                  })}
                </section>
              ) : <section><h3 className="mb-3 font-semibold">Riwayat Belajar</h3>{profile.history.length === 0 ? <p>Belum ada aktivitas belajar.</p> : <ol className="space-y-3">{profile.history.slice().reverse().map((entry) => <li key={entry.id} className="rounded-lg border border-border p-3"><p className="font-medium">{entry.title}{entry.score === undefined ? '' : ` — ${entry.score}/100`}</p><p className="text-sm text-muted-foreground">{new Date(entry.occurredAt).toLocaleString('id-ID')}</p></li>)}</ol>}</section>}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>
}
