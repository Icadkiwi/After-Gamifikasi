export type CityNarrativeEvent = Readonly<{
  eventId: string
  kind:
    | 'city-introduction'
    | 'milestone-reached'
    | 'assessment-completed'
    | 'streak-milestone'
  title: string
  message: string
}>

// CD1 narrative contract: deterministic payloads that the UI (and, later, the
// Financial Literacy Agent) can present. This module never claims to be AI;
// it produces plain application copy from authoritative state transitions.
export function createCityIntroductionNarrative(cityLevel: number): CityNarrativeEvent {
  return {
    eventId: `city-introduction:lv${cityLevel}`,
    kind: 'city-introduction',
    title: 'Selamat Datang di Financial City',
    message:
      'Kamu adalah pengelola Financial City. Setiap kemajuan belajar literasi keuangammu tumbuh menjadi kota yang lebih hidup. Mulai dari Balai Kota untuk melihat perkembangan kotamu.',
  }
}

export function createMilestoneNarrative(cityLevel: number): CityNarrativeEvent {
  return {
    eventId: `city-milestone:lv${cityLevel}`,
    kind: 'milestone-reached',
    title: `Financial City Mencapai Level ${cityLevel}`,
    message:
      'Perkembangan kotamu adalah cerminan perjalanan belajarmu. Terus ikuti misi belajar untuk melihat kota ini semakin ramai.',
  }
}
