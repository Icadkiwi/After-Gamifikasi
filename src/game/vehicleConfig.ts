import ambulanceUrl from '../../MBS_Toony_021523u/png/Vehicles/ambulance.png'
import carBlueUrl from '../../MBS_Toony_021523u/png/Vehicles/car_blue.png'
import carRedUrl from '../../MBS_Toony_021523u/png/Vehicles/car_red.png'
import policeCarUrl from '../../MBS_Toony_021523u/png/Vehicles/police_car.png'
import taxiUrl from '../../MBS_Toony_021523u/png/Vehicles/taxi.png'
import vanBlackUrl from '../../MBS_Toony_021523u/png/Vehicles/van_black.png'
import vanWhiteUrl from '../../MBS_Toony_021523u/png/Vehicles/van_white.png'

export type VehicleType =
  | 'taxi'
  | 'ambulance'
  | 'police_car'
  | 'fire_truck'
  | 'van_black'
  | 'van_white'
  | 'car_blue'
  | 'car_red'

export type VehicleUnlockRequirement =
  | {
      type: 'none'
      label: string
    }
  | {
      type: 'buildingLevel'
      buildingKey: string
      buildingName: string
      level: number
      label: string
    }
  | {
      type: 'buildingAvailable'
      buildingKey: string
      buildingName: string
      label: string
    }
  | {
      type: 'assetMissing'
      label: string
    }

export type VehicleDefinition = {
  key: string
  vehicleType: VehicleType
  name: string
  price: number
  assetKey: string
  imageUrl: string
  description: string
  unlockRequirement: VehicleUnlockRequirement
  linkedBuildingKey?: string
  limitGroup?: string
  bonusDescription: string
  unavailable?: boolean
}

export type VehicleVisualConfig = {
  scale: number
  mobileScale: number
  yOffset: number
  speedMin: number
  speedMax: number
  shadowWidthRatio: number
  shadowHeight: number
}

export const vehicleDefinitions: VehicleDefinition[] = [
  {
    key: 'vehicle-taxi',
    vehicleType: 'taxi',
    name: 'Taxi',
    price: 120,
    assetKey: 'vehicle-taxi',
    imageUrl: taxiUrl,
    description: 'Kendaraan mentor yang membuat kota terasa hidup.',
    unlockRequirement: {
      type: 'none',
      label: 'Available from start',
    },
    bonusDescription: 'City life visual + NPC mission access.',
  },
  {
    key: 'vehicle-ambulance',
    vehicleType: 'ambulance',
    name: 'Ambulance',
    price: 220,
    assetKey: 'vehicle-ambulance',
    imageUrl: ambulanceUrl,
    description: 'Kendaraan service untuk Hospital.',
    unlockRequirement: {
      type: 'buildingLevel',
      buildingKey: 'hospital',
      buildingName: 'Hospital',
      level: 2,
      label: 'Requires Hospital LV2',
    },
    linkedBuildingKey: 'hospital',
    limitGroup: 'hospital',
    bonusDescription: 'Required for Hospital LV3.',
  },
  {
    key: 'vehicle-police-car',
    vehicleType: 'police_car',
    name: 'Police Car',
    price: 220,
    assetKey: 'vehicle-police-car',
    imageUrl: policeCarUrl,
    description: 'Kendaraan service untuk Police Station.',
    unlockRequirement: {
      type: 'buildingLevel',
      buildingKey: 'police_station',
      buildingName: 'Police Station',
      level: 2,
      label: 'Requires Police Station LV2',
    },
    linkedBuildingKey: 'police_station',
    limitGroup: 'police_station',
    bonusDescription: 'Required for Police Station LV3.',
  },
  {
    key: 'vehicle-fire-truck',
    vehicleType: 'fire_truck',
    name: 'Fire Truck',
    price: 240,
    assetKey: 'vehicle-fire-truck',
    imageUrl: '',
    description: 'Kendaraan service untuk Fire Station.',
    unlockRequirement: {
      type: 'assetMissing',
      label: 'Vehicle asset fire_truck.png belum tersedia',
    },
    linkedBuildingKey: 'fire_station',
    limitGroup: 'fire_station',
    bonusDescription: 'Required for Fire Station LV3.',
    unavailable: true,
  },
  {
    key: 'vehicle-van-black',
    vehicleType: 'van_black',
    name: 'Van Black',
    price: 180,
    assetKey: 'vehicle-van-black',
    imageUrl: vanBlackUrl,
    description: 'Van kota untuk aktivitas ekonomi.',
    unlockRequirement: {
      type: 'buildingLevel',
      buildingKey: 'bank',
      buildingName: 'Bank',
      level: 2,
      label: 'Requires Bank LV2',
    },
    linkedBuildingKey: 'bank',
    bonusDescription: 'Small city commerce visual buff.',
  },
  {
    key: 'vehicle-van-white',
    vehicleType: 'van_white',
    name: 'Van White',
    price: 180,
    assetKey: 'vehicle-van-white',
    imageUrl: vanWhiteUrl,
    description: 'Van kota untuk aktivitas ekonomi.',
    unlockRequirement: {
      type: 'buildingLevel',
      buildingKey: 'bank',
      buildingName: 'Bank',
      level: 2,
      label: 'Requires Bank LV2',
    },
    linkedBuildingKey: 'bank',
    bonusDescription: 'Small city commerce visual buff.',
  },
  {
    key: 'vehicle-car-blue',
    vehicleType: 'car_blue',
    name: 'Car Blue',
    price: 140,
    assetKey: 'vehicle-car-blue',
    imageUrl: carBlueUrl,
    description: 'Mobil warga untuk membuat kota lebih ramai.',
    unlockRequirement: {
      type: 'buildingAvailable',
      buildingKey: 'house_large',
      buildingName: 'Large House',
      label: 'Requires Large House',
    },
    linkedBuildingKey: 'house_large',
    bonusDescription: 'Adds citizen traffic to the city.',
  },
  {
    key: 'vehicle-car-red',
    vehicleType: 'car_red',
    name: 'Car Red',
    price: 140,
    assetKey: 'vehicle-car-red',
    imageUrl: carRedUrl,
    description: 'Mobil warga untuk membuat kota lebih ramai.',
    unlockRequirement: {
      type: 'buildingAvailable',
      buildingKey: 'house_large',
      buildingName: 'Large House',
      label: 'Requires Large House',
    },
    linkedBuildingKey: 'house_large',
    bonusDescription: 'Adds citizen traffic to the city.',
  },
]

