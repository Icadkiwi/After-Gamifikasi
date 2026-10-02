import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { Worker } from 'node:worker_threads'
import {
  buildingDefinitions,
  getBuildingDefinition,
  hasBuildingCapability,
  getBuildingCategory,
} from '../src/gamification/buildings/buildingRoles.ts'
import { createLearningProfile } from '../src/learning/progress/profile.ts'
import { LocalLearningRepository } from '../src/services/persistence/learningRepository.ts'
import { getUserStats } from '../src/gamification/rewards/gamificationService.ts'
import { getShopItemSellPrice } from '../src/gamification/rewards/shopEconomy.ts'
import { gameEvents } from '../src/game/GameEvents.ts'
import { cityStorageKey } from '../src/game/city/storage.ts'
import { getStoredCityProgress } from '../src/game/cityProgress.ts'
import { learningCityUnlocks, getLearningUnlockRequirement } from '../src/game/city/learningUnlocks.ts'
import { getBuildingInfo } from '../src/game/buildingInfo.ts'
import { PASSIVE_INCOME_PER_HOUR, getPassiveIncomePerHourForKey } from '../src/game/passiveIncomeConfig.ts'
import { getBankCapacity, getBankUpgradeCost } from '../src/game/bankConfig.ts'
import { getCityBuildingUpgradeCost } from '../src/game/buildingUpgradeConfig.ts'
import { hasBuilding, isMatchingBuilding, getRequiredVehicleForBuildingLevel3 } from '../src/game/vehicleUnlockLogic.ts'
import { vehicleDefinitions } from '../src/game/vehicleConfig.ts'

// The repository runs tests in one process; set up state inside each stateful test
// so other files' root beforeEach hooks cannot replace this storage snapshot.
function setupStorage() {
  const storedValues = new Map()
  globalThis.localStorage = {
    getItem: (key) => storedValues.get(key) ?? null,
    setItem: (key, value) => storedValues.set(key, String(value)),
    removeItem: (key) => storedValues.delete(key),
    clear: () => storedValues.clear(),
  }
  globalThis.window = Object.assign(new EventTarget(), { setTimeout, clearTimeout })
  return storedValues
}

const assetKeys = (folder) => readdirSync(new URL(`../MBS_Toony_021523u/png/${folder}/`, import.meta.url))
  .filter((name) => /\.(png|jpe?g)$/i.test(name))
  .map((name) => name.replace(/\.(png|jpe?g)$/i, ''))

function readAllDefinitions() {
  for (const { buildingId } of buildingDefinitions) {
    getBuildingDefinition(buildingId)
    getBuildingCategory(buildingId)
    for (const capability of ['coin_capacity', 'passive_income', 'vehicle_requirement']) {
      hasBuildingCapability(buildingId, capability)
    }
  }
}

test('bank describes its existing capacity utility and vehicle requirement role', () => {
  assert.equal(getBuildingCategory('bank'), 'functional')
  assert.deepEqual(getBuildingDefinition('bank'), {
    buildingId: 'bank', category: 'functional', capabilities: ['coin_capacity', 'vehicle_requirement'],
  })
  assert.equal(hasBuildingCapability('bank', 'coin_capacity'), true)
  assert.equal(hasBuildingCapability('bank', 'passive_income'), false)
  assert.equal(getBankCapacity(1), 1000)
})

test('police role uses the real shop key, not a building type or old blue-building alias', () => {
  assert.equal(getBuildingCategory('building_xl_white'), 'economic_game')
  assert.equal(hasBuildingCapability('building_xl_white', 'passive_income'), true)
  assert.equal(hasBuildingCapability('building_xl_white', 'vehicle_requirement'), true)
  assert.equal(getBuildingDefinition('police_station'), undefined)
  assert.equal(hasBuildingCapability('building_medium_blue', 'vehicle_requirement'), false)
})

test('commercial and service buildings describe the current passive city economy', () => {
  for (const key of ['mini_mart', 'coffee_shop', 'donut_shop', 'pizzeria', 'gas_station', 'hospital', 'barber_shop', 'fire_station']) {
    assert.equal(getBuildingCategory(key), 'economic_game')
    assert.equal(hasBuildingCapability(key, 'passive_income'), true)
  }
  assert.equal(getBuildingCategory('house_large_green'), 'economic_game')
  assert.equal(hasBuildingCapability('house_large_green', 'passive_income'), false)
})

test('visual buildings and placeable decorations remain cosmetic', () => {
  for (const key of ['building_small__yellow', 'building_medium_blue', 'warehouse_red', 'house_small_red', 'fence_wire', 'water_tower']) {
    assert.equal(getBuildingCategory(key), 'cosmetic')
    assert.equal(getBuildingDefinition(key).capabilities, undefined)
  }
})

