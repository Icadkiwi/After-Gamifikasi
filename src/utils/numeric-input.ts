export function parseNumericInput(value: string) {
  const normalized = value.replace(/[^\d]/g, '')

  return normalized ? Number(normalized) : 0
}

export function formatNumericInput(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return ''
  }

  return value.toLocaleString('id-ID')
}