export const vehicleVisualConfig: Record<VehicleType, VehicleVisualConfig> = {
  taxi: {
    scale: 0.54,
    mobileScale: 0.48,
    yOffset: 0,
    speedMin: 42,
    speedMax: 58,
    shadowWidthRatio: 0.72,
    shadowHeight: 7,
  },
  ambulance: {
    scale: 0.58,
    mobileScale: 0.52,
    yOffset: 0,
    speedMin: 38,
    speedMax: 52,
    shadowWidthRatio: 0.75,
    shadowHeight: 8,
  },
  police_car: {
    scale: 0.55,
    mobileScale: 0.49,
    yOffset: 0,
    speedMin: 46,
    speedMax: 62,
    shadowWidthRatio: 0.72,
    shadowHeight: 7,
  },
  fire_truck: {
    scale: 0.62,
    mobileScale: 0.55,
    yOffset: 0,
    speedMin: 34,
    speedMax: 46,
    shadowWidthRatio: 0.78,
    shadowHeight: 8,
  },
  van_black: {
    scale: 0.6,
    mobileScale: 0.54,
    yOffset: 0,
    speedMin: 34,
    speedMax: 48,
    shadowWidthRatio: 0.76,
    shadowHeight: 8,
  },
  van_white: {
    scale: 0.6,
    mobileScale: 0.54,
    yOffset: 0,
    speedMin: 34,
    speedMax: 48,
    shadowWidthRatio: 0.76,
    shadowHeight: 8,
  },
  car_blue: {
    scale: 0.52,
    mobileScale: 0.47,
    yOffset: 0,
    speedMin: 44,
    speedMax: 60,
    shadowWidthRatio: 0.7,
    shadowHeight: 7,
  },
  car_red: {
    scale: 0.52,
    mobileScale: 0.47,
    yOffset: 0,
    speedMin: 44,
    speedMax: 60,
    shadowWidthRatio: 0.7,
    shadowHeight: 7,
  },
}

export function getVehicleDefinitionByKey(key: string) {
  return vehicleDefinitions.find((vehicle) => vehicle.key === key)
}

export function getVehicleDefinitionByType(vehicleType: VehicleType) {
  return vehicleDefinitions.find((vehicle) => vehicle.vehicleType === vehicleType)
}

export function isVehicleShopKey(key: string) {
  return vehicleDefinitions.some((vehicle) => vehicle.key === key)
}