test('unknown, instance, texture and invalid IDs are safe and never coerced', () => {
  const invalidIds = [undefined, null, false, 0, NaN, [], {}, Symbol('bank'), new String('bank'),
    '', 'unknown-building', 'Bank', ' bank ', 'starter-bank', 'shop-building-mini-mart',
    '__proto__', 'constructor', 'toString', { toString() { throw new Error('Do not coerce') } }]
  for (const input of invalidIds) {
    assert.equal(getBuildingDefinition(input), undefined)
    assert.equal(getBuildingCategory(input), undefined)
    assert.equal(hasBuildingCapability(input, 'coin_capacity'), false)
  }
})

test('absent capabilities and unsupported future functions return false', () => {
  for (const key of ['fence_wire', 'unknown-building']) {
    assert.equal(hasBuildingCapability(key, 'passive_income'), false)
  }
  for (const capability of [undefined, null, {}, [], Symbol('capacity'), 'avatar_customization', 'streak_freeze', '__proto__']) {
    assert.equal(hasBuildingCapability('bank', capability), false)
  }
  assert.equal(getBuildingDefinition('financial_academy'), undefined)
})

test('functional presentation buildings describe city progress and learning navigation without numeric capabilities', () => {
  for (const key of ['Classic City Hall Icon', 'Hand-Sketched Cartoon School Building']) {
    assert.equal(getBuildingCategory(key), 'functional')
    assert.equal(getBuildingDefinition(key).capabilities, undefined)
    assert.equal(hasBuildingCapability(key, 'passive_income'), false)
  }
  // The alias used by an earlier design never became a real asset key.
  assert.equal(getBuildingDefinition('city_hall'), undefined)
})

test('catalog covers actual building assets and contains no invented or duplicate shop IDs', () => {
  const buildings = assetKeys('Buildings').filter((key) => !key.includes('background'))
  const assets = new Set([...buildings, ...assetKeys('Props')])
  const ids = buildingDefinitions.map((definition) => definition.buildingId)
  assert.equal(new Set(ids).size, ids.length)
  for (const key of buildings) assert.ok(getBuildingDefinition(key), `Unclassified building: ${key}`)
  for (const key of ids) assert.ok(assets.has(key), `Not an existing asset key: ${key}`)
})

