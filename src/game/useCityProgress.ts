import { useEffect, useState } from 'react'

import {
  getStoredCityProgress,
  subscribeCityProgress,
} from './cityProgress'
import { emitGameEvent, type CityProgressState } from './GameEvents'

export function useCityProgress() {
  const [cityProgress, setCityProgress] = useState<CityProgressState>(() =>
    getStoredCityProgress(),
  )

  useEffect(() => {
    const unsubscribe = subscribeCityProgress(setCityProgress)

    emitGameEvent('REQUEST_CITY_PROGRESS', {})

    return unsubscribe
  }, [])

  return cityProgress
}
