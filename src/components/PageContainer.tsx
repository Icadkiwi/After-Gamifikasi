import type { ReactNode } from 'react'

type PageContainerProps = {
  title: string
  description: string
  children: ReactNode
}

export function PageContainer({
  title,
  description,
  children,
}: PageContainerProps) {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12">
      <div className="space-y-3">
        <p className="text-sm font-medium text-emerald-700">
          After Gamifikasi
        </p>
        <h1 className="text-3xl font-semibold text-zinc-950 sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-700">
          {description}
        </p>
      </div>

      {children}
    </section>
  )
}
