export function cityStorageKey(baseKey: string, userId: string) {
  if (!userId.trim()) throw new Error('Kota memerlukan pengguna terautentikasi.')
  return `${baseKey}:user:${encodeURIComponent(userId)}`
}