test('definitions contain only city roles and capabilities, with no curriculum assignments', () => {
  for (const definition of buildingDefinitions) {
    assert.ok(['functional', 'economic_game', 'cosmetic'].includes(definition.category))
    for (const field of Object.keys(definition)) {
      assert.ok(['buildingId', 'category', 'capabilities'].includes(field), field)
    }
  }
  const source = readFileSync(new URL('../src/gamification/buildings/buildingRoles.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /(?:competencyId|moduleId|challengeId|learningPurpose|\/learning\/)/)
})

test('passive income capabilities match existing economy configuration exactly', () => {
  const incomeIds = buildingDefinitions.filter(({ buildingId }) => hasBuildingCapability(buildingId, 'passive_income')).map(({ buildingId }) => buildingId)
  assert.deepEqual(incomeIds.sort(), Object.keys(PASSIVE_INCOME_PER_HOUR).sort())
})

test('vehicle requirement capabilities reflect available vehicles without inventing a fire truck unlock', () => {
  const requirements = vehicleDefinitions.filter((vehicle) => !vehicle.unavailable)
    .map((vehicle) => vehicle.unlockRequirement)
    .filter((requirement) => requirement.type === 'buildingLevel' || requirement.type === 'buildingAvailable')
  for (const { buildingId } of buildingDefinitions) {
    const required = requirements.some((requirement) => isMatchingBuilding({ shopKey: buildingId }, requirement.buildingKey))
    assert.equal(hasBuildingCapability(buildingId, 'vehicle_requirement'), required, buildingId)
  }
  assert.equal(hasBuildingCapability('fire_station', 'vehicle_requirement'), false)
})

test('runtime consumers cannot mutate definitions, nested capabilities or the catalog', () => {
  assert.ok(Object.isFrozen(buildingDefinitions))
  for (const definition of buildingDefinitions) {
    assert.ok(Object.isFrozen(definition))
    assert.throws(() => { definition.category = 'cosmetic' }, TypeError)
    if (definition.capabilities) {
      assert.ok(Object.isFrozen(definition.capabilities))
      assert.throws(() => definition.capabilities.push('coin_capacity'), TypeError)
    }
  }
  assert.throws(() => buildingDefinitions.pop(), TypeError)
  assert.deepEqual(getBuildingDefinition('mini_mart').capabilities, ['passive_income'])
})

for (const savedProfile of [false, true]) {
  test(`reads preserve mastery, currency, EXP, ownership, unlocks and rewards (${savedProfile ? 'existing save' : 'new learner'})`, (t) => {
    const storedValues = setupStorage()
    const fixture = JSON.parse(readFileSync(new URL('./fixtures/pre-single-agent-save.json', import.meta.url), 'utf8'))
    const uid = savedProfile ? fixture.userId : 'step1-learner'
    const repository = new LocalLearningRepository()
    if (savedProfile) {
      for (const [key, value] of Object.entries(fixture.storage)) localStorage.setItem(key, value)
    } else {
      repository.save(createLearningProfile(uid))
    }
    const snapshot = () => ({
      profile: repository.load(uid), stats: getUserStats(uid), city: getStoredCityProgress(uid),
      unlocks: learningCityUnlocks.map(({ shopKey }) => getLearningUnlockRequirement(shopKey, repository.load(uid))),
      storage: [...storedValues],
    })
    const before = snapshot()
    const calls = [
      ...['getItem', 'setItem', 'removeItem', 'clear'].map((method) => t.mock.method(localStorage, method)),
      t.mock.method(window, 'dispatchEvent'), t.mock.method(gameEvents, 'dispatchEvent'),
    ]
    readAllDefinitions()
    readAllDefinitions()
    for (const call of calls) assert.equal(call.mock.callCount(), 0)
    assert.deepEqual(snapshot(), before)
  })
}

test('catalog imports and queries without browser globals, React, Phaser or learning catalogs', { timeout: 10000 }, async (t) => {
  const catalogUrl = new URL('../src/gamification/buildings/buildingRoles.ts', import.meta.url).href
  // A fresh worker avoids cached dependencies and the integration tests' loader.
  const script = `
    import assert from 'node:assert/strict'
    import { registerHooks } from 'node:module'
    const catalogUrl = ${JSON.stringify(catalogUrl)}
    registerHooks({ resolve(specifier, context, nextResolve) {
      if (context.parentURL === catalogUrl) throw new Error('Catalog dependency: ' + specifier)
      return nextResolve(specifier, context)
    } })
    for (const key of ['window', 'document', 'localStorage']) {
      Object.defineProperty(globalThis, key, { get() { throw new Error(key + ' unavailable') } })
    }
    const catalog = await import(catalogUrl)
    for (const { buildingId } of catalog.buildingDefinitions) {
      assert.ok(catalog.getBuildingDefinition(buildingId))
      assert.ok(catalog.getBuildingCategory(buildingId))
      catalog.hasBuildingCapability(buildingId, 'passive_income')
    }
    assert.equal(catalog.getBuildingCategory('bank'), 'functional')
    assert.equal(catalog.getBuildingDefinition(null), undefined)
  `
  const worker = new Worker(new URL('data:text/javascript,' + encodeURIComponent(script)), { execArgv: [] })
  t.after(() => worker.terminate())
  await new Promise((resolve, reject) => {
    worker.once('error', reject)
    worker.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`Isolated catalog test exited with ${code}`)))
  })
})

test('role queries leave existing city count, income, upgrades, sell values and vehicle requirements intact', () => {
  setupStorage()
  const uid = 'step1-city'
  localStorage.setItem(cityStorageKey('after-gamifikasi-shop-placeables', uid), JSON.stringify([
    { key: 'mini_mart', type: 'building', level: 2 },
    { key: 'building_xl_white', type: 'building', buildingType: 'police_station', level: 2 },
    { key: 'house_large_green', type: 'building', buildingType: 'large_house', level: 1 },
    { key: 'building_medium_blue', type: 'building', level: 1 },
    { key: 'fence_wire', type: 'decoration', level: 1 },
  ]))
  localStorage.setItem(cityStorageKey('after-gamifikasi-economy-state', uid), JSON.stringify({ bankLevel: 2, barberLevel: 1 }))
  const before = getStoredCityProgress(uid)
  readAllDefinitions()
  assert.deepEqual(getStoredCityProgress(uid), before)
  assert.deepEqual(before, { buildingCount: 4, vehicleNpcCount: 0, passiveIncomePerHour: 79, cityLevel: 2 })
  assert.equal(getPassiveIncomePerHourForKey('mini_mart', 2), 24)
  assert.equal(getBuildingInfo('building_xl_white').levels[1].incomePerHour, 55)
  assert.equal(getBuildingInfo('building_medium_blue'), undefined)
  assert.equal(getBankCapacity(2), 2500)
  assert.equal(getBankUpgradeCost(1), 700)
  assert.equal(getCityBuildingUpgradeCost('police_station', 1), 500)
  assert.equal(getShopItemSellPrice({ price: 2500 }), 1250)
  assert.equal(hasBuilding('large_house', uid), true)
  assert.equal(getRequiredVehicleForBuildingLevel3('police_station'), 'police_car')
})
