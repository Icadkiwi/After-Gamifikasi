import { useEffect, useState } from 'react'

import {
  getStoredCityProgress,
  subscribeCityProgress,
} from './cityProgress'
import { emitGameEvent, type CityProgressState } from './GameEvents'

export function useCityProgress(userId: string) {
  const [cityProgress, setCityProgress] = useState<CityProgressState>(() =>
    getStoredCityProgress(userId),
  )

  useEffect(() => {
    const unsubscribe = subscribeCityProgress(userId, setCityProgress)

    emitGameEvent('REQUEST_CITY_PROGRESS', {})

    return unsubscribe
  }, [userId])

  return cityProgress
}
