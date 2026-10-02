import { useEffect, useState } from 'react'
import { learningService } from '../../services/learning/defaultLearningService'
import { LEARNING_UPDATED_EVENT, learningStorageKey } from '../../services/persistence/learningRepository'
import type { UserLearningProfile } from './types'

function readProfile(userId: string): { profile: UserLearningProfile | null; error: string } {
  try { return { profile: learningService.getProfile(userId), error: '' } }
  catch (error) { return { profile: null, error: error instanceof Error ? error.message : 'Progres tidak dapat dimuat.' } }
}

export function useLearningProgress(userId: string) {
  const [state, setState] = useState(() => readProfile(userId))
  useEffect(() => {
    const refresh = () => setState(readProfile(userId))
    const onUpdate = (event: Event) => {
      if ((event as CustomEvent<{ userId: string }>).detail.userId === userId) refresh()
    }
    const onStorage = (event: StorageEvent) => { if (event.key === learningStorageKey(userId)) refresh() }
    window.addEventListener(LEARNING_UPDATED_EVENT, onUpdate)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(LEARNING_UPDATED_EVENT, onUpdate); window.removeEventListener('storage', onStorage) }
  }, [userId])
  return state
}
