import { useState } from 'react'

type TutorialOnboardingModalProps = {
  onComplete: () => void
  onClose: () => void
}

const tutorialSteps = [
  {
    title: 'Kelola Keuangan',
    body: 'Mulai dengan mencatat pemasukan dan pengeluaranmu.',
  },
  {
    title: 'Jaga Saldo',
    body: 'Atur pengeluaran dengan bijak.',
  },
  {
    title: 'Kerjakan Misi',
    body: 'Selesaikan misi harian.',
  },
  {
    title: 'Dapatkan Hadiah',
    body: 'Kumpulkan EXP, Koin, dan Berlian.',
  },
  {
    title: 'Naikkan Level',
    body: 'Perkembangan finansial menaikkan level kota.',
  },
  {
    title: 'Belanja di Toko',
    body: 'Beli bangunan dan dekorasi.',
  },
  {
    title: 'Bangun Kota',
    body: 'Ciptakan kota impianmu.',
  },
]

export function TutorialOnboardingModal({
  onComplete,
  onClose,
}: TutorialOnboardingModalProps) {
  const [activeStep, setActiveStep] = useState(0)
  const step = tutorialSteps[activeStep]
  const isLastStep = activeStep === tutorialSteps.length - 1

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center overflow-y-auto bg-slate-950/45 px-3 py-4 backdrop-blur-md">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 shadow-2xl sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-600">
              TUTORIAL {activeStep + 1} / {tutorialSteps.length}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950">
              {step.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 active:bg-red-700"
          >
            Tutup
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-zinc-700">
          {step.body}
        </p>

        <div className="mt-5 flex gap-1.5">
          {tutorialSteps.map((tutorialStep, index) => (
            <span
              key={tutorialStep.title}
              className={`h-1.5 flex-1 rounded-full ${
                index <= activeStep ? 'bg-emerald-500' : 'bg-zinc-200'
              }`}
            />
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[auto_1fr_auto]">
          <button
            type="button"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((stepIndex) => stepIndex - 1)}
            className="min-h-12 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 active:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-200 disabled:text-red-800"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="min-h-12 rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-zinc-200 active:bg-zinc-300"
          >
            Lewati Tutorial
          </button>
          <button
            type="button"
            onClick={() => {
              if (isLastStep) {
                onComplete()
                return
              }

              setActiveStep((stepIndex) => stepIndex + 1)
            }}
            className="min-h-12 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 active:bg-emerald-700"
          >
            {isLastStep ? 'Selesai' : 'Lanjut'}
          </button>
        </div>
      </div>
    </div>
  )
}
